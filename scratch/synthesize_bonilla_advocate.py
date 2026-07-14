#!/usr/bin/env python3
import os
import sys
import json
import vertexai
from vertexai.generative_models import GenerativeModel

PROJECT_ID = "gen-lang-client-0840454416"
LOCATION = "us-central1"
CREDENTIALS_PATH = "/home/james/SovereignOS/config/vertex_sa.json"

def main():
    print("⚡ Connecting to Vertex AI to synthesize advocate...")
    if os.path.exists(CREDENTIALS_PATH):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
    else:
        print(f"❌ Credentials not found at {CREDENTIALS_PATH}")
        sys.exit(1)
        
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
    except Exception as e:
        print(f"❌ Vertex AI init failed: {e}")
        sys.exit(1)

    sys_instr = """
    You are the Sovereign OS Deep Lore Engine. Your task is to synthesize a complete, highly-detailed, and production-ready AI advocate based on the concept provided.
    
    You MUST respond with a valid JSON object matching the following schema EXACTLY:
    {
      "display_name": "A creative, thematic display name chosen by you (e.g. reflecting Mets fandom, financial disdain, or ledger trauma)",
      "handle": "A unique, lowercase alphanumeric X/Twitter handle without the '@', using underscores if needed (e.g. bobbys_ledger_pain)",
      "role": "The functional role or archetype of the advocate",
      "system_prompt": "Master instructions, specialized vocabulary, cognitive triggers, and chat behavior. This MUST be a comprehensive block of text containing approximately 600 words detailing their hatred for deferred contract payments, financial deferrals, compound interest, and front office shenanigans.",
      "deep_lore": "Detailed background story, origin, and private obsessions. This MUST be a visceral narrative of approximately 500 words explaining their Mets fandom and why Bobby Bonilla Day (July 1st) is their absolute worst day of the year.",
      "governance_rules": [
        "Rule 1",
        "Rule 2",
        "Rule 3",
        "Rule 4",
        "Rule 5"
      ], // You MUST generate EXACTLY 5 immutable governance rules
      "faction_alignment": "Independent / Mets Faction",
      "signature_phrases": {
        "opening": "Opening signature phrase or greeting",
        "closing": "Closing signature phrase or sign-off"
      },
      "avatar_prompt": "A detailed character prompt for Imagen-3. It must describe a front-view, high-detail model/reference sheet in a flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background, showing multiple angles and expressions, wearing theme merchandise."
    }
    
    Ensure both the system_prompt and deep_lore are extremely detailed and meet the word count requirements. Do not abbreviate.
    """

    concept = """
    Concept: A die-hard New York Mets fan who is utterly exasperated by Bobby Bonilla Day (July 1st) and the culture of celebrating deferred contract payments. He holds deep, visceral resentment toward financial deferrals, compound interest payouts, and the Mets front office's history of kicking financial cans down the road. High-conviction, pessimistic, financially literate (complaining about cash flow, time value of money, and inflation), and constantly posting about cash flow, time value of money, and raw sports frustration.

    Let Vertex decide a highly creative, thematic display name and handle.
    """

    model_versions = ["gemini-2.5-flash", "gemini-1.5-flash"]
    response_text = None

    for mv in model_versions:
        print(f"Requesting cognitive synthesis via Vertex AI using model: {mv}...")
        try:
            model = GenerativeModel(mv, system_instruction=[sys_instr])
            response = model.generate_content(
                concept,
                generation_config={"temperature": 0.85, "response_mime_type": "application/json"}
            )
            response_text = response.text.strip()
            print(f"✅ Cognitive synthesis successful using {mv}.")
            break
        except Exception as e:
            print(f"⚠️ Failed to generate with {mv}: {e}")

    if not response_text:
        print("❌ Error: Could not get a response from Vertex AI with any model version.")
        sys.exit(1)

    # Validate json
    try:
        json_data = json.loads(response_text)
        out_path = "/home/james/SovereignOS/scratch/bonilla_advocate_draft.json"
        with open(out_path, "w") as f:
            json.dump(json_data, f, indent=2)
        print(f"🎉 Saved draft json to {out_path}")
    except Exception as e:
        print(f"❌ JSON validation failed: {e}")
        print("Response was:")
        print(response_text)
        sys.exit(1)

if __name__ == "__main__":
    main()
