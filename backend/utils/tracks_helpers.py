import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("tracks")


def get_track_id_by_name(track_name):
    response = table.scan()
    for item in response["Items"]:
        if "track_name" not in item:
            continue

        if item["track_name"] == track_name:
            return item["track_id"]

    return None


def get_current_track_details():
    response = table.scan()
    curr_track_id = ""
    curr_timestamp = ""
    track_song = ""
    bpm = 0

    for item in response["Items"]:
        if "track_name" not in item:
            curr_track_id = item["track_id"]
            break

    for item in response["Items"]:
        if item["track_id"] == curr_track_id:
            track_song = item["track_song"]
            curr_timestamp = item["timestamp"]
            bpm = item["bpm"]
            break

    return (
        track_song,
        curr_track_id,
        curr_timestamp,
        bpm,
        response["Items"],
    )


def update_current_track(track_id_actual):
    table.update_item(
        Key={"track_id": "current", "timestamp": "0"},
        UpdateExpression="SET track_id_actual = :tid",
        ExpressionAttributeValues={":tid": track_id_actual},
    )


def update_recommendation(track_id, timestamp, energy_score, bpm, recc):
    table.update_item(
        Key={"track_id": track_id, "timestamp": timestamp},
        UpdateExpression="SET recommendation = :recc, energy_score = :energy, bpm = :bpm",
        ExpressionAttributeValues={
            ":recc": recc,
            ":energy": energy_score,
            ":bpm": bpm,
        },
    )
