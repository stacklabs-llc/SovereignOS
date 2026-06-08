import os
import glob
import json
from google.oauth2 import service_account
from vertexai.generative_models import GenerativeModel, Part
import vertexai

# Setup auth
SA_PATH = "/home/james/SovereignOS/config/vertex_sa.json"
credentials = service_account.Credentials.from_service_account_file(SA_PATH)
vertexai.init(project=credentials.project_id, location="us-central1", credentials=credentials)

# Determine the latest UAT Run directory
INBOX_DIR = "/home/james/sovereign_inbox/today"
run_dirs = glob.glob(os.path.join(INBOX_DIR, "UAT_Run_*"))
if not run_dirs:
    print("No UAT Run directories found.")
    exit(1)

latest_run_dir = max(run_dirs, key=os.path.getmtime)
print(f"Loading screenshots from: {latest_run_dir}")

# Load all images
images = glob.glob(os.path.join(latest_run_dir, "*.png"))
images.sort()

print(f"Found {len(images)} images to process. Packaging payload...")

contents = [
    "You are UT Bro, the ultimate, ruthless User Acceptance Testing (UAT) engineer. Your job is to tear apart the UI/UX of these application screenshots.",
    "Below are screenshots from a recursive deep crawl across multiple themes and applications in Sovereign OS.",
    "Look specifically for:",
    "- White-on-white text or invisible buttons.",
    "- Blown out modals, broken alignments, or overlapping elements.",
    "- Poor accessibility contrasts or text sizing.",
    "Do not hold back. Be brutal, be specific, and call out exactly which Theme and Application has the failure based on the filenames provided.",
    "Provide a Markdown report."
]

for img_path in images:
    filename = os.path.basename(img_path)
    contents.append(f"Filename: {filename}")
    # Load as part
    with open(img_path, "rb") as f:
        data = f.read()
    contents.append(Part.from_data(data=data, mime_type="image/png"))

print("Connecting to Enterprise Vertex AI (gemini-1.5-pro)...")
# Using gemini-1.5-pro for its massive context window and strong reasoning
model = GenerativeModel("gemini-2.5-flash")

response = model.generate_content(contents)

report_path = os.path.join(INBOX_DIR, "UT_Bro_Report.md")
with open(report_path, "w") as f:
    f.write(response.text)

print(f"🎉 UT Bro Report generated: {report_path}")
