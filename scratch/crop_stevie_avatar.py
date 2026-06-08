import os
from PIL import Image

generated_img_path = "/home/james/.gemini/antigravity/brain/51ccefb5-b035-420a-871f-72f3e978261f/uncle_stevie_stan_charmap_1779750260309.png"
inbox_charmap_path = "/home/james/sovereign_inbox/uncle_stevie_stan_charmap.png"
inbox_avatar_path = "/home/james/sovereign_inbox/uncle_stevie_stan_avatar.png"

# Load image
img = Image.open(generated_img_path)

# Save original charmap to inbox
img.save(inbox_charmap_path)
print(f"[+] Saved original character map to {inbox_charmap_path}")

# Isolate top-left avatar face
# Top-left cell in 3x3 grid (341x341)
# X goes from ~10 to ~330
# Y goes from ~40 to ~340 (skipping top label)
crop_box = (10, 40, 331, 340)
avatar_img = img.crop(crop_box)

# Resize to high-quality 256x256
avatar_img = avatar_img.resize((256, 256), Image.Resampling.LANCZOS)

# Save to inbox
avatar_img.save(inbox_avatar_path)
print(f"[+] Saved cropped avatar to {inbox_avatar_path}")

# Save to all production directories in the workspace
production_paths = [
    "/home/james/SovereignOS/01_Sovereign_Portal/public/avatars/uncle_stevie_stan.png",
    "/home/james/SovereignOS/15_FanStack/public/avatars/uncle_stevie_stan.png",
    "/home/james/SovereignOS/20_AetherVet/public/avatars/uncle_stevie_stan.png",
    "/home/james/SovereignOS/01_Sovereign_Portal/dist/avatars/uncle_stevie_stan.png",
    "/home/james/SovereignOS/15_FanStack/dist/avatars/uncle_stevie_stan.png",
    "/home/james/SovereignOS/20_AetherVet/dist/avatars/uncle_stevie_stan.png"
]

for p in production_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    avatar_img.save(p)
    print(f"    [+] Copied avatar to production path: {p}")

print("\n=== AVATAR CROPPING & PROVISIONING COMPLETE ===")
