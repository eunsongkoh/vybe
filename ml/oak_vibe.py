# oak_vibe_oak1.py
# OAK-1 crowd vibe meter: MobileNet-SSD (on-device) + optical flow (host)
# - ESC to quit
# - Prints JSON once/sec: vibe, norm_intensity, moving_ratio, raw_intensity, lo, hi, people

import cv2, numpy as np, json, time, collections
import depthai as dai

# ---------- optional: fetch a blob from DepthAI zoo ----------
# If you have no internet at runtime, you can point to a local .blob file instead.
try:
    import blobconverter
    BLOB_PATH = blobconverter.from_zoo(name="mobilenet-ssd", shaves=6)
except Exception:
    BLOB_PATH = None  # network unavailable; detector will be disabled

# ---------- config ----------
PERSON_LABELS = {15, 1}  # accept VOC(15) and COCO(1) 'person'
FLOW_THRESH = 1.0        # threshold for "moving" pixels inside person boxes
ALPHA = 0.3              # EMA smoothing for vibe
HIST_LEN = 180           # ~6s at 30fps for auto scaling
SHOW_BOXES = True

# ---------- helpers ----------
def percentile(a, p):
    return float(np.percentile(np.asarray(a), p)) if len(a) else 0.0

def normalize_intensity(x, lo, hi):
    if hi <= lo:
        return 0.0
    return float(np.clip((x - lo) / (hi - hi + (hi - lo)), 0.0, 1.0))  # robust clamp

def denorm_bbox(d, w, h):
    # depthai detections are 0..1; clip and convert to ints
    x1 = max(0, min(1, d.xmin)) * w
    y1 = max(0, min(1, d.ymin)) * h
    x2 = max(0, min(1, d.xmax)) * w
    y2 = max(0, min(1, d.ymax)) * h
    return tuple(int(v) for v in (x1, y1, x2, y2))

# ---------- pipeline ----------
p = dai.Pipeline()

cam = p.createColorCamera()
# Use 300x300 to feed NN directly (keeps things simple)
cam.setPreviewSize(300, 300)
cam.setInterleaved(False)
cam.setFps(30)
cam.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)
cam.setPreviewKeepAspectRatio(True)

xout_prev = p.createXLinkOut()
xout_prev.setStreamName("preview")
cam.preview.link(xout_prev.input)

# Optional NN if blob is available
use_nn = BLOB_PATH is not None
if use_nn:
    nn = p.createMobileNetDetectionNetwork()
    nn.setBlobPath(BLOB_PATH)
    nn.setConfidenceThreshold(0.5)
    cam.preview.link(nn.input)

    xout_nn = p.createXLinkOut()
    xout_nn.setStreamName("nn")
    nn.out.link(xout_nn.input)

# ---------- run device ----------
with dai.Device(p) as dev:
    q_prev = dev.getOutputQueue("preview", 4, False)
    q_nn = dev.getOutputQueue("nn", 4, False) if use_nn else None

    prev_gray = None
    intensity_hist = collections.deque(maxlen=HIST_LEN)
    ema_vibe = None
    last_print = time.time()

    people_boxes = []
    people_count = 0

    print(">>> OAK-1 Vibe meter started (ESC to quit) <<<")

    while True:
        # --- get preview frame ---
        in_prev = q_prev.get()  # blocking to keep sync
        frame = in_prev.getCvFrame()  # 300x300 BGR
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # --- get detections (if enabled) ---
        if use_nn:
            # Drain queue to keep latest detections
            while q_nn.has():
                nn_in = q_nn.get()
                dets = nn_in.detections
                people_boxes = []
                for d in dets:
                    if d.label in PERSON_LABELS:
                        people_boxes.append(denorm_bbox(d, w, h))
                people_count = len(people_boxes)
        else:
            people_boxes = []
            people_count = 0

        # --- optical flow ---
        if prev_gray is None:
            prev_gray = gray
            # First frame: draw + continue
            cv2.putText(frame, "Initializing flow...", (10, 24),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            cv2.imshow("OAK-1 Vibe (ESC to quit)", frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break
            continue

        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
        )
        prev_gray = gray

        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1], angleInDegrees=False)
        intensity = float(np.mean(mag))

        # If we have person boxes, measure "moving" inside those boxes; else whole frame
        if people_boxes:
            mask = np.zeros((h, w), dtype=bool)
            for (x1, y1, x2, y2) in people_boxes:
                mask[y1:y2, x1:x2] = True
            # Guard against empty masks (degenerate boxes)
            if mask.any():
                moving_ratio = float(np.mean(mag[mask] > FLOW_THRESH))
                box_intensity = float(np.mean(mag[mask])) if mask.any() else intensity
            else:
                moving_ratio = float(np.mean(mag > FLOW_THRESH))
                box_intensity = intensity
        else:
            moving_ratio = float(np.mean(mag > FLOW_THRESH))
            box_intensity = intensity

        # Update rolling stats for auto scaling
        intensity_hist.append(box_intensity)
        lo = percentile(intensity_hist, 10)  # quiet baseline
        hi = percentile(intensity_hist, 90)  # lively baseline
        norm_intensity = 0.0 if hi <= lo else float(np.clip((box_intensity - lo) / (hi - lo), 0.0, 1.0))

        # Combine metrics into a vibe score and smooth with EMA
        vibe_raw = 0.6 * norm_intensity + 0.4 * moving_ratio
        ema_vibe = vibe_raw if ema_vibe is None else (ALPHA * vibe_raw + (1 - ALPHA) * ema_vibe)
        vibe = float(np.clip(ema_vibe, 0.0, 1.0))

        # --- overlay ---
        if SHOW_BOXES and people_boxes:
            for (x1, y1, x2, y2) in people_boxes:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 170, 255), 2)

        cv2.putText(
            frame,
            f"vibe={vibe:.2f}  inten={box_intensity:.3f}  move={moving_ratio:.2f}  people={people_count}",
            (8, 24),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
        )
        cv2.imshow("OAK-1 Vibe (ESC to quit)", frame)

        # --- print JSON once per second ---
        now = time.time()
        if now - last_print > 1.0:
            payload = {
                "t": now,
                "people": people_count,
                "vibe": vibe,
                "norm_intensity": norm_intensity,
                "moving_ratio": moving_ratio,
                "raw_intensity": box_intensity,
                "lo": lo,
                "hi": hi,
            }
            print(json.dumps(payload))
            last_print = now

        if cv2.waitKey(1) & 0xFF == 27:  # ESC
            break

cv2.destroyAllWindows()
