import depthai as dai, blobconverter, cv2, json, time

# OPTIONAL: for pretty text (only used if you want to show class names)
VOC_LABELS = {
    0: "background", 1: "aeroplane", 2: "bicycle", 3: "bird", 4: "boat",
    5: "bottle", 6: "bus", 7: "car", 8: "cat", 9: "chair",
    10: "cow", 11: "diningtable", 12: "dog", 13: "horse", 14: "motorbike",
    15: "person", 16: "pottedplant", 17: "sheep", 18: "sofa", 19: "train", 20: "tvmonitor"
}
COCO_PERSON_ID = 1  # For COCO models, person=1

# CHANGE 1: define which numeric labels count as "person"
PERSON_LABELS = {15, COCO_PERSON_ID}  # Covers VOC (15) and COCO (1)

blob = blobconverter.from_zoo(name="mobilenet-ssd", shaves=6)

p = dai.Pipeline()
cam = p.createColorCamera()
cam.setPreviewSize(300,300); cam.setInterleaved(False); cam.setFps(30)

nn = p.createMobileNetDetectionNetwork()
nn.setBlobPath(blob); nn.setConfidenceThreshold(0.5)
cam.preview.link(nn.input)

xout_nn = p.createXLinkOut(); xout_nn.setStreamName("det")
nn.out.link(xout_nn.input)
xout_prev = p.createXLinkOut(); xout_prev.setStreamName("prev")
cam.preview.link(xout_prev.input)

with dai.Device(p) as dev:
    qd = dev.getOutputQueue("det", 4, False)
    qp = dev.getOutputQueue("prev", 4, False)
    last = time.time()
    while True:
        det = qd.get().detections
        frame = qp.get().getCvFrame()
        H,W,_ = frame.shape

        # CHANGE 2: initialize people count to zero here
        people = 0

        # CHANGE 3: only draw/count detections whose label is a "person"
        for d in det:
            if d.label not in PERSON_LABELS:
                continue  # skip non-person detections

            x1,y1 = int(d.xmin*W), int(d.ymin*H)
            x2,y2 = int(d.xmax*W), int(d.ymax*H)

            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)

            # Optional: show label text (tries VOC name, otherwise 'person')
            name = VOC_LABELS.get(d.label, "person")
            conf = getattr(d, "confidence", 0.0)
            cv2.putText(frame, f"{name} {conf:.2f}",
                        (x1, max(0, y1 - 6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)

            people += 1

        # Overlay: now reflects only people
        cv2.putText(frame, f"people={people}", (8,22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

        cv2.imshow("OAK detect (ESC to quit)", frame)

        if time.time() - last > 1.0:
            # JSON log now only reports people count
            print(json.dumps({"t": time.time(), "people": people}))
            last = time.time()

        if cv2.waitKey(1) & 0xFF == 27: break

cv2.destroyAllWindows()
