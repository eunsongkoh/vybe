import cv2, numpy as np, json, time

# open the first camera (0). If you have multiple, try 1 or 2.
cap = cv2.VideoCapture(0)

ok, prev = cap.read()
if not ok:
    raise RuntimeError("Could not access camera")
prev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)

last_print = time.time()
while True:
    ok, frame = cap.read()
    if not ok:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # calculate optical flow between frames
    flow = cv2.calcOpticalFlowFarneback(prev, gray, None,
        0.5, 3, 15, 3, 5, 1.2, 0)
    prev = gray

    # convert flow to magnitude + angle
    mag, ang = cv2.cartToPolar(flow[...,0], flow[...,1], angleInDegrees=False)

    intensity = float(np.mean(mag))            # average motion strength
    moving_ratio = float(np.mean(mag > 1.0))   # % pixels moving more than threshold

    # overlay text on video
    cv2.putText(frame, f"intensity={intensity:.2f}  moving={moving_ratio:.2f}",
                (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)

    # show window
    cv2.imshow("Motion meter", frame)

    # print once per second (JSON style)
    if time.time() - last_print > 1.0:
        print(json.dumps({
            "t": time.time(),
            "intensity": intensity,
            "moving_ratio": moving_ratio
        }))
        last_print = time.time()

    # press ESC to quit
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
