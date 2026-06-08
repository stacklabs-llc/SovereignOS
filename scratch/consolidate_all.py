import os
import zipfile
import re

zip_path = "/home/james/sovereign_inbox/today/sovereign_os_notebooklm_sync/SovereignOs - Project Status_sources.zip"
missing_dir = "/home/james/sovereign_inbox/today/sovereign_os_notebooklm_sync/missing_sources"
out_dir = "/home/james/sovereign_inbox/today/sovereign_os_notebooklm_sync/consolidated_sources"
os.makedirs(out_dir, exist_ok=True)

# Clean out any old files in out_dir first
for f in os.listdir(out_dir):
    if f.endswith(".md"):
        try:
            os.remove(os.path.join(out_dir, f))
        except Exception:
            pass

categories = {
    "01_Sovereign_OS_Core_DNA_and_Patents": [],
    "02_Sovereign_OS_Session_Reports_April_2026": [],
    "03_Sovereign_OS_Session_Reports_May_01_to_15_2026": [],
    "04_Sovereign_OS_Session_Reports_May_16_to_24_2026": [],
    "05_Sovereign_OS_Session_Reports_May_25_2026_and_Today": [],
    "06_Sovereign_OS_Walkthroughs_and_Technical_Audits": [],
    "07_Sovereign_OS_Additional_Context_and_Telemetry": []
}

def get_category(filename):
    fname_upper = filename.upper()
    
    if "DNA" in fname_upper or "PROSPECTUS" in fname_upper or "ENGINE" in fname_upper or "PHILOSOPHY" in fname_upper or "PATENT" in fname_upper:
        return "01_Sovereign_OS_Core_DNA_and_Patents"
        
    if "SESSION_REPORT" in fname_upper or "SESSION_SHUTDOWN" in fname_upper:
        match = re.search(r'2026(\d{2})(\d{2})', filename)
        if match:
            month = match.group(1)
            day = match.group(2)
            if month == "04":
                return "02_Sovereign_OS_Session_Reports_April_2026"
            elif month == "05":
                day_int = int(day)
                if day_int <= 15:
                    return "03_Sovereign_OS_Session_Reports_May_01_to_15_2026"
                elif day_int <= 24:
                    return "04_Sovereign_OS_Session_Reports_May_16_to_24_2026"
                else:
                    return "05_Sovereign_OS_Session_Reports_May_25_2026_and_Today"
        if "202604" in filename or "_04_" in filename:
            return "02_Sovereign_OS_Session_Reports_April_2026"
        elif "202605" in filename:
            if "20260525" in filename:
                return "05_Sovereign_OS_Session_Reports_May_25_2026_and_Today"
            return "04_Sovereign_OS_Session_Reports_May_16_to_24_2026"
        return "05_Sovereign_OS_Session_Reports_May_25_2026_and_Today"
        
    if "WALKTHROUGH" in fname_upper or "UAT" in fname_upper or "BUG" in fname_upper or "DFCT" in fname_upper or "INC" in fname_upper or "RECOVERY" in fname_upper:
        return "06_Sovereign_OS_Walkthroughs_and_Technical_Audits"
        
    return "07_Sovereign_OS_Additional_Context_and_Telemetry"

# Helper function to split a large text into parts of ~200,000 words
def split_large_text(name, text, max_words=200000):
    words = text.split()
    total_words = len(words)
    if total_words <= max_words:
        return [(name, text)]
        
    parts = []
    num_parts = (total_words // max_words) + 1
    words_per_part = total_words // num_parts
    
    # Split text by lines to keep formatting intact
    lines = text.splitlines()
    total_lines = len(lines)
    lines_per_part = total_lines // num_parts
    
    for i in range(num_parts):
        start_line = i * lines_per_part
        end_line = (i + 1) * lines_per_part if i < num_parts - 1 else total_lines
        part_text = "\n".join(lines[start_line:end_line])
        part_name = f"{os.path.splitext(name)[0]}_Part{i+1}{os.path.splitext(name)[1]}"
        parts.append((part_name, part_text))
        
    return parts

# 1. Process files from ZIP
processed_count = 0
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    for name in zip_ref.namelist():
        if name.endswith("/"):
            continue
        try:
            content = zip_ref.read(name).decode("utf-8", errors="ignore")
            cat = get_category(name)
            
            # Split large files proactively before categorization
            subdocs = split_large_text(name, content)
            for sub_name, sub_content in subdocs:
                categories[cat].append((sub_name, sub_content))
            processed_count += 1
        except Exception as e:
            pass

# 2. Process missing/new files
new_count = 0
for root, dirs, files in os.walk(missing_dir):
    for f in files:
        if f.endswith((".md", ".txt")):
            path = os.path.join(root, f)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as file_ref:
                    content = file_ref.read()
                cat = get_category(f)
                
                # Split large files proactively before categorization
                subdocs = split_large_text(f, content)
                for sub_name, sub_content in subdocs:
                    categories[cat].append((sub_name, sub_content))
                new_count += 1
            except Exception as e:
                pass

# 3. Write consolidated files with automatic word count splitting (max 300,000 words per file)
print("[+] Writing consolidated mega-files with smart word-count splitting...")
MAX_WORDS = 300000

for cat_base, entries in categories.items():
    if not entries:
        continue
        
    part = 1
    current_words = 0
    current_entries = []
    
    def flush_part(part_num, part_entries):
        part_suffix = f"_Part{part_num}" if (part_num > 1 or len(entries) > 50) else ""
        part_filename = f"{cat_base}{part_suffix}.md"
        dest_path = os.path.join(out_dir, part_filename)
        
        w_count = sum(len(text.split()) for name, text in part_entries)
        print(f"    Writing {part_filename} ({len(part_entries)} docs, ~{w_count} words)...")
        
        with open(dest_path, "w", encoding="utf-8") as out_file:
            out_file.write(f"# CONSOLIDATED SOURCE: {cat_base.replace('_', ' ')} Part {part_num}\n")
            out_file.write(f"This is part {part_num} of a consolidated index containing {len(part_entries)} source files.\n\n")
            out_file.write("=========================================================================\n\n")
            
            for name, content in sorted(part_entries, key=lambda x: x[0]):
                out_file.write(f"\n\n\n\n# START_DOCUMENT: {name}\n")
                out_file.write("=========================================================================\n")
                out_file.write(content)
                out_file.write("\n=========================================================================\n")
                out_file.write(f"# END_DOCUMENT: {name}\n\n\n\n")

    for name, content in sorted(entries, key=lambda x: x[0]):
        words_in_doc = len(content.split())
        
        if current_words + words_in_doc > MAX_WORDS and current_entries:
            flush_part(part, current_entries)
            part += 1
            current_entries = []
            current_words = 0
            
        current_entries.append((name, content))
        current_words += words_in_doc
        
    if current_entries:
        flush_part(part, current_entries)

print("\n=== CONSOLIDATION & SPLITTING COMPLETE ===")
print(f"Combined a total of {processed_count + new_count} files into highly-curated, safe-size mega-files.")
print(f"Output folder: {out_dir}")
