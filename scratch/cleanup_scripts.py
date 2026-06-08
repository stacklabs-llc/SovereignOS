import os
import re
import shutil

scripts_dir = "/home/james/SovereignOS/scripts"
archive_dir = os.path.join(scripts_dir, "_archive")

game_specific_dir = os.path.join(archive_dir, "game_specific")
one_off_fixes_dir = os.path.join(archive_dir, "one_off_fixes")
tests_and_checks_dir = os.path.join(archive_dir, "tests_and_checks")
legacy_lore_injections_dir = os.path.join(archive_dir, "legacy_lore_injections")

game_pattern = re.compile(r".*[0-9]{6}\..*")

for filename in os.listdir(scripts_dir):
    filepath = os.path.join(scripts_dir, filename)
    if not os.path.isfile(filepath):
        continue

    dest_dir = None
    
    if game_pattern.match(filename):
        dest_dir = game_specific_dir
    elif filename.startswith(("test_", "check_")):
        dest_dir = tests_and_checks_dir
    elif filename.startswith(("inject_", "add_", "generate_")):
        # Distinguish between active generate scripts and lore
        if filename in ["generate_avatar_prompts.py", "generate_character_maps.py", "generate_preview.py", "generate_daily_persona.py", "generate_html_from_md.py", "generate_md_from_json.py"]:
            continue
        dest_dir = legacy_lore_injections_dir
    elif filename.startswith(("fix_", "clean_", "nuke_", "patch_", "update_", "mass_")):
        # Protect some possible active ones
        if filename in ["update_personas_from_md.py", "mass_update_teams.py"]:
            continue
        dest_dir = one_off_fixes_dir
        
    if dest_dir:
        shutil.move(filepath, os.path.join(dest_dir, filename))
        print(f"Moved {filename} to {os.path.basename(dest_dir)}")

print("Cleanup complete.")
