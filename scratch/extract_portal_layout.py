import re

JS_PATH = '/home/james/SovereignOS/19_Sovereign_Sports/dist/assets/index-C2mhp_QK.js'

def main():
    with open(JS_PATH, 'r') as f:
        content = f.read()
    
    pos = content.find("vein_popping_fury")
    if pos != -1:
        print(f"Found 'vein_popping_fury' at position {pos}")
        start = max(0, pos - 15000)
        end = min(len(content), pos + 15000)
        with open('/home/james/SovereignOS/scratch/extracted_layout.js', 'w') as f_out:
            f_out.write(content[start:end])
        print("Written to /home/james/SovereignOS/scratch/extracted_layout.js")
    else:
        print("'vein_popping_fury' not found")

if __name__ == '__main__':
    main()
