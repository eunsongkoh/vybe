import os
from groq import Groq
from dotenv import load_dotenv

# Get API key from environment
api_key = os.getenviron("GROQ_API_KEY")
if not api_key:
    raise ValueError("API key not found in environment variables")


def recommend_song(
    list_of_songs,
    people,
    energy,
    engagement,
    consistency,
    trend,
    bounce_bpm,
    vibe,
    hype_score,
    need_hype,
):
    input_prompt = f"""
    You are a DJ assistant. Your job is to recommend the *best next song* based on the vibe of the crowd.  

    You will be given:  
    - A list of songs in JSON format.  
    - The current song playing.  
    - Crowd metrics describing the current vibe.  

    ### Crowd Metrics (DJ Cheat Sheet)
    - People: {people} → how many humans are visible.  
    - Energy: {energy} → how fast people are moving.  
    - Engagement: {engagement} → % of crowd moving.  
    - Consistency: {consistency} → are they moving together or randomly.  
    - Trend: {trend} → is the vibe rising or dropping.  
    - Bounce BPM: {bounce_bpm} → estimated dance tempo from crowd.  
    - Vibe: {vibe} → blended mood score.  
    - Hype Score: {hype_score} → overall excitement score (0–1).  
    - Need Hype: {need_hype} → should the DJ play a more hype track?  

    ### Task
    1. Look at the current metrics and the song list.  
    2. Recommend **one single song** (from the provided list) that best fits the vibe.  
    - If `need_hype = true`, pick a song with higher energy and BPM.  
    - If the crowd is already hyped, keep the energy steady but avoid killing the vibe.  
    - Match Bounce BPM with the song’s BPM if possible.  
    - Respect the crowd’s trend (don’t drop energy if hype is climbing).  
    3. Return ONLY a JSON object with this exact format:  

    ```json
    {{
    "track_id": "####"  // four-digit ID of the chosen track
    }}

    Here is the track of songs: {list_of_songs} 
    """

    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": input_prompt}],
        temperature=1,
        max_tokens=10,
        top_p=1,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "track_id_schema",
                "schema": {
                    "type": "object",
                    "properties": {
                        "track_id": {
                            "type": "string",
                            "pattern": "^[0-9]{4}$",
                            "description": "The four-digit track ID chosen as the recommendation",
                        }
                    },
                    "required": ["track_id"],
                    "additionalProperties": False,
                },
            },
        },
    )

    # Extract the structured response
    track_id = completion.choices[0].message["parsed"]["track_id"]
    return track_id
