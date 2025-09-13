# oak1_vibe_v2_enhanced.py — DepthAI < 3.0
import time, json, collections, math
import numpy as np, cv2, depthai as dai, blobconverter

# ---------- helpers ----------
def percentile(a, p): return float(np.percentile(np.asarray(a), p)) if len(a) else 0.0
def ema(prev, x, alpha=0.3): return x if prev is None else (alpha*x + (1-alpha)*prev)
def clip01(x): return float(np.clip(x, 0.0, 1.0))
def normalize(x, lo, hi): return clip01((x - lo) / (hi - lo)) if hi > lo else 0.0

def dir_coherence(angles):
    """1 = everyone moves same direction; 0 = random."""
    if len(angles) == 0: return 0.0
    # circular mean
    mean_vec = np.array([np.mean(np.cos(angles)), np.mean(np.sin(angles))])
    R = np.linalg.norm(mean_vec)
    return float(np.clip(R, 0.0, 1.0))

def compute_bpm(series, fps=10.0, lo=0.5, hi=3.0):
    """Periodicity (0.5–3 Hz) -> BPM (~30–180)."""
    n = len(series)
    if n < int(3*fps): return None
    x = np.asarray(series, dtype=np.float32)
    x = x - x.mean()
    fft = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n, d=1.0/fps)
    band = (freqs >= lo) & (freqs <= hi)
    if not np.any(band): return None
    f = freqs[band][np.argmax(np.abs(fft[band]))]
    return int(np.clip(round((f*60)/5)*5, 90, 160))

# ---------- build pipeline ----------
blob_path = blobconverter.from_zoo(name="mobilenet-ssd", shaves=6)

pipeline = dai.Pipeline()
cam = pipeline.createColorCamera()
cam.setPreviewSize(300, 300)
cam.setInterleaved(False)
cam.setFps(30)

nn = pipeline.createMobileNetDetectionNetwork()
nn.setBlobPath(blob_path)
nn.setConfidenceThreshold(0.5)

tracker = pipeline.createObjectTracker()
# Keep person-only. If your blob uses a different label map, remove the next line to track all.
tracker.setDetectionLabelsToTrack([15])  # 15 = 'person' (VOC)
tracker.setTrackerType(dai.TrackerType.ZERO_TERM_COLOR_HISTOGRAM)
tracker.setTrackerIdAssignmentPolicy(dai.TrackerIdAssignmentPolicy.SMALLEST_ID)

cam.preview.link(nn.input)
nn.passthrough.link(tracker.inputTrackerFrame)
nn.out.link(tracker.inputDetections)

xout_tracks = pipeline.createXLinkOut(); xout_tracks.setStreamName("tracks"); tracker.out.link(xout_tracks.input)
xout_prev   = pipeline.createXLinkOut();   xout_prev.setStreamName("preview"); cam.preview.link(xout_prev.input)

# ---------- run ----------
with dai.Device(pipeline) as device:
    q_tracks = device.getOutputQueue("tracks", maxSize=8, blocking=False)
    q_prev   = device.getOutputQueue("preview", maxSize=8, blocking=False)

    last_pos   = {}                 # track_id -> (cx, cy)
    speed_ema  = {}                 # track_id -> smoothed speed
    angle_last = {}                 # track_id -> last angle (optional)
    energy_hist = collections.deque(maxlen=120)  # ~12s at 10Hz for normalization
    energy_series = collections.deque(maxlen=200) # ~20s for trend/BPM
    vibe_hist   = collections.deque(maxlen=200)  # ~20s for trend
    vibe_ema = None
    last_json = time.time()
    last_draw = time.time()

    EST_FPS = 10.0          # approx sampling of our computed signals
    MOVING_THRESH = 1.5     # pixels/frame considered "active"
    ALPHA_TRACK = 0.5       # per-track speed smoothing
    ALPHA_VIBE = 0.3        # vibe smoothing

    while True:
        in_prev = q_prev.tryGet()
        in_tr   = q_tracks.tryGet()
        if in_prev is None or in_tr is None:
            if cv2.waitKey(1) & 0xFF == 27: break
            continue

        frame = in_prev.getCvFrame(); H, W, _ = frame.shape
        centers = {}
        for t in in_tr.tracklets:
            status_ok = t.status in [dai.ObjectTracker.TrackingStatus.TRACKED,
                                     dai.ObjectTracker.TrackingStatus.NEW]
            if not status_ok: continue
            roi = t.roi.denormalize(W, H)
            x1,y1,x2,y2 = int(roi.topLeft().x), int(roi.topLeft().y), int(roi.bottomRight().x), int(roi.bottomRight().y)
            cx, cy = (x1+x2)*0.5, (y1+y2)*0.5
            centers[t.id] = (cx, cy)
            # draw
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, f"id {t.id}", (x1, max(0,y1-6)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255,255,255), 1)

        # per-track vectors and speeds
        per_speed = []
        per_angle = []  # direction (radians)
        active_count = 0

        for tid, (cx, cy) in centers.items():
            if tid in last_pos:
                dx, dy = cx - last_pos[tid][0], cy - last_pos[tid][1]
                sp = float(np.hypot(dx, dy))              # pixels per frame
                ang = float(np.arctan2(dy, dx)) if (dx != 0 or dy != 0) else 0.0
                speed_ema[tid] = ema(speed_ema.get(tid), sp, alpha=ALPHA_TRACK)
                per_speed.append(speed_ema[tid])
                per_angle.append(ang)
                if speed_ema[tid] > MOVING_THRESH: active_count += 1
            last_pos[tid] = (cx, cy)

        total_people = len(centers)

        # ---------- identifiers ----------
        # 1) energy (avg speed)
        energy = float(np.mean(per_speed)) if per_speed else 0.0

        # 2) engagement (active / total)
        engagement = float(active_count / max(1, total_people))

        # 3) consistency (directional coherence 0..1)
        consistency = dir_coherence(per_angle) if len(per_angle) >= 2 else 0.0

        # 4) normalize energy (auto-calibrate to room)
        energy_hist.append(energy)
        lo, hi = percentile(energy_hist, 10), percentile(energy_hist, 90)
        norm_energy = normalize(energy, lo, hi)

        # 5) fuse into vibe (feel free to tweak weights)
        vibe_raw = 0.5*norm_energy + 0.3*engagement + 0.2*consistency
        vibe_ema = ema(vibe_ema, vibe_raw, alpha=ALPHA_VIBE)
        vibe = clip01(vibe_ema)

        # keep series for BPM + trend
        energy_series.append(energy)
        vibe_hist.append(vibe)

        # bounce BPM from energy periodicity (~10 Hz sampling)
        bounce_bpm = compute_bpm(energy_series, fps=EST_FPS)

        # 6) trend: vibe change over ~20s window
        trend = 0.0
        if len(vibe_hist) >= int(EST_FPS*10):  # need some history
            first = np.mean(list(vibe_hist)[:int(EST_FPS*5)])   # first ~5s
            last  = np.mean(list(vibe_hist)[-int(EST_FPS*5):])  # last ~5s
            trend = float(np.clip(last - first, -1.0, 1.0))     # -1..1

        # ---------- draw ----------
        if time.time() - last_draw >= 1/30:
            overlay = f"vibe={vibe:.2f} E={energy:.2f} Eng={engagement:.2f} Cons={consistency:.2f} ppl={total_people}"
            if bounce_bpm: overlay += f" BPM~{bounce_bpm}"
            cv2.putText(frame, overlay, (8,22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,255,255), 2)
            cv2.imshow("OAK-1 vibe (ESC to quit)", frame)
            last_draw = time.time()

        # ---------- print JSON once/sec ----------
        if time.time() - last_json >= 1.0:
            out = {
                "t": time.time(),
                "vibe": vibe,
                "identifiers": {
                    "engagement": engagement,
                    "energy": energy,
                    "consistency": consistency,
                    "bounce_bpm": bounce_bpm,
                    "trend": trend
                },
                "norm_energy": norm_energy,
                "people": total_people,
                "lo": lo, "hi": hi
            }
            print(json.dumps(out))
            last_json = time.time()

        if cv2.waitKey(1) & 0xFF == 27: break

    cv2.destroyAllWindows()
