import threading
import subprocess


def run_controller():
    subprocess.run(["python", "controller.py"])


def run_oak_vibe():
    subprocess.run(["python", "oak_vibe_hype.py"])


if __name__ == "__main__":
    t1 = threading.Thread(target=run_controller)
    t2 = threading.Thread(target=run_oak_vibe)

    t1.start()
    t2.start()

    t1.join()
    t2.join()
