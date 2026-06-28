import sys
import os
import re
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

# 1. PARSE ARGUMENTS AND DETERMINE SHEET PATH
if len(sys.argv) < 2:
    print("❌ Usage: python3 scripts/advocate_forge.py <advocate_sheet.md> [--style custom]")
    print("💡 Example: python3 scripts/advocate_forge.py dna/archives/game_logs/RiggedLeagueRant_onboarding.md")
    sys.exit(1)

sheet_path = sys.argv[1]
if not os.path.exists(sheet_path):
    print(f"❌ Error: File not found at {sheet_path}")
    sys.exit(1)

# Determine if a custom style is requested
use_custom_style = "--style" in sys.argv or "--custom" in sys.argv

# Derive character handle/name from the filename (e.g. RiggedLeagueRant_onboarding.md -> riggedleaguerant)
character_name = os.path.splitext(os.path.basename(sheet_path))[0].split('_')[0].lower()

# 2. READ & PARSE MARKDOWN SHEET
print(f"📖 Ingesting FanStack Advocate Sheet: {sheet_path}...")
with open(sheet_path, 'r') as f:
    content = f.read()

# Regular expressions to parse sections cleanly
lore_match = re.search(r'# Character Lore\n(.*?)(?=\n#|\Z)', content, re.DOTALL | re.IGNORECASE)
if not lore_match:
    # Fallback to Deep Lore or standard description if Character Lore heading isn't present
    lore_match = re.search(r'## 📖 Deep Lore\n(.*?)(?=\n#|\Z)', content, re.DOTALL | re.IGNORECASE)

poses_match = re.search(r'# Poses\n(.*?)(?=\n#|\Z)', content, re.DOTALL | re.IGNORECASE)

# Default to unhinged pointing/exasperation profile poses if no Poses section exists
default_poses = {
    "avatar": "Standard 1:1 profile headshot looking directly at the camera with an intense, expressive look.",
    "pointing": "Pointing an accusatory finger forward in wild excitement, looking smug.",
    "shrug": "Shrugging in complete disbelief and exasperation, eyes wide."
}

character_lore = lore_match.group(1).strip() if lore_match else "A passionate, highly animated baseball fan."
poses = {}

if poses_match:
    poses_raw = poses_match.group(1).strip()
    for line in poses_raw.split('\n'):
        line = line.strip()
        if line.startswith('-') or line.startswith('*'):
            parts = line[1:].split(':', 1)
            if len(parts) == 2:
                poses[parts[0].strip()] = parts[1].strip()
else:
    poses = default_poses

# Determine Art Style Prompt based on onboarding tier
style_match = re.search(r'# Style Profile\n(.*?)(?=\n#|\Z)', content, re.DOTALL | re.IGNORECASE)
custom_style_prompt = ""
if style_match:
    style_lines = style_match.group(1).strip().split('\n')
    for line in style_lines:
        if "Base Prompt" in line or "Prompt" in line:
            parts = line.split(':', 1)
            if len(parts) == 2:
                custom_style_prompt = parts[1].strip()

# 3. CONSTRUCT STYLING RECIPE
# Golden "Wicked Smaht" Standard baseline style
STANDARD_STYLE = "Flat 2D vector style, expressive Twitch emote cartoon style, clean lines, solid black background. Arranged in a grid layout."

if use_custom_style and custom_style_prompt:
    active_style = custom_style_prompt
    print(f"✨ [A-LIST TIER] Applying custom style profile: {active_style}")
else:
    active_style = STANDARD_STYLE
    print(f"🎨 [STANDARD TIER] Applying golden 'Wicked Smaht' emote layout style.")

print(f"👤 Advocate: @{character_name.upper()}")
print(f"🏃 Actions Parsed: {list(poses.keys())}")

# 4. AUTHENTICATION & VERTEX AI INIT
PROJECT_ID = "gen-lang-client-0840454416"
LOCATION = "us-central1"
CREDENTIALS_PATH = "/home/james/SovereignOS/config/vertex_sa.json"
if os.path.exists(CREDENTIALS_PATH):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH

print("\n🌩️ INITIALIZING VERTEX AI LINK...")
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")

# Create FanStack public avatars output folder dynamically based on character handle
OUTPUT_DIR = f"/home/james/SovereignOS/15_FanStack/public/avatars/{character_name}"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Construct compiled prompts for each pose
compiled_prompts = {}
for state_name, action in poses.items():
    compiled_prompts[state_name] = f"Character Reference sheet of {character_lore}\nAction: {action}\nStyle: {active_style}"

# Interactive Staging / Prompt Preview and Edit Loop (Only if interactive TTY is present)
if sys.stdin.isatty():
    while True:
        print("\n" + "="*60)
        print(f"🔍 PROMPT PREVIEW FOR @{character_name.upper()}")
        print("="*60)
        for state_name, prompt_text in compiled_prompts.items():
            print(f"[{state_name}]:")
            indented = "\n".join("    " + line for line in prompt_text.split("\n"))
            print(indented)
            print("-"*60)
        
        choice = input("👉 Proceed to generate these images? (y = Yes, e = Edit a prompt, q = Quit) [y]: ").strip().lower()
        if not choice or choice == 'y':
            break
        elif choice == 'q':
            print("👋 Aborted by user.")
            sys.exit(0)
        elif choice == 'e':
            pose_to_edit = input(f"👉 Enter the name of the pose to edit ({'/'.join(compiled_prompts.keys())}): ").strip()
            if pose_to_edit not in compiled_prompts:
                print("⚠️ Invalid pose name.")
                continue
            print(f"\nEditing [{pose_to_edit}]. Current prompt:")
            print(compiled_prompts[pose_to_edit])
            new_prompt = input("\nEnter the custom prompt (or press Enter to keep current): ").strip()
            if new_prompt:
                compiled_prompts[pose_to_edit] = new_prompt
                print(f"✅ Updated prompt for [{pose_to_edit}].")

print(f"🔥 FORGING PRODUCTION AVATARS FOR @{character_name.upper()}...")

for state_name, full_prompt in compiled_prompts.items():
    print(f"⚙️ Forging state: [{state_name}]...")
    
    try:
        # Generate the premium frame from Vertex AI
        response = model.generate_images(
            prompt=full_prompt,
            number_of_images=1,
            aspect_ratio="1:1"
        )
        
        # Save dynamically under 15_FanStack/public/avatars/{character}/{character}_{state}.png
        file_path = f"{OUTPUT_DIR}/{character_name}_{state_name}.png"
        response[0].save(file_path)
        print(f"✅ Saved: {file_path}")
            
    except Exception as e:
        print(f"⚠️ [API ERROR] on {state_name}: {e}")

print(f"🚀 PRODUCTION FORGE COMPLETE. The FanStack assets are live in: {OUTPUT_DIR}")
