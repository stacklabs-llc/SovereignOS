#!/usr/bin/env python3
import os
import sys
import subprocess
import markdown

def compile_md_to_pdf(md_source, pdf_destination, title, subtitle, cover_theme="forest"):
    print(f"Reading Markdown source: {md_source}...")
    if not os.path.exists(md_source):
        print(f"Error: Source file {md_source} does not exist!")
        return False
        
    with open(md_source, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Strip first H1 header if it's the title to avoid duplication
    cleaned_md = md_content
    lines = cleaned_md.split("\n")
    if lines and lines[0].startswith("# "):
        cleaned_md = "\n".join(lines[1:])
        
    print("Converting Markdown to HTML...")
    body_html = markdown.markdown(cleaned_md, extensions=['fenced_code', 'tables'])

    # CSS design system matching a premium corporate gold & deep forest green theme
    cover_gradient = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" # Dark slate
    if cover_theme == "forest":
        cover_gradient = "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" # Forest green
    elif cover_theme == "gold":
        cover_gradient = "linear-gradient(135deg, #78350f 0%, #451a03 100%)" # Rich Amber/Gold

    css_content = f"""
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    :root {{
        --color-bg: #fafaf9;
        --color-text: #1c2e2c;
        --color-text-light: #445654;
        --color-primary: #0f766e;
        --color-primary-light: #f0fdfa;
        --color-accent: #b45309;
        --color-accent-light: #fef3c7;
        --color-border: #e2e8f0;
    }}
    
    * {{
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }}
    
    @page {{
        size: letter;
        margin: 25mm 20mm 20mm 20mm;
        @bottom-right {{
            content: counter(page);
            font-family: 'Outfit', sans-serif;
            font-size: 9pt;
            color: #889694;
        }}
        @top-left {{
            content: "Sovereign OS • Confidential Memorandum";
            font-family: 'Outfit', sans-serif;
            font-size: 8pt;
            color: #889694;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }}
    }}
    
    body {{
        font-family: 'Inter', -apple-system, sans-serif;
        color: var(--color-text);
        background-color: var(--color-bg);
        line-height: 1.6;
        font-size: 11pt;
        margin: 0;
        padding: 0;
    }}
    
    .cover-page {{
        page-break-after: always;
        height: 9.0in;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        padding: 60px;
        border: 4px solid #b45309;
        background: {cover_gradient};
        color: #fafaf9;
    }}
    
    .cover-header {{
        font-size: 10pt;
        text-transform: uppercase;
        letter-spacing: 0.25em;
        color: #fbbf24;
        margin-bottom: auto;
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
    }}
    
    .cover-body {{
        margin-top: auto;
        margin-bottom: auto;
    }}
    
    .cover-title {{
        font-family: 'Outfit', sans-serif;
        font-size: 28pt;
        font-weight: 800;
        line-height: 1.2;
        color: #fafaf9;
        margin: 0 0 15px 0;
        letter-spacing: -0.5px;
    }}
    
    .cover-subtitle {{
        font-size: 13pt;
        font-weight: 400;
        color: #fbbf24;
        margin: 0 0 40px 0;
        letter-spacing: 0.05em;
        line-height: 1.4;
    }}
    
    .cover-divider {{
        width: 120px;
        height: 5px;
        background-color: #fbbf24;
        margin-bottom: 40px;
    }}
    
    .cover-footer {{
        margin-top: auto;
        border-top: 1px solid rgba(251, 191, 36, 0.3);
        padding-top: 25px;
        display: flex;
        justify-content: space-between;
        font-size: 9.5pt;
        color: #94a3b8;
    }}
    
    .cover-footer-item strong {{
        color: #fbbf24;
        display: block;
        margin-bottom: 4px;
        text-transform: uppercase;
        font-size: 8pt;
        letter-spacing: 0.1em;
        font-family: 'Outfit', sans-serif;
    }}
    
    .content-container {{
        padding: 0 10px;
    }}
    
    h1, h2, h3, h4 {{
        font-family: 'Outfit', sans-serif;
        color: #0f172a;
        font-weight: 700;
        margin-top: 1.6em;
        margin-bottom: 0.5em;
        page-break-after: avoid;
    }}
    
    h1 {{
        font-size: 18pt;
        line-height: 1.2;
        border-bottom: 3px solid var(--color-primary);
        padding-bottom: 8px;
        margin-top: 0;
        margin-bottom: 1em;
        text-transform: uppercase;
    }}
    
    h2 {{
        font-size: 13pt;
        border-left: 4px solid var(--color-primary);
        padding-left: 12px;
        color: var(--color-primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2em;
    }}
    
    h3 {{
        font-size: 11pt;
        color: var(--color-accent);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    
    p {{
        margin-top: 0;
        margin-bottom: 1.2em;
        color: var(--color-text-light);
        text-align: justify;
    }}
    
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 1.5em 0;
        page-break-inside: avoid;
        font-size: 9.5pt;
    }}
    
    th, td {{
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid var(--color-border);
    }}
    
    th {{
        background-color: var(--color-primary-light);
        color: var(--color-primary);
        font-weight: 700;
        text-transform: uppercase;
        font-size: 8.5pt;
        letter-spacing: 0.5px;
    }}
    
    tr:nth-child(even) td {{
        background-color: #fcfcfb;
    }}
    
    blockquote {{
        margin: 1.5em 0;
        padding: 15px 20px;
        background-color: #fef3c7;
        border-left: 5px solid #d97706;
        border-radius: 0 6px 6px 0;
        page-break-inside: avoid;
    }}
    
    blockquote p {{
        margin: 0;
        color: #78350f;
        font-weight: 500;
        font-size: 10pt;
    }}
    
    pre {{
        background-color: #0f172a;
        color: #38bdf8;
        padding: 15px;
        border-radius: 6px;
        overflow-x: auto;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9pt;
        line-height: 1.5;
        margin: 1.5em 0;
        border-left: 4px solid var(--color-accent);
    }}
    
    code {{
        font-family: 'JetBrains Mono', monospace;
        font-size: 90%;
        background-color: #f1f5f9;
        color: #0f766e;
        padding: 2px 4px;
        border-radius: 3px;
    }}
    
    hr {{
        border: 0;
        border-top: 1px dashed var(--color-border);
        margin: 2em 0;
    }}
    """
    
    # HTML document wrapping structure
    html_document = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <style>
        {css_content}
    </style>
</head>
<body>

    <div class="cover-page">
        <div class="cover-header">Stack Labs LLC • Sovereign Architecture</div>
        <div class="cover-body">
            <h1 class="cover-title">{title}</h1>
            <div class="cover-subtitle">{subtitle}</div>
            <div class="cover-divider"></div>
        </div>
        <div class="cover-footer">
            <div class="cover-footer-item">
                <strong>Issuer</strong>
                Stack Labs LLC (In Formation)<br>Smyrna, Georgia
            </div>
            <div class="cover-footer-item">
                <strong>Managing Partner</strong>
                James Carroll, Founder<br>Enterprise ITSM Architect
            </div>
            <div class="cover-footer-item">
                <strong>Date</strong>
                May 27, 2026
            </div>
        </div>
    </div>

    <div class="content-container">
        {body_html}
    </div>

</body>
</html>
"""
    
    # Post-process GitHub alert style blocks
    html_document = html_document.replace('<blockquote>\n<p>&gt; [!IMPORTANT]', '<blockquote style="background-color: #fef2f2; border-left-color: #ef4444;"><p style="color: #991b1b;"><strong>⚠️ IMPORTANT REGISTER NOTICE:</strong>')
    html_document = html_document.replace('<blockquote>\n<p>&gt; [!TIP]', '<blockquote style="background-color: #fef3c7; border-left-color: #d97706;"><p style="color: #78350f;"><strong>💡 INVESTMENT STRATEGY:</strong>')
    html_document = html_document.replace('<blockquote>\n<p>&gt; [!NOTE]', '<blockquote style="background-color: #eff6ff; border-left-color: #3b82f6;"><p style="color: #1e3a8a;"><strong>ℹ️ SYSTEM REGISTER NOTE:</strong>')

    temp_html = md_source.replace(".md", "_temp.html")
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_document)
    print(f"Generated intermediate HTML at: {temp_html}")
    
    # Run Headless Chrome to compile PDF
    chrome_cmd = [
        "/snap/bin/chromium",
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--virtual-time-budget=10000",
        f"--print-to-pdf={pdf_destination}",
        f"file://{temp_html}"
    ]
    
    print(f"Compiling PDF via Headless Chromium: {pdf_destination}...")
    result = subprocess.run(chrome_cmd, capture_output=True, text=True)
    
    # Cleanup intermediate HTML
    if os.path.exists(temp_html):
        try:
            os.remove(temp_html)
            print("Cleaned up temporary HTML file.")
        except Exception as e:
            print(f"Failed to remove temporary HTML: {e}")
            
    if result.returncode == 0 and os.path.exists(pdf_destination):
        print(f"✅ Success! PDF successfully compiled: {pdf_destination}")
        return True
    else:
        print("❌ Chromium PDF generation failed!")
        print(f"stdout: {result.stdout}")
        print(f"stderr: {result.stderr}")
        return False

def main():
    # File paths
    brief_md = "/home/james/sovereign_inbox/daily_05272026/cypher_drop/Sovereign_OS_Strategic_Brief_20260527.md"
    brief_pdf = "/home/james/sovereign_inbox/daily_05272026/cypher_drop/Sovereign_OS_Strategic_Brief_20260527.pdf"
    
    report_md = "/home/james/sovereign_inbox/daily_05272026/cypher_drop/pawel_rudnicki_handover_report.md"
    report_pdf = "/home/james/sovereign_inbox/daily_05272026/cypher_drop/Pawel_Rudnicki_Handover_Report_20260527.pdf"

    # Compile brief
    compile_md_to_pdf(
        md_source=brief_md,
        pdf_destination=brief_pdf,
        title="SOVEREIGN OS: COMMERCIAL MONETIZATION & MOAT ANALYSIS",
        subtitle="Private Investment Memorandum & Decentralized Stack System",
        cover_theme="forest"
    )

    # Compile report
    compile_md_to_pdf(
        md_source=report_md,
        pdf_destination=report_pdf,
        title="PAWEL RUDNICKI: ARCHIVAL HANDOVER & RELATIONSHIP BRIEFING",
        subtitle="High-Fidelity Context Synchronization for AI Swarm Governance",
        cover_theme="gold"
    )

if __name__ == "__main__":
    main()
