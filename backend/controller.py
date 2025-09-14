import os
import time
import mido
import pyautogui
import easyocr
import numpy as np
import warnings
from utils.tracks_helpers import get_track_id_by_name, update_current_track

warnings.filterwarnings("ignore", message=".*pin_memory.*")
midi_port_name = "DDJ-FLX4"
deck_notes = {70: "Deck 1", 71: "Deck 2"}
tempo_controls = {0: "Deck 1", 1: "Deck 2"}

# --- Screen OCR regions (coordinates) ---
bpm_regions = {
    "Deck 1": (1090, 950, 1200, 1030),
    "Deck 2": (1750, 950, 1860, 1030),
}
key_regions = {
    "Deck 1": (1050, 700, 1100, 750),
    "Deck 2": (2620, 700, 2700, 750),
}
song_regions = {
    "Deck 1": (100, 600, 1000, 700),
    "Deck 2": (1700, 600, 2600, 700),
}

prev_bpm = {"Deck 1": None, "Deck 2": None}

reader = easyocr.Reader(["en"])


def get_region_image(region):
    """Capture a cropped screenshot of a specific region."""
    screenshot = pyautogui.screenshot()
    return screenshot.crop(region)


def get_text_easyocr(region):
    """Run OCR on a cropped screenshot region using EasyOCR."""
    cropped = get_region_image(region)
    cropped_np = np.array(cropped)

    result = reader.readtext(cropped_np, detail=0)
    if result:
        return result[0].strip()
    return ""


def parse_bpm(raw_bpm):
    """Convert raw OCR like '8600' -> 86.00"""
    if not raw_bpm:
        return None
    digits = "".join(filter(str.isdigit, raw_bpm))
    if len(digits) < 3:
        return float(digits) if digits else None
    bpm_int = digits[:-2]
    bpm_dec = digits[-2:]
    try:
        return float(f"{bpm_int}.{bpm_dec}")
    except ValueError:
        return None


def capture_bpm_key(deck):
    screenshot = pyautogui.screenshot()
    cropped_bpm = np.array(screenshot.crop(bpm_regions[deck]))
    cropped_key = np.array(screenshot.crop(key_regions[deck]))
    cropped_song = np.array(screenshot.crop(song_regions[deck]))

    raw_bpm = reader.readtext(cropped_bpm, detail=0)
    key = reader.readtext(cropped_key, detail=0)
    song = reader.readtext(cropped_song, detail=0)

    bpm = parse_bpm(raw_bpm[0] if raw_bpm else "")
    key_text = key[0].strip() if key else ""
    song_text = song[0].strip() if song else ""

    return bpm, key_text, song_text


with mido.open_input(midi_port_name) as inport:
    print(f"Listening to MIDI on {midi_port_name}...")
    for msg in inport:
        deck = None
        if msg.type == "note_on" and msg.velocity > 0:
            deck = deck_notes.get(msg.note)
            print(f"{deck} - Note On: {msg.note}")
        elif msg.type == "control_change":
            deck = tempo_controls.get(msg.control)
            print(f"{deck} - Control Change: {msg.control}")
        print(deck)
        if deck:
            time.sleep(0.6)
            bpm, key, song = capture_bpm_key(deck)
            print(f"{deck} - Song: {song}, BPM: {bpm}, Key: {key}")

            if bpm != prev_bpm[deck]:
                track_id_actual = get_track_id_by_name(song)
                if track_id_actual:
                    update_current_track(track_id_actual)
                    print(f"Updated current track to track_id: {track_id_actual}")
                else:
                    print(f"Track not found in DynamoDB: {song}")

                prev_bpm[deck] = bpm
