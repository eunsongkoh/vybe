import depthai as dai, cv2
p = dai.Pipeline()
cam = p.createColorCamera()
cam.setPreviewSize(300,300)
cam.setInterleaved(False)
cam.setFps(30)
xout = p.createXLinkOut(); xout.setStreamName("prev")
cam.preview.link(xout.input)

with dai.Device(p) as dev:
    q = dev.getOutputQueue("prev", 4, False)
    while True:
        frame = q.get().getCvFrame()
        cv2.imshow("OAK preview (ESC to quit)", frame)
        if cv2.waitKey(1) & 0xFF == 27: break
cv2.destroyAllWindows()
