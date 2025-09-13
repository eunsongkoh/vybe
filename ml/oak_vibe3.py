# people_armsup_min.py
# Detect people + estimate "arms-up" using optical flow in the upper region of each person's box.
# Prints JSON every 2s: people, movement, arms_up_candidates, per_person_arms_up.
# ESC to quit.

import depthai as dai, cv2, numpy as np, time, json, collections

# ---- CONFIG ----
FPS = 30
PRINT_INTERVAL = 2.0
FLOW_THRESH = 1.0                 # px/frame considered "moving"
UPWARD_THRESH = 0.7               # flow px/frame to consider "upward spike" (fy < -UPWARD_THRESH)
PREVIEW_W, PREVIEW_H = 640, 360
NN_SIZE = 300
PERSON_LABELS = {15, 1}
HIST_LEN = int(6 * FPS)           # ~6s auto-scale for movement
UPPER_PORTION = 0.45              # top portion of box to analyze for arms-up (e.g., 45%)

def percentile(a, p):
    return float(np.percentile(np.asarray(a), p)) if len(a) else 0.0

# ---- PIPELINE ----
p = dai.Pipeline()
cam = p.createColorCamera()
cam.setPreviewSize(PREVIEW_W, PREVIEW_H)
cam.setInterleaved(False)
cam.setFps(FPS)
cam.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)
cam.setPreviewKeepAspectRatio(True)

xprev = p.createXLinkOut(); xprev.setStreamName("preview")
cam.preview.link(xprev.input)

# Letterbox 640x360 -> 300x300 for NN
man = p.createImageManip()
man.setResize(NN_SIZE, NN_SIZE)
man.setKeepAspectRatio(True)
man.setFrameType(dai.ImgFrame.Type.BGR888p)
cam.preview.link(man.inputImage)

try:
    import blobconverter
    BLOB_PATH = blobconverter.from_zoo(name="mobilenet-ssd", shaves=6)
except Exception:
    BLOB_PATH = None

use_nn = BLOB_PATH is not None
if use_nn:
    nn = p.createMobileNetDetectionNetwork()
    nn.setBlobPath(BLOB_PATH)
    nn.setConfidenceThreshold(0.45)
    man.out.link(nn.input)
    xnn = p.createXLinkOut(); xnn.setStreamName("nn"); nn.out.link(xnn.input)

with dai.Device(p) as dev:
    qprev = dev.getOutputQueue("preview", 4, False)
    qnn   = dev.getOutputQueue("nn", 4, False) if use_nn else None

    # mapping from 300x300 letterboxed to 640x360 preview
    in_w, in_h = PREVIEW_W, PREVIEW_H
    nn_w = nn_h = NN_SIZE
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
        return (X1, Y1, X2, Y2) if X2 > X1 and Y2 > Y1 else None

    prev_gray = None
    boxes = []
    people = 0
    hist = collections.deque(maxlen=HIST_LEN)
    last_print = time.time()

    while True:
        frame = qprev.get().getCvFrame()
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # detections
        if use_nn:
            while qnn.has():
                dets = qnn.get().detections
                tmp = []
                for d in dets:
                    if d.label in PERSON_LABELS:
                        m = map_nn_box_to_preview(d.xmin, d.ymin, d.xmax, d.ymax)
                        if m: tmp.append(m)
                boxes = tmp
                people = len(boxes)
        else:
            boxes = []
            people = 0

        if prev_gray is None:
            prev_gray = gray
            cv2.putText(frame, "Initializing...", (10,24),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
            cv2.imshow("People + Arms-Up Heuristic (ESC to quit)", frame)
            if cv2.waitKey(1) & 0xFF == 27: break
            continue

        # optical flow
        flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None,
                                            0.5, 3, 15, 3, 5, 1.2, 0)
        prev_gray = gray
        fx, fy = flow[...,0], flow[...,1]
        mag, _ = cv2.cartToPolar(fx, fy, angleInDegrees=False)

        # global movement (inside boxes if any, else full)
        if boxes:
            mask = np.zeros((h, w), dtype=bool)
            for (x1,y1,x2,y2) in boxes:
                mask[y1:y2, x1:x2] = True
            if not mask.any():
                mask = np.ones((h, w), dtype=bool)
        else:
            mask = np.ones((h, w), dtype=bool)

        raw = float(np.mean(mag[mask]))
        hist.append(raw)
        lo = percentile(hist, 10); hi = percentile(hist, 90)
        movement = 0.0 if hi <= lo else float(np.clip((raw - lo)/(hi - lo), 0.0, 1.0))

        # ---- Arms-up heuristic per person ----
        per_person_arms_up = []
        for (x1,y1,x2,y2) in boxes:
            # upper region of the person box
            box_h = max(1, y2 - y1)
            upper_h = int(box_h * UPPER_PORTION)
            uy1, uy2 = y1, y1 + upper_h
            # upward motion = fy negative (y axis grows downward)
            upper_mask = np.zeros((h, w), dtype=bool)
            upper_mask[uy1:uy2, x1:x2] = True

            # portion of pixels moving upward strongly in the upper region
            up_ratio = float(np.mean((fy[upper_mask] < -UPWARD_THRESH)))
            # lower-body motion as a sanity check (should be calmer than upper)
            ly1, ly2 = y1 + upper_h, y2
            lower_mask = np.zeros((h, w), dtype=bool)
            lower_mask[ly1:ly2, x1:x2] = True
            lower_move = float(np.mean(mag[lower_mask] > FLOW_THRESH)) if ly2 > ly1 else 0.0

            # simple rule: enough upward pixels above, and not too crazy below
            arms_up = (up_ratio > 0.10) and (lower_move < 0.30)
            per_person_arms_up.append(arms_up)

            # draw box + tag
            color = (0,255,0) if arms_up else (0,170,255)
            cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
            cv2.putText(frame, "arms^" if arms_up else "person",
                        (x1, max(20, y1-6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # visualize the upper ROI line
            cv2.line(frame, (x1, y1 + upper_h), (x2, y1 + upper_h), (255,255,255), 1)

        arms_up_candidates = int(sum(per_person_arms_up))

        # overlay
        cv2.putText(frame, f"people={people}  move={movement:.2f}  arms_up={arms_up_candidates}",
                    (10,24), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,255,0), 2)
        cv2.imshow("People + Arms-Up Heuristic (ESC to quit)", frame)

        # JSON print
        now = time.time()
        if now - last_print > PRINT_INTERVAL:
            print(json.dumps({
                "t": now,
                "people": people,
                "movement": movement,
                "arms_up_candidates": arms_up_candidates,
                "per_person_arms_up": per_person_arms_up,
                "raw": raw, "lo": lo, "hi": hi
            }))
            last_print = now

        if cv2.waitKey(1) & 0xFF == 27:
            break

cv2.destroyAllWindows()
