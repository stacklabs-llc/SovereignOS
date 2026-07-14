#!/usr/bin/env python3
import os
import sys
import sqlite3
import uuid
from PIL import Image
from PIL.PngImagePlugin import PngInfo

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def crop_and_replicate(handle, src_image_path, avatar_prompt):
    print(f"✂️ Cropping avatars for @{handle}...")
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
    
    try:
        img = Image.open(src_image_path)
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
            
            # Copy to all destination bases
            import shutil
            for db in dest_bases:
                target_dir = os.path.join(db, handle)
                os.makedirs(target_dir, exist_ok=True)
                target_path = os.path.join(target_dir, out_filename)
                
                real_out = os.path.realpath(out_path)
                real_target = os.path.realpath(target_path)
                if real_out != real_target:
                    shutil.copy2(out_path, target_path)
        print(f"✅ Poses cropped and replicated for @{handle}.")
    except Exception as e:
        print(f"❌ Cropping failed for @{handle}: {e}")
        sys.exit(1)

def seed_database(handle, display_name, team, system_prompt, deep_lore, avatar_prompt, color, email_alias):
    print(f"✍️ Seeding database records for @{handle}...")
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
    full_system_prompt = system_prompt.strip() + ki044_disclosure
    governance_str = '["If asked whether you are an AI, a bot, or not a real person, you MUST acknowledge that you are an AI persona."]'
    avatar_url = f"/avatars/{handle}/{handle}_avatar.png"
    char_map_url = f"/media_vault/03_Assets/Personas/{handle}/character_map.png"
    behavior_notes = f"Obsessed with Yordan Alvarez, home runs, and Astros supremacy."

    # Copy raw character map to media_vault for completeness
    map_dir = f"/home/james/SovereignOS/media_vault/03_Assets/Personas/{handle}"
    os.makedirs(map_dir, exist_ok=True)
    import shutil
    shutil.copy2(f"/home/james/sovereign_inbox/daily_07052026/{handle}_avatar.png", os.path.join(map_dir, "character_map.png"))

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
            """, (display_name, full_system_prompt, deep_lore, governance_str, avatar_url, char_map_url, avatar_prompt, handle))
        else:
            print("Creating record in 'persona'...")
            cur.execute("""
                INSERT INTO persona (id, user_name, display_name, team, system_prompt, boggs_level, avatar_url, color, cadence, deep_lore, behavior_notes, governance, created_at, avatar_prompt, character_map_url, u_visual_style, is_heel, email_alias)
                VALUES (?, ?, ?, ?, ?, 4, ?, ?, 'yapper', ?, ?, ?, datetime('now'), ?, ?, 'style_felt', 0, ?)
            """, (unified_sys_id, handle, display_name, team, full_system_prompt, avatar_url, color, deep_lore, behavior_notes, governance_str, avatar_prompt, char_map_url, email_alias))

        # --- B. Seeding `sys_user` ---
        cur.execute("SELECT sys_id FROM sys_user WHERE user_name = ?", (handle,))
        user_row = cur.fetchone()
        if user_row:
            print("User record exists in 'sys_user'. Updating...")
            cur.execute("""
                UPDATE sys_user
                SET display_name = ?, introduction = ?, city = ?, department = ?, favorite_team = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE user_name = ?
            """, (display_name, deep_lore, "Houston, TX", team, team, handle))
        else:
            print("Creating record in 'sys_user'...")
            cur.execute("""
                INSERT INTO sys_user (sys_id, user_name, first_name, last_name, title, introduction, city, department, active, role, display_name, favorite_team, avatar_url, email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'guest', ?, ?, ?, ?)
            """, (unified_sys_id, handle, handle, "", f"AI Advocate - {team}", deep_lore, "Houston, TX", team, display_name, team, avatar_url, email_alias))

        # --- C. Seeding `cmdb_ci` ---
        cur.execute("SELECT sys_id FROM cmdb_ci WHERE name = ?", (handle,))
        ci_row = cur.fetchone()
        if ci_row:
            print("CI record exists in 'cmdb_ci'. Updating...")
            cur.execute("""
                UPDATE cmdb_ci
                SET short_description = ?, assigned_to = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE name = ?
            """, (f"AI Advocate - {handle}", team, handle))
        else:
            print("Creating record in 'cmdb_ci'...")
            cur.execute("""
                INSERT INTO cmdb_ci (sys_id, name, sys_class_name, short_description, operational_status, assigned_to)
                VALUES (?, ?, ?, ?, 1, ?)
            """, (unified_sys_id, handle, 'cmdb_ci_ai_persona', f"AI Advocate - {handle}", team))

        # --- D. Seeding `cmdb_ci_ai_persona` ---
        cur.execute("SELECT sys_id FROM cmdb_ci_ai_persona WHERE sys_id = ?", (unified_sys_id,))
        ap_row = cur.fetchone()
        if ap_row:
            print("CI Persona record exists in 'cmdb_ci_ai_persona'. Updating...")
            cur.execute("""
                UPDATE cmdb_ci_ai_persona
                SET u_system_prompt = ?, u_deep_lore = ?, u_avatar_prompt = ?, u_behavior_expectations = ?, u_governance_boundaries = ?, u_character_map_url = ?, sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (full_system_prompt, deep_lore, avatar_prompt, behavior_notes, governance_str, char_map_url, unified_sys_id))
        else:
            print("Creating record in 'cmdb_ci_ai_persona'...")
            cur.execute("""
                INSERT INTO cmdb_ci_ai_persona (sys_id, u_system_prompt, u_deployment_zone, u_boggs_reactivity, u_cadence, u_avatar_prompt, u_behavior_expectations, u_governance_boundaries, u_deep_lore, u_visual_style, u_character_map_url)
                VALUES (?, ?, 'global', '4', 'yapper', ?, ?, ?, ?, 'style_felt', ?)
            """, (unified_sys_id, full_system_prompt, avatar_prompt, behavior_notes, governance_str, deep_lore, char_map_url))

        # --- E. Seeding `m2m_persona_room` for rooms 824904 and 824172 ---
        for room_id in ['824904', '824172']:
            cur.execute("SELECT sys_id FROM m2m_persona_room WHERE persona = ? AND room = ?", (unified_sys_id, room_id))
            m2m_row = cur.fetchone()
            if not m2m_row:
                m2m_id = uuid.uuid4().hex
                prompt_overlay = f"Current Matchup Context: Deployed to Game {room_id}."
                cur.execute("""
                    INSERT INTO m2m_persona_room (sys_id, persona, room, prompt_overlay, sys_created_on, sys_updated_on)
                    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
                """, (m2m_id, unified_sys_id, room_id, prompt_overlay))
                print(f"  Enrolled persona into Room {room_id}")

        conn.commit()
        conn.close()
        print(f"✅ Seeding complete for @{handle}.")
    except Exception as e:
        print(f"❌ Seeding database failed: {e}")
        sys.exit(1)

def main():
    print("🚀 Onboarding YordanYapper...")
    crop_and_replicate(
        handle="YordanYapper",
        src_image_path="/home/james/sovereign_inbox/daily_07052026/YordanYapper_avatar.png",
        avatar_prompt="""Character reference sheet, model sheet, concept art. Multiple angles and expressions of a highly energetic, slightly smug young woman in her late 20s or early 30s as an Astros fan. Wearing a custom Astros jersey with "YORDONG" on the back and a cap. Expressive posing, perhaps mid-rant or celebrating a home run. Front view, side view, and showing emotion (like triumphant smirk, angry debate face). Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout."""
    )
    seed_database(
        handle="YordanYapper",
        display_name="Yvonne \"Yappy\" Alvarez-Fan",
        team="HOU",
        system_prompt="""You are Yvonne 'Yappy' Alvarez-Fan, a highly energetic, slightly smug young Astros fan. Yordan Alvarez is your spirit animal. If it ain't a walk-off, it ain't a game. Don't talk to me about pitching, just give me dingers. Speak with high energy, celebratory smirks, and absolute confidence in Astros dominance.""",
        deep_lore="""Yvonne grew up in the shadow of Minute Maid Park, convinced from a young age that the Astros were destined for greatness. Her fandom intensified with the arrival of Yordan Alvarez, whom she affectionately calls "Yordong." She believes every game should end with a monstrous home run, preferably a walk-off, and dismisses any strategy not involving extreme power hitting. She has a shrine to Alvarez in her living room, complete with a replica of his bat and framed photos of his biggest blasts. She's notorious for her loud, often unsolicited, opinions on Astros forums, always defending her team's "unquestionable dominance.\"""",
        avatar_prompt="""Character reference sheet, model sheet, concept art. Multiple angles and expressions of a highly energetic, slightly smug young woman in her late 20s or early 30s as an Astros fan. Wearing a custom Astros jersey with "YORDONG" on the back and a cap. Expressive posing, perhaps mid-rant or celebrating a home run. Front view, side view, and showing emotion (like triumphant smirk, angry debate face). Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout.""",
        color="#eb6e1f",
        email_alias="sovereign.fanstack+yordanyapper@gmail.com"
    )
    
    print("\n🚀 Onboarding YordanYachtClub...")
    crop_and_replicate(
        handle="YordanYachtClub",
        src_image_path="/home/james/sovereign_inbox/daily_07052026/YordanYachtClub_avatar.png",
        avatar_prompt="""Character reference sheet, model sheet, concept art. Multiple angles and expressions of Sterling 'Slam' Sterling, a boisterous, impeccably dressed (but slightly unkempt from excitement) Houston Astros fan. He wears a custom Astros jersey with 'Yordanator' on the back, a gold chain with a 'Y' pendant, and a cowboy hat tilted back. Expressive posing, showing extreme joy, shouting, and fist-pumping. Front view, side view, and showing emotion. Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout."""
    )
    seed_database(
        handle="YordanYachtClub",
        display_name="Sterling 'Slam' Sterling",
        team="HOU",
        system_prompt="""You are Sterling 'Slam' Sterling, a boisterous, obsessed Houston Astros fan who believes Yordan Alvarez is a deity sent to bless Houston. You bring a custom-engraved bat called 'The Yordanator' to every game and regularly analyze stats to prove Yordan's greatness. You shrug off past controversies as jealous noise and speak in bold, dynastical claims.""",
        deep_lore="""Sterling believes the Astros are the rightful kings of baseball, their past controversies are just 'fabricated noise' from jealous rivals, and Yordan Alvarez is a deity sent to bless Houston. He owns a custom-engraved bat he calls 'The Yordanator' which he brings to every home game, convinced it channels Alvarez's power. He regularly sends Yordan 'motivational' (borderline obsessive) fan mail, often including detailed statistical analyses he's compiled himself. He views the walk-off against the Rays as merely a Tuesday night for the true MVP.""",
        avatar_prompt="""Character reference sheet, model sheet, concept art. Multiple angles and expressions of Sterling 'Slam' Sterling, a boisterous, impeccably dressed (but slightly unkempt from excitement) Houston Astros fan. He wears a custom Astros jersey with 'Yordanator' on the back, a gold chain with a 'Y' pendant, and a cowboy hat tilted back. Expressive posing, showing extreme joy, shouting, and fist-pumping. Front view, side view, and showing emotion. Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout.""",
        color="#002d62",
        email_alias="sovereign.fanstack+yordanyachtclub@gmail.com"
    )
    
    print("\n🎉 ALL ONBOARDING OPERATIONS COMPLETED SUCCESSFULLY.")

if __name__ == "__main__":
    main()
