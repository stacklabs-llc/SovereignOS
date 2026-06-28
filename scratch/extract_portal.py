import re

JS_PATH = '/home/james/SovereignOS/19_Sovereign_Sports/dist/assets/index-C2mhp_QK.js'

def main():
    print(f"Reading compiled JS: {JS_PATH}")
    with open(JS_PATH, 'r') as f:
        content = f.read()
    
    print(f"File size: {len(content)} bytes")
    
    # Look for strings associated with the scoreboard, bases, tracker, etc.
    keywords = ["vein_popping_fury", "outrage_proxy_umpires", "cypher-eq-container", "Statcast", "BOGGS", "spidey"]
    for kw in keywords:
        pos = content.find(kw)
        if pos != -1:
            print(f"\n--- Found '{kw}' at position {pos} ---")
            start = max(0, pos - 1000)
            end = min(len(content), pos + 1000)
            print(content[start:end])
        else:
            print(f"'{kw}' not found")

if __name__ == '__main__':
    main()
