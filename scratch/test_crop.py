import os
from PIL import Image

def crop_and_save(src, box, dest):
    img = Image.open(src)
    cropped = img.crop(box)
    cropped = cropped.resize((512, 512), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    cropped.save(dest, "PNG")
    print(f"Saved {dest} from {box}")

# 1. Triple A Truther (1376 x 768)
triple_src = "/home/james/sovereign_inbox/pilot_drops/triple_a_truther_Scout_with_clipboard_90s_cartoon_202606031428.jpeg"
crop_and_save(triple_src, (30, 500, 298, 768), "/home/james/sovereign_inbox/today/test_triple_avatar.png")
crop_and_save(triple_src, (374, 500, 642, 768), "/home/james/sovereign_inbox/today/test_triple_pointing.png")
crop_and_save(triple_src, (718, 500, 986, 768), "/home/james/sovereign_inbox/today/test_triple_shrug.png")
