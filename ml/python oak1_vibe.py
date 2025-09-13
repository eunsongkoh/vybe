# oak1_vibe_v3.py  — DepthAI 3.0 compatible
import time, json, collections, numpy as np, cv2
import depthai as dai, blobconverter

# ---------- helpers ----------
def percentile(a, p): return float(np.percentile(np.array(a), p)) if len(a) else 0.0
def ema(prev, x, alpha=0.3): return x if prev is None else (alpha*x + (1-alpha)*prev)
def normalize(x, lo, hi): return float(np.clip((x - lo) / (hi - lo), 0.0, 1.0)) if hi>lo else 0.0

def compute_target_bpm(series, fps=10.0):
    if len(series) < int(3*fps): return None
    x = np.array(series, dtype=np.float32); x -= x.mean()
    fft = np.fft.rfft(x); freqs = np.fft.rfftfreq(len(x), d=1.0/fps)
    band = (freqs>=0.5)&(freqs<=3.0)
    if not np.any(band): return None
    f = freqs[band][np.argmax(np.abs(fft[band]))]
    return int(np.clip(round((f*60)/5)*5, 90, 160))

# ---------- build pipeline (v3 style) ----------
blob_path = blobconverter.from_zoo(name="mobilenet-ssd", shaves=6)

pipeline = dai.Pipeline()

cam = pipeline.create(dai.node.ColorCamera)
cam.setPreviewSize(300, 300)
cam.setInterleaved(False)
cam.setFps(30)

nn = pipeline.create(dai.node.MobileNetDetectionNetwork)
nn.setBlobPath(blob_path)
nn.setConfidenceThreshold(0.5)

tracker = pipeline.create(dai.node.ObjectTracker)
# 15 = 'person' in VOC for the mobilenet-ssd blobconverter default
tracker.setDetectionLabelsToTrack([15])
tracker.setTrackerType(dai.TrackerType.ZERO_TERM_COLOR_HISTOGRAM)
tracker.setTrackerIdAssignmentPolicy(dai.TrackerIdAssignmentPolicy.SMALLEST_ID)

# links
cam.preview.link(nn.input)
nn.passthrough.link(tracker.inputTrackerFrame)
nn.out.link(tracker.inputDetections)

xout_tracks = pipeline.create(dai.node.XLinkOut); xout_tracks.setStreamName("tracks"); tracker.out.link(xout_tracks.input)
xout_prev   = pipeline.create(dai.node.XLinkOut); xout_prev.setStreamName("preview"); cam.preview.link(xout_prev.input)

# ---------- run ----------
with dai.Device(pipeline) as device:
    q_tracks = device.getOutputQueue("tracks", maxSize=8, blocking=False)
    q_prev   = device.getOutputQueue("preview", maxSize=8, blocking=False)

    last_pos, speeds = {}, {}
    energy_hist = collections.deque(maxlen=100)
    print_hist  = collections.deque(maxlen=100)
    vibe_ema = None
    last_json = time.time()
    last_draw = time.time()
    est_fps   = 10.0
    MOVING_THRESH = 1.5

    while True:
        in_prev = q_prev.tryGet()
        in_tr   = q_tracks.tryGet()
        if in_prev is None or in_tr is None:
            if cv2.waitKey(1) & 0xFF == 27: break
            continue

        frame = in_prev.getCvFrame(); H, W, _ = frame.shape
        centers = {}
        for t in in_tr.tracklets:
            if t.status not in [dai.Tracklet.TrackingStatus.TRACKED, dai.Tracklet.TrackingStatus.NEW]:
                continue
            roi = t.roi.denormalize(W, H)
            x1,y1,x2,y2 = int(roi.topLeft().x), int(roi.topLeft().y), int(roi.bottomRight().x), int(roi.bottomRight().y)
            cx, cy = (x1+x2)*0.5, (y1+y2)*0.5
            centers[t.id] = (cx, cy)
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, f"id {t.id}", (x1, max(0,y1-6)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255,255,255), 1)

        per_track_speed = []
        for tid,(cx,cy) in centers.items():
            if tid in last_pos:
                dx, dy = cx - last_pos[tid][0], cy - last_pos[tid][1]
                sp = float(np.hypot(dx, dy))
                speeds[tid] = ema(speeds.get(tid), sp, alpha=0.5)
                per_track_speed.append(speeds[tid])
            last_pos[tid] = (cx, cy)

        energy = float(np.mean(per_track_speed)) if per_track_speed else 0.0
        moving_count = sum(1 for s in per_track_speed if s and s > MOVING_THRESH)
        moving_ratio = float(moving_count / max(1, len(centers)))

        energy_hist.append(energy)
        lo, hi = percentile(energy_hist,10), percentile(energy_hist,90)
        norm_energy = normalize(energy, lo, hi)
        vibe_raw = 0.6*norm_energy + 0.4*moving_ratio
        vibe_ema = ema(vibe_ema, vibe_raw, alpha=0.3)
        vibe = float(np.clip(vibe_ema, 0.0, 1.0))

        # accumulate for BPM estimate (~10 Hz)
        print_hist.append(energy)
        if len(print_hist) > int(est_fps*10): print_hist.popleft()

        # draw
        if time.time() - last_draw >= 1/30:
            cv2.putText(frame, f"vibe={vibe:.2f} energy={energy:.2f} moving={moving_ratio:.2f}",
                        (8,22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
            cv2.imshow("OAK-1 vibe (ESC to quit)", frame)
            last_draw = time.time()

        # print JSON once per second
        if time.time() - last_json >= 1.0:
            target_bpm = compute_target_bpm(print_hist, fps=est_fps)
            print(json.dumps({
                "t": time.time(), "vibe": vibe,
                "norm_energy": norm_energy, "moving_ratio": moving_ratio,
                "raw_energy": energy, "lo": lo, "hi": hi,
                "people": len(centers), "target_bpm": target_bpm
            }))
            last_json = time.time()

        if cv2.waitKey(1) & 0xFF == 27: break

    cv2.destroyAllWindows()
