import os
import re
import base64
import sys
import subprocess
import markdown

MD_REPORT_PATH = "/home/james/sovereign_inbox/daily_07042026/Clio_Root_UAT_Crawl_Report.md"
OUTPUT_DIR = "/home/james/sovereign_inbox/daily_07042026"
FINAL_PDF_PATH = os.path.join(OUTPUT_DIR, "Clio_Root_UAT_Crawl_Report.pdf")
TEMP_HTML_PATH = os.path.join(OUTPUT_DIR, "uat_report_temp.html")

def get_base64_img(img_path):
    try:
        ext = os.path.splitext(img_path)[1].lower().replace('.', '')
        if ext == 'jpg': ext = 'jpeg'
        with open(img_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        return f"data:image/{ext};base64,{b64}"
    except Exception as e:
        print(f"Warning: Failed to read image {img_path}: {e}")
        return ""

def compile_pdf():
    if not os.path.exists(MD_REPORT_PATH):
        print(f"❌ Markdown report not found at {MD_REPORT_PATH}")
        sys.exit(1)

    print(f"📖 Reading markdown report from {MD_REPORT_PATH}...")
    with open(MD_REPORT_PATH, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convert markdown to HTML
    print("🎨 Converting markdown to HTML...")
    html_body = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])

    # Find and inline images
    # Image tags look like: <img alt="..." src="../../SovereignOS/scratch/clio_root_screenshots/..." />
    img_pattern = re.compile(r'src="([^"]+)"')
    
    import html
    def replace_img_src(match):
        src_path = match.group(1)
        # Unescape HTML entities like &amp; to &
        src_path_clean = html.unescape(src_path)
        # Resolve path relative to MD_REPORT_PATH's directory
        md_dir = os.path.dirname(MD_REPORT_PATH)
        abs_img_path = os.path.abspath(os.path.join(md_dir, src_path_clean))
        
        if os.path.exists(abs_img_path):
            print(f"   Inlining image: {src_path_clean} -> Base64")
            b64_data = get_base64_img(abs_img_path)
            if b64_data:
                return f'src="{b64_data}"'
        else:
            print(f"   ⚠️ Image not found: {abs_img_path}")
        return match.group(0)

    html_body = img_pattern.sub(replace_img_src, html_body)

    # Style each capability section to break cleanly
    # Headings like <h3>Recursive Path: ... or <h3>Playcall Desk ... indicate new section.
    # Let's wrap them in a container that avoids page break inside or forces page break before.
    sections = html_body.split('<h3>')
    styled_body_parts = [sections[0]]
    for section in sections[1:]:
        styled_body_parts.append('<div class="capability-section"><h3>' + section + '</div>')
    html_body = "".join(styled_body_parts)

    # High-fidelity Sovereign Home Premium styling
    css_content = """
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    @page {
        size: letter;
        margin: 15mm;
        @bottom-right {
            content: counter(page);
            font-family: 'Outfit', sans-serif;
            font-size: 8pt;
            color: #64748b;
        }
    }
    
    * {
        box-sizing: border-box;
    }
    
    body {
        background-color: #0b0d13;
        color: #e2e8f0;
        font-family: 'Outfit', sans-serif;
        margin: 0;
        padding: 0;
        line-height: 1.6;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    /* Document Title Page / Header */
    .report-header {
        border-bottom: 2px solid #00b4d8;
        padding-bottom: 20px;
        margin-bottom: 40px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    
    .logo-container {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .logo-text {
        font-weight: 700;
        font-size: 28pt;
        letter-spacing: -0.05em;
        color: #ffffff;
    }
    
    .logo-text span {
        color: #00b4d8;
    }
    
    .dossier-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10pt;
        background-color: rgba(0, 180, 216, 0.1);
        border: 1px solid #00b4d8;
        color: #00b4d8;
        padding: 5px 12px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        box-shadow: 0 0 10px rgba(0, 180, 216, 0.2);
    }
    
    h1, h2, h3, h4, h5 {
        margin-top: 0;
        font-weight: 600;
        color: #ffffff;
    }
    
    h1 {
        font-size: 32pt;
        letter-spacing: -0.03em;
        margin-bottom: 10px;
        text-shadow: 0 0 15px rgba(0, 180, 216, 0.3);
    }
    
    h2 {
        font-size: 20pt;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
        margin-top: 50px;
        margin-bottom: 25px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #00b4d8;
    }
    
    h3 {
        font-size: 16pt;
        color: #ffffff;
        margin-top: 30px;
        margin-bottom: 15px;
    }
    
    p {
        margin-top: 0;
        margin-bottom: 20px;
        color: #cbd5e1;
        font-size: 11pt;
    }
    
    /* Code styling */
    pre, code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9pt;
        background-color: rgba(15, 23, 42, 0.6);
    }
    
    pre {
        padding: 15px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow-x: auto;
        margin-bottom: 25px;
        white-space: pre-wrap;
        word-break: break-all;
    }
    
    code {
        padding: 2px 5px;
        border-radius: 4px;
        color: #38bdf8;
    }
    
    /* Table Styling */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
        background-color: rgba(15, 23, 42, 0.4);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    th, td {
        padding: 12px 15px;
        text-align: left;
        font-size: 10pt;
    }
    
    th {
        background-color: rgba(0, 180, 216, 0.15);
        color: #00b4d8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid rgba(0, 180, 216, 0.4);
    }
    
    td {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #cbd5e1;
    }
    
    tr:nth-child(even) {
        background-color: rgba(255, 255, 255, 0.02);
    }
    
    /* Image and capability layouts */
    .capability-section {
        page-break-inside: avoid;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 35px;
        background-color: rgba(15, 23, 42, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .capability-section img {
        width: 100%;
        max-width: 100%;
        border-radius: 8px;
        border: 1px solid rgba(0, 180, 216, 0.3);
        margin: 20px 0;
        box-shadow: 0 0 15px rgba(0, 180, 216, 0.15);
    }
    
    /* Alert style sections */
    .alert-block {
        border-left: 4px solid #00b4d8;
        background-color: rgba(0, 180, 216, 0.05);
        padding: 15px 20px;
        border-radius: 0 8px 8px 0;
        margin-bottom: 25px;
    }
    
    .alert-title {
        font-weight: 600;
        color: #00b4d8;
        margin-bottom: 5px;
        font-size: 11pt;
    }
    
    ul, ol {
        margin-top: 0;
        margin-bottom: 25px;
        padding-left: 20px;
        color: #cbd5e1;
    }
    
    li {
        margin-bottom: 8px;
        font-size: 11pt;
    }
    """

    # Build final HTML
    full_html = f"""<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Clio Gateway UAT Scan Report</title>
        <style>{css_content}</style>
    </head>
    <body>
        <div class="report-header">
            <div class="logo-container">
                <span class="logo-text">SOVEREIGN<span>OS</span></span>
            </div>
            <div class="dossier-tag">UAT DIAGNOSTIC DOSSIER</div>
        </div>
        
        {html_body}
    </body>
    </html>
    """

    print(f"✍️ Writing temporary HTML file to {TEMP_HTML_PATH}...")
    with open(TEMP_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)

    # Compile using Google Chrome print-to-pdf
    chrome_cmd = [
        "/usr/bin/google-chrome",
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={FINAL_PDF_PATH}",
        f"file://{TEMP_HTML_PATH}"
    ]
    
    if not os.path.exists(chrome_cmd[0]):
        chrome_cmd[0] = "/usr/local/bin/google-chrome"

    print(f"🚀 Compiling PDF via Headless Chrome: {' '.join(chrome_cmd)}")
    result = subprocess.run(chrome_cmd, capture_output=True, text=True)

    # Cleanup temporary HTML file to satisfy the Zero-Litter Workspace Policy
    if os.path.exists(TEMP_HTML_PATH):
        os.remove(TEMP_HTML_PATH)
        print("🧹 Cleaned up temporary HTML file.")

    if result.returncode == 0:
        print(f"🎉 Success! PDF report compiled to {FINAL_PDF_PATH}")
        return True
    else:
        print(f"❌ PDF Compilation failed: {result.stderr}")
        return False

if __name__ == "__main__":
    compile_pdf()
