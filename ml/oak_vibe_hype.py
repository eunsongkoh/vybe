import depthai as dai, cv2, numpy as np, time, json, collections
from ..backend.utils.tracks_helpers import (
    get_current_track_details,
    update_current_track,
    update_recommendation,
)
from ..backend.utils.groq_calls import recommend_song


# ---------- helpers ----------
def percentile(a, p):
    return float(np.percentile(np.asarray(a), p)) if len(a) else 0.0


def circ_consistency(angles):
    if angles.size == 0:
        return 0.0
    return float(np.hypot(np.mean(np.cos(angles)), np.mean(np.sin(angles))))


def estimate_bpm(signal, fps):
    n = len(signal)
    if n < int(3 * fps):
        return None
    y = np.array(signal, dtype=np.float32)
    y = y - y.mean()
    s = y / (y.std() + 1e-6)
    spec = np.fft.rfft(s)
    freqs = np.fft.rfftfreq(len(s), d=1.0 / fps)
    band = (freqs >= 1.0) & (freqs <= 3.0)  # 60–180 BPM
    if not np.any(band):
        return None
    peak_idx = np.argmax(np.abs(spec[band]))
    return float(freqs[band][peak_idx] * 60.0)


# ---------- config ----------
PERSON_LABELS = {15, 1}
FLOW_THRESH = 1.0
ALPHA_VIBE = 0.3
ALPHA_TREND = 0.2
ENERGY_W, ENGAGE_W, CONSIST_W = 0.5, 0.3, 0.2
FPS = 30
HIST_LEN = int(6 * FPS)
BPM_BUF_LEN = int(6 * FPS)
PRINT_INTERVAL = 2.0  # seconds between JSON prints
HYPE_THRESHOLD = 0.5  # cutoff for need_hype

# ---------- pipeline ----------
p = dai.Pipeline()
cam = p.createColorCamera()
cam.setPreviewSize(640, 360)  # wide FOV for display
cam.setInterleaved(False)
cam.setFps(FPS)
cam.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)
cam.setPreviewKeepAspectRatio(True)

# Display stream (640x360)
xprev = p.createXLinkOut()
xprev.setStreamName("preview")
cam.preview.link(xprev.input)

# ImageManip to letterbox 640x360 -> 300x300 for NN
man = p.createImageManip()
man.setResize(300, 300)
man.setKeepAspectRatio(True)
man.setFrameType(dai.ImgFrame.Type.BGR888p)
cam.preview.link(man.inputImage)

# NN
try:
    import blobconverter

    BLOB_PATH = blobconverter.from_zoo(name="mobilenet-ssd", shaves=6)
except Exception:
    BLOB_PATH = None

use_nn = BLOB_PATH is not None
if use_nn:
    nn = p.createMobileNetDetectionNetwork()
    nn.setBlobPath(BLOB_PATH)
    nn.setConfidenceThreshold(0.5)
    man.out.link(nn.input)
    xnn = p.createXLinkOut()
    xnn.setStreamName("nn")
    nn.out.link(xnn.input)

with dai.Device(p) as dev:
    qprev = dev.getOutputQueue("preview", 4, False)
    qnn = dev.getOutputQueue("nn", 4, False) if use_nn else None

    prev_gray = None
    hist_energy = collections.deque(maxlen=HIST_LEN)
    bpm_buf = collections.deque(maxlen=BPM_BUF_LEN)
    ema_vibe = None
    ema_trend = 0.0
    last_print = time.time()
    people = 0
    boxes_640x360 = []

    # Precompute letterbox mapping constants
    in_w, in_h = 640, 360
    nn_w, nn_h = 300, 300
    s = min(nn_w / in_w, nn_h / in_h)
    new_w, new_h = in_w * s, in_h * s
    pad_x = (nn_w - new_w) / 2.0
    pad_y = (nn_h - new_h) / 2.0

    def map_nn_box_to_preview(xmin, ymin, xmax, ymax):
        bx1, by1 = xmin * nn_w, ymin * nn_h
        bx2, by2 = xmax * nn_w, ymax * nn_h
        rx1 = (bx1 - pad_x) / s
        ry1 = (by1 - pad_y) / s
        rx2 = (bx2 - pad_x) / s
        ry2 = (by2 - pad_y) / s
        X1 = int(max(0, min(in_w - 1, rx1)))
        Y1 = int(max(0, min(in_h - 1, ry1)))
        X2 = int(max(0, min(in_w - 1, rx2)))
        Y2 = int(max(0, min(in_h - 1, ry2)))
        if X2 > X1 and Y2 > Y1:
            return (X1, Y1, X2, Y2)
        return None

    while True:
        frame = qprev.get().getCvFrame()
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Update detections
        if use_nn:
            while qnn.has():
                dets = qnn.get().detections
                tmp = []
                for d in dets:
                    if d.label in PERSON_LABELS:
                        mbox = map_nn_box_to_preview(d.xmin, d.ymin, d.xmax, d.ymax)
                        if mbox:
                            tmp.append(mbox)
                boxes_640x360 = tmp
                people = len(boxes_640x360)
        else:
            boxes_640x360 = []
            people = 0

        if prev_gray is None:
            prev_gray = gray
            cv2.putText(
                frame,
                "Initializing flow...",
                (10, 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )
            cv2.imshow("OAK-1 Vibe Analysis — ESC to quit", frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break
            continue

        # Optical flow
        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
        )
        prev_gray = gray
        fx, fy = flow[..., 0], flow[..., 1]
        mag, ang = cv2.cartToPolar(fx, fy, angleInDegrees=False)

        # Mask
        if boxes_640x360:
            mask = np.zeros((h, w), dtype=bool)
            for x1, y1, x2, y2 in boxes_640x360:
                mask[y1:y2, x1:x2] = True
            if not mask.any():
                mask = np.ones((h, w), dtype=bool)
        else:
            mask = np.ones((h, w), dtype=bool)

        # Identifiers
        raw_intensity = float(np.mean(mag[mask]))
        hist_energy.append(raw_intensity)
        lo = percentile(hist_energy, 10)
        hi = percentile(hist_energy, 90)
        energy = (
            0.0
            if hi <= lo
            else float(np.clip((raw_intensity - lo) / (hi - lo), 0.0, 1.0))
        )
        engagement = float(np.mean(mag[mask] > FLOW_THRESH))
        consistency = circ_consistency(ang[mask])

        vibe_raw = ENERGY_W * energy + ENGAGE_W * engagement + CONSIST_W * consistency
        ema_vibe = (
            vibe_raw
            if ema_vibe is None
            else (ALPHA_VIBE * vibe_raw + (1 - ALPHA_VIBE) * ema_vibe)
        )
        vibe = float(np.clip(ema_vibe, 0.0, 1.0))

        trend_inst = float(np.clip(vibe_raw - vibe, -1.0, 1.0))
        ema_trend = ALPHA_TREND * trend_inst + (1 - ALPHA_TREND) * ema_trend
        trend = float(ema_trend)

        bpm_buf.append(float(np.mean(fy[mask])))
        bounce_bpm = estimate_bpm(bpm_buf, FPS)

        # Overlay
        for x1, y1, x2, y2 in boxes_640x360:
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 170, 255), 2)
        cv2.putText(
            frame,
            f"vibe={vibe:.2f}  energy={energy:.2f}  engage={engagement:.2f}  people={people}",
            (10, 24),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2,
        )

        cv2.imshow("OAK-1 Vibe Analysis — ESC to quit", frame)

        # JSON output
        now = time.time()
        if now - last_print > PRINT_INTERVAL:
            hype_score = (
                (0.5 * (1 - vibe)) + (0.3 * (1 - trend)) + (0.2 * (1 - engagement))
            )
            need_hype = hype_score > HYPE_THRESHOLD
            if need_hype:

                track_song, curr_track_id, curr_timestamp, bpm, items = (
                    get_current_track_details()
                )

                new_track_id = recommend_song(
                    items,
                    people,
                    people,
                    energy,
                    engagement,
                    consistency,
                    trend,
                    bounce_bpm,
                    vibe,
                    hype_score,
                    need_hype,
                )

                # update to use the new reccomendation
                update_recommendation(
                    curr_track_id,
                    curr_timestamp,
                    energy,
                    bpm,
                    hype_score,
                )

            print(
                json.dumps(
                    {
                        "t": now,
                        "people": people,
                        "need_hype": need_hype,
                        "hype_score": hype_score,
                        "vibe": vibe,
                        "energy": energy,
                        "engagement": engagement,
                        "trend": trend,
                        "bounce_bpm": None if bounce_bpm is None else float(bounce_bpm),
                        "raw_intensity": raw_intensity,
                        "lo": lo,
                        "hi": hi,
                    }
                )
            )
            last_print = now

        if cv2.waitKey(1) & 0xFF == 27:
            break

cv2.destroyAllWindows()
