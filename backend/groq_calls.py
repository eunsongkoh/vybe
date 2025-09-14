import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file (one directory up)
load_dotenv(dotenv_path='../.env')

# Get API key from environment
api_key = os.getenv('api_key')
if not api_key:
    raise ValueError("API key not found in environment variables")

def recommend_song(list_of_songs, current_song, song_sentiment):
    input_prompt = (
        f"Here is a list of songs in JSON format {list_of_songs}. "
        f"The current song is \"{current_song}\".\n\n"
        f"User sentiment in JSON format (higher is better, out of 100): {song_sentiment}. "
        "Choose a better song. All you should provide is ONLY one, four digit track id."
    )
    
    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": input_prompt}],
        temperature=1,
        max_tokens=10,
        top_p=1,
        # structured outputs config
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "track_id_schema",
                "schema": {
                    "type": "object",
                    "properties": {
                        "track_id": {
                            "type": "string",
                            "pattern": "^[0-9]{4}$",  # enforce 4-digit format
                            "description": "The four-digit track ID chosen as the recommendation"
                        }
                    },
                    "required": ["track_id"],
                    "additionalProperties": False
                }
            }
        }
    )

    # Extract the structured response
    track_id = completion.choices[0].message["parsed"]["track_id"]
    return track_id
