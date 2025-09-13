import cv2, numpy as np, json, time, collections

# --- helpers ---
def percentile(a, p):
    return float(np.percentile(np.array(a), p)) if len(a) else 0.0

def normalize_intensity(x, lo, hi):
    if hi <= lo:  # avoid divide-by-zero
        return 0.0
    y = (x - lo) / (hi - lo)
    return float(np.clip(y, 0.0, 1.0))

# --- open camera ---
cap = cv2.VideoCapture(0)  # try 1 or 2 if wrong camera opens
ok, prev = cap.read()
if not ok:
    raise RuntimeError("Could not access camera")
prev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)

# rolling stats for auto-cal
intensity_hist = collections.deque(maxlen=180)  # ~6s at 30fps
ema_vibe = None
alpha = 0.3  # smoothing (0=very smooth, 1=no smoothing)
last_print = time.time()

while True:
    ok, frame = cap.read()
    if not ok: break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    flow = cv2.calcOpticalFlowFarneback(prev, gray, None,
        0.5, 3, 15, 3, 5, 1.2, 0)
    prev = gray

    mag, ang = cv2.cartToPolar(flow[...,0], flow[...,1], angleInDegrees=False)
    intensity = float(np.mean(mag))
    moving_ratio = float(np.mean(mag > 1.0))  # tweak threshold if needed (0.7–1.5)

    # update rolling distribution for auto scaling
    intensity_hist.append(intensity)
    lo = percentile(intensity_hist, 10)  # “quiet” baseline
    hi = percentile(intensity_hist, 90)  # “lively” baseline

    norm_intensity = normalize_intensity(intensity, lo, hi)

    # blend into a single vibe number (0..1), then smooth
    vibe_raw = 0.6 * norm_intensity + 0.4 * moving_ratio
    ema_vibe = vibe_raw if ema_vibe is None else (alpha * vibe_raw + (1 - alpha) * ema_vibe)
    vibe = float(np.clip(ema_vibe, 0.0, 1.0))

    # overlay (optional)
    cv2.putText(frame, f"vibe={vibe:.2f}  inten={intensity:.3f}  move={moving_ratio:.2f}",
                (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
    cv2.imshow("Vibe meter (ESC to quit)", frame)

    # print once per second as JSON
    if time.time() - last_print > 1.0:
        print(json.dumps({
            "t": time.time(),
            "vibe": vibe,
            "norm_intensity": norm_intensity,
            "moving_ratio": moving_ratio,
            "raw_intensity": intensity,
            "lo": lo, "hi": hi
        }))
        last_print = time.time()

    if cv2.waitKey(1) & 0xFF == 27:  # ESC
        break

cap.release()
cv2.destroyAllWindows()
