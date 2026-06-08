import os
import glob

script_dir = "/home/james/SovereignOS/scripts"
target_str = '"/home/james/SovereignOS/sovereign_now.db"'
replacement_str = '"/home/james/SovereignOS/dna/sovereign_now.db"'

target_str2 = "'/home/james/SovereignOS/sovereign_now.db'"
replacement_str2 = "'/home/james/SovereignOS/dna/sovereign_now.db'"

for filepath in glob.glob(os.path.join(script_dir, "**/*.py"), recursive=True):
    with open(filepath, "r") as f:
        content = f.read()
    
    if target_str in content or target_str2 in content:
        content = content.replace(target_str, replacement_str)
        content = content.replace(target_str2, replacement_str2)
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Fixed {filepath}")
