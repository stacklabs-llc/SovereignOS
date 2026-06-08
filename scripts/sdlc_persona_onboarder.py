import os
import json
import datetime
import uuid
import sqlite3
import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.preview.vision_models import ImageGenerationModel

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
CONTEXT_DB = "/home/james/SovereignOS/dna/context_database.json"
CREDENTIALS_PATH = "/home/james/SovereignOS/config/vertex_sa.json"
PROJECT_ID = "gen-lang-client-0840454416"
LOCATION = "us-central1"

def get_mlb_news():
    if os.path.exists(CONTEXT_DB):
        try:
            with open(CONTEXT_DB, "r") as f:
                data = json.load(f)
                news = data.get("mlb_news", [])
                if news:
                    return "\n".join([f"- {item['title']}: {item['summary']}" for item in news])
        except Exception:
            pass
    return "No major MLB news right now. Just pick a random team."

def create_stry_ticket(handle, filepath, email_alias, tier="standard", forge_status="UNKNOWN"):
    con = sqlite3.connect(DB_PATH)
    sys_id = str(uuid.uuid4())
    
    # Generate STRY number
    cursor = con.cursor()
    import time
    new_num = f"STRY{int(time.time())}"
        
    short_desc = f"Onboard New FanStack Persona: {handle}"
    if tier.lower() == "a-list":
        short_desc += " [GATING_FOR_ART_DIRECTION]"

    desc = f"A new persona has been generated based on today's MLB news.\n\nPlease review the generated blueprint and create the corresponding X/Twitter account.\n\nRequired Account Setup:\n- Email Alias: `{email_alias}`\n\nBlueprint Path: {filepath}"
    
    # Create beautiful markdown work notes
    work_notes = f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Automated Onboarding Initialization:\n"
    if tier.lower() == "standard":
        work_notes += f"- **Tier:** Standard (Pacers/Lurkers)\n- **Asset Forge Status:** {forge_status} (Automatic generation triggered asynchronously)."
    else:
        work_notes += f"- **Tier:** A-List (Celebrity Override)\n- **Asset Forge Status:** {forge_status} (Benched/suspended for manual art direction)."

    con.execute("INSERT INTO sovereign_tickets (sys_id, number, type, short_description, description, state, priority, assigned_to, work_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (sys_id, new_num, 'STRY', short_desc, desc, 1, 3, 'james', work_notes))
    con.commit()
    con.close()
    return new_num

def main():
    print(f"[{datetime.datetime.now()}] Starting SDLC Persona Onboarder...")
    
    # 1. Check database preference toggle
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        row = cur.execute("SELECT value FROM sys_user_preference WHERE name = 'disable_daily_onboarding'").fetchone()
        con.close()
        if row and row[0].lower() in ('true', '1', 'yes'):
            print("Daily advocate onboarding is disabled in sys_user_preference. Exiting.")
            return
    except Exception as e:
        print(f"Error checking daily onboarding database preference: {e}")

    # 2. Check environment variable toggle
    if os.environ.get("DISABLE_DAILY_ONBOARDING") in ("1", "true", "TRUE"):
        print("Daily advocate onboarding is disabled via environment variable DISABLE_DAILY_ONBOARDING. Exiting.")
        return

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
    except Exception as e:
        print(f"Vertex AI init failed: {e}")
        return

    news = get_mlb_news()
    
    sys_instr = """
    You are an expert persona designer for a multi-agent MLB fan simulation. 
    Based on the recent MLB news provided, pick a team that had a notable event (upset, blowout, trade, etc) and design a brand new unhinged, highly opinionated fan persona for that team.
    Format your response as a valid JSON object EXACTLY like this:
    {
        "handle": "twitter_handle_without_at",
        "display_name": "Full Name",
        "team": "MLB_ABBREV",
        "location": "City or fictional place",
        "bio": "160 char bio for twitter",
        "deep_lore": "1-2 paragraphs of deep lore",
        "tier": "standard", // Either "standard" or "a-list" (default to "standard", only use "a-list" for exceptionally notable high-profile celebrity characters)
        "style_profile": "Tier: Standard", // Default to "Tier: Standard" for standard, or write custom art style prompts (e.g. 16-bit retro, Synthwave Chic, caricature) if a-list
        "avatar_prompt": "Character reference sheet, model sheet, concept art. Multiple angles and expressions of [Brief Persona Description] as a fan. Wearing team merchandise. Expressive posing. Front view, side view, and showing emotion. Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout."
    }
    """
    
    prompt = f"Recent MLB News:\n{news}\n\nGenerate the new persona JSON."
    
    model = GenerativeModel("gemini-2.5-flash", system_instruction=[sys_instr])
    
    print("Generating persona via Gemini...")
    try:
        response = model.generate_content(prompt, generation_config={"temperature": 0.8, "response_mime_type": "application/json"})
        persona_data = json.loads(response.text.strip())
    except Exception as e:
        print(f"Failed to generate persona: {e}")
        return
        
    print(f"Generated persona: {persona_data['handle']} ({persona_data['team']})")
    
    # Generate Avatar using Imagen
    image_path = f"/home/james/sovereign_inbox/today/{persona_data['handle']}_avatar.png"
    try:
        print(f"Generating avatar for {persona_data['handle']} using Imagen...")
        image_model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
        images = image_model.generate_images(
            prompt=persona_data['avatar_prompt'],
            number_of_images=1,
            language="en",
            aspect_ratio="1:1"
        )
        images[0].save(location=image_path)
        print(f"Avatar saved to {image_path}")
    except Exception as e:
        print(f"Failed to generate avatar: {e}")
        image_path = "Failed to generate image. Please generate manually."

    # Auto-generate Gmail alias
    persona_slug = persona_data['handle'].lower().replace(' ', '').replace('_', '')
    email_alias = f"sovereign.fanstack+{persona_slug}@gmail.com"

    # Create Markdown Blueprint
    md_content = f"""# X/Twitter Onboarding Blueprint: `{persona_data['handle']}`

Use these details to register the new X (Twitter) account. Once registered, mark the STRY ticket as resolved.

## 👤 Profile Details

**X Handle:** `@{persona_data['handle']}`
**Email Alias:** `{email_alias}`
**Display Name:** {persona_data['display_name']}
**Team:** {persona_data['team']}
**Location:** {persona_data['location']}

**Bio (max 160 chars):** 
{persona_data['bio']}

## 📖 Deep Lore
{persona_data['deep_lore']}

# Style Profile
{persona_data.get('style_profile', 'Tier: Standard')}

## 🖼️ Profile Pictures

**Avatar:**
The generated avatar is saved at: `{image_path}`

**Avatar Prompt Used:**
{persona_data['avatar_prompt']}

## 🔐 System Sync (Post-Creation)
Once the account is created, update the `STRY` ticket in `sovereign_tickets` with "RESOLVED" status.
"""
    
    md_path = f"/home/james/sovereign_inbox/today/{persona_data['handle']}_onboarding.md"
    with open(md_path, "w") as f:
        f.write(md_content)
        
    print(f"Blueprint saved to {md_path}")
    
    # Task 2: Subprocess Trigger
    import subprocess
    tier = persona_data.get('tier', 'standard').lower()
    if tier == "standard":
        print(f"⚡ [AUTO-FLOW] Standard Tier detected. Invoking Persona Forge...")
        try:
            # Execute the forge in the background
            subprocess.Popen([
                "/home/james/SovereignOS/.venv/bin/python3",
                "/home/james/SovereignOS/scripts/persona_forge.py",
                md_path
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✅ [AUTO-FLOW] Persona Forge triggered successfully.")
            forge_status = "AUTOMATED_TRIGGERED"
        except Exception as e:
            print(f"⚠️ [AUTO-FLOW ERROR] Failed to invoke Persona Forge: {e}")
            forge_status = f"FAILED: {e}"
    else:
        print(f"🛑 [AUTO-FLOW] A-List Tier detected. Suspending generation for manual gating.")
        forge_status = "SUSPENDED_FOR_GATING"
    
    # Create ticket
    ticket_num = create_stry_ticket(persona_data['handle'], md_path, email_alias, tier, forge_status)
    print(f"Ticket created: {ticket_num}")

if __name__ == "__main__":
    main()
