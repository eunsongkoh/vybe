import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("tracks")


def get_track_id_by_name(track_name):
    response = table.scan()
    for item in response["Items"]:
        if "track_name" not in item:
            continue

        print(item.keys())  # debugging
        if item["track_name"] == track_name:
            print("found")
            return item["track_id"]

    return None


def update_current_track(track_id_actual):
    table.update_item(
        Key={"track_id": "current", "timestamp": "0"},
        UpdateExpression="SET track_id_actual = :tid",
        ExpressionAttributeValues={":tid": track_id_actual},
    )
