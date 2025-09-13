import boto3
import xml.etree.ElementTree as ET
from decimal import Decimal
import time

# DynamoDB resource
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("tracks")

# Parse Rekordbox XML
tree = ET.parse("track_export.xml")
root = tree.getroot()

for track in root.findall(".//TRACK"):
    track_id = track.get("TrackID")
    name = track.get("Name")
    artist = track.get("Artist")
    genre = track.get("Genre")
    bpm = track.get("AverageBpm")
    timestamp_val = str(int(time.time()))
    print(track_id, name, artist, bpm, location, timestamp_val)

    table.put_item(
        Item={
            "track_id": track_id,
            "timestamp": timestamp_val,
            "track_name": name,
            "artist": artist,
            "bpm": Decimal(bpm) if bpm else None,
            "audience_votes": {"thumbs_up": 0, "thumbs_down": 0},
            "vibe_score": Decimal("0.0"),
        }
    )

print("Imported Rekordbox tracks into DynamoDB")
