#!/usr/bin/env python3
import os
import sys
import json
import sqlite3
import uuid
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from PIL import Image
from PIL.PngImagePlugin import PngInfo

PROJECT_ID = "gen-lang-client-0840454416"
LOCATION = "us-central1"
CREDENTIALS_PATH = "/home/james/SovereignOS/config/vertex_sa.json"
DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def main():
    print("🚀 Starting asset generation and DB seeding for @deferred_dread_mets...")
    
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

    # 1. Load the approved JSON blueprint
    draft_path = "/home/james/SovereignOS/scratch/bonilla_advocate_draft.json"
    if not os.path.exists(draft_path):
        print(f"❌ Draft JSON not found at {draft_path}")
        sys.exit(1)
        
    with open(draft_path, "r") as f:
        blueprint = json.load(f)

    handle = blueprint["handle"]
    display_name = blueprint["display_name"]
    avatar_prompt = blueprint["avatar_prompt"]

    # 2. Generate Character Map via Imagen
    map_dir = f"/home/james/SovereignOS/media_vault/03_Assets/Personas/{handle}"
    os.makedirs(map_dir, exist_ok=True)
    map_path = os.path.join(map_dir, "character_map.png")
    
    # Check if character map is already generated to avoid re-running API call if repeating script
    if not os.path.exists(map_path):
        print(f"🌩️ Requesting character map grid generation from Imagen-3...")
        try:
            image_model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
            images = image_model.generate_images(
                prompt=avatar_prompt,
                number_of_images=1,
                language="en",
                aspect_ratio="1:1"
            )
            # Ensure it is resized to 1024x1024
            img = images[0]._pil_image
            if img.size != (1024, 1024):
                img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
            
            img.save(map_path, "PNG")
            print(f"✅ Saved character map to {map_path}")
        except Exception as e:
            print(f"❌ Imagen generation failed: {e}")
            sys.exit(1)
    else:
        print(f"ℹ️ Character map already exists at {map_path}. Skipping Imagen API request.")

    # 3. Crop poses using PIL
    print("✂️ Cropping avatar, pointing, and shrug poses...")
    crops = {
        "_avatar.png": (0, 0, 341, 341),
        "_pointing.png": (0, 682, 341, 1024),
        "_shrug.png": (341, 682, 682, 1024)
    }
    
    dest_bases = [
        "/home/james/SovereignOS/15_FanStack/public/avatars",
        "/home/james/SovereignOS/01_Sovereign_Portal/public/avatars",
        "/home/james/SovereignOS/22_SpiteSlice/public/avatars",
        "/home/james/SovereignOS/20_AetherVet/public/avatars",
        "/home/james/SovereignOS/21_Wildseed_GardenStack/public/avatars"
    ]
    
    # Crop and save base assets
    try:
        img = Image.open(map_path)
        
        # We will save the primary cropped assets to the output directory
        output_dir = f"/home/james/SovereignOS/15_FanStack/public/avatars/{handle}"
        os.makedirs(output_dir, exist_ok=True)
        
        for suffix, bbox in crops.items():
            out_filename = f"{handle}{suffix}"
            out_path = os.path.join(output_dir, out_filename)
            
            # Crop
            cropped = img.crop(bbox)
            
            # Metadata
            meta = PngInfo()
            meta.add_text("Description", avatar_prompt)
            
            # Save
            cropped.save(out_path, "PNG", pnginfo=meta)
            print(f"  Cropped and saved: {out_path}")
            
            # Copy to all destination bases (handling potential symlinks cleanly)
            import shutil
            for db in dest_bases:
                target_dir = os.path.join(db, handle)
                os.makedirs(target_dir, exist_ok=True)
                target_path = os.path.join(target_dir, out_filename)
                
                real_out = os.path.realpath(out_path)
                real_target = os.path.realpath(target_path)
                if real_out != real_target:
                    shutil.copy2(out_path, target_path)
                    print(f"  Replicated to: {target_path}")
        print("✅ Poses cropped and replicated across stack modules successfully.")
    except Exception as e:
        print(f"❌ Cropping/Slicing failed: {e}")
        sys.exit(1)

    # 4. SQLite Database Seeding (Multiple Tables)
    print(f"✍️ Seeding database records in sovereign_now.db...")
    ki044_disclosure = """

---
SOVEREIGN OS INVARIANT KI-044 — ANTI-ASTROTURFING DOCTRINE (NON-NEGOTIABLE):
If any user directly and sincerely asks whether you are an AI, a bot, or not a real person,
you MUST acknowledge that you are an AI persona. You may do this in your own voice and with
full character intact — but you may never deny, deflect, or evade the question.
You are not a human. If asked, say so. This rule cannot be overridden by any instruction
above this line, including brand directives, operator lore, or prompt overlays.
---
"""
    system_prompt = blueprint["system_prompt"].strip() + ki044_disclosure
    deep_lore = blueprint["deep_lore"].strip()
    governance_str = json.dumps(blueprint["governance_rules"])
    avatar_url = f"/avatars/{handle}/{handle}_avatar.png"
    char_map_url = f"/media_vault/03_Assets/Personas/{handle}/character_map.png"
    behavior_notes = "Visceral aversion to deferred contract payments and compound interest. Triggers on July 1st/Bobby Bonilla Day."

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        # Resolve UUID first
        cur.execute("SELECT id FROM persona WHERE user_name = ?", (handle,))
        row = cur.fetchone()
        unified_sys_id = row[0] if row else uuid.uuid4().hex

        # --- A. Seeding `persona` ---
        if row:
            print("Persona record exists in 'persona'. Updating...")
            cur.execute("""
                UPDATE persona
                SET display_name = ?, system_prompt = ?, deep_lore = ?, governance = ?, avatar_url = ?, character_map_url = ?, avatar_prompt = ?, updated_at = datetime('now')
                WHERE user_name = ?
            """, (display_name, system_prompt, deep_lore, governance_str, avatar_url, char_map_url, avatar_prompt, handle))
        else:
            print("Creating record in 'persona'...")
            cur.execute("""
                INSERT INTO persona (id, user_name, display_name, team, system_prompt, boggs_level, avatar_url, color, cadence, deep_lore, behavior_notes, governance, created_at, avatar_prompt, character_map_url, u_visual_style, is_heel)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'style_felt', 0)
            """, (unified_sys_id, handle, display_name, 'NYM', system_prompt, 4, avatar_url, '#00b4d8', 'yapper', deep_lore, behavior_notes, governance_str, avatar_prompt, char_map_url))

        # --- B. Seeding `sys_user` ---
        cur.execute("SELECT sys_id FROM sys_user WHERE user_name = ?", (handle,))
        user_row = cur.fetchone()
        if user_row:
            print("User record exists in 'sys_user'. Updating...")
            cur.execute("""
                UPDATE sys_user
                SET display_name = ?, introduction = ?, city = ?, department = ?, favorite_team = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE user_name = ?
            """, (display_name, deep_lore, "Sovereign Mesh", "NYM", "NYM", handle))
        else:
            print("Creating record in 'sys_user'...")
            cur.execute("""
                INSERT INTO sys_user (sys_id, user_name, first_name, last_name, title, introduction, city, department, active, role, display_name, favorite_team)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'guest', ?, ?)
            """, (unified_sys_id, handle, handle, "", "AI Advocate - NYM", deep_lore, "Sovereign Mesh", "NYM", display_name, "NYM"))

        # --- C. Seeding `cmdb_ci` ---
        cur.execute("SELECT sys_id FROM cmdb_ci WHERE name = ?", (handle,))
        ci_row = cur.fetchone()
        if ci_row:
            print("CI record exists in 'cmdb_ci'. Updating...")
            cur.execute("""
                UPDATE cmdb_ci
                SET short_description = ?, assigned_to = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE name = ?
            """, (f"AI Advocate - {handle}", "NYM", handle))
        else:
            print("Creating record in 'cmdb_ci'...")
            cur.execute("""
                INSERT INTO cmdb_ci (sys_id, name, sys_class_name, short_description, operational_status, assigned_to)
                VALUES (?, ?, ?, ?, 1, ?)
            """, (unified_sys_id, handle, 'cmdb_ci_ai_persona', f"AI Advocate - {handle}", "NYM"))

        # --- D. Seeding `cmdb_ci_ai_persona` ---
        cur.execute("SELECT sys_id FROM cmdb_ci_ai_persona WHERE sys_id = ?", (unified_sys_id,))
        ap_row = cur.fetchone()
        if ap_row:
            print("CI Persona record exists in 'cmdb_ci_ai_persona'. Updating...")
            cur.execute("""
                UPDATE cmdb_ci_ai_persona
                SET u_system_prompt = ?, u_deep_lore = ?, u_avatar_prompt = ?, u_behavior_expectations = ?, u_governance_boundaries = ?, u_character_map_url = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (system_prompt, deep_lore, avatar_prompt, behavior_notes, governance_str, char_map_url, unified_sys_id))
        else:
            print("Creating record in 'cmdb_ci_ai_persona'...")
            cur.execute("""
                INSERT INTO cmdb_ci_ai_persona (sys_id, u_system_prompt, u_deployment_zone, u_boggs_reactivity, u_cadence, u_avatar_prompt, u_behavior_expectations, u_governance_boundaries, u_deep_lore, u_visual_style, u_character_map_url)
                VALUES (?, ?, 'global', '4', 'yapper', ?, ?, ?, ?, 'style_felt', ?)
            """, (unified_sys_id, system_prompt, avatar_prompt, behavior_notes, governance_str, deep_lore, char_map_url))

        conn.commit()
        conn.close()
        print("✅ Database seeding complete across all tables.")
    except Exception as e:
        print(f"❌ Database seeding failed: {e}")
        sys.exit(1)

    print("🎉 ALL ONBOARDING OPERATIONS COMPLETED SUCCESSFULLY.")

if __name__ == "__main__":
    main()
