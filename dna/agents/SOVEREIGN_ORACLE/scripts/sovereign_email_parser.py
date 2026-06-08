import os
import glob
import json
from email import policy
from email.parser import BytesParser
from google import genai
from google.genai import types

# Architecture Pointers
DROPZONE_DIR = "/home/james/SovereignOS/dna/media/hailo_dropzone"
BATCH_JOBS_LEDGER = "/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/scripts/batch_jobs.json"
JSONL_PAYLOAD_PATH = "/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/scripts/batch_requests.jsonl"

def parse_eml(filepath):
    with open(filepath, 'rb') as f:
        msg = BytesParser(policy=policy.default).parse(f)
    body = msg.get_body(preferencelist=('plain',))
    content = body.get_content() if body else ""
    return {
        "subject": msg.get('subject', 'No Subject'),
        "from": msg.get('from', 'Unknown Sender'),
        "date": msg.get('date', 'Unknown Date'),
        "content": content
    }

def build_jsonl():
    eml_files = glob.glob(os.path.join(DROPZONE_DIR, "*.eml"))
    if not eml_files:
        print("No .eml files found in dropzone.")
        return False
        
    system_prompt = "You are DotMatrix, a Domain Alpha parsing agent for the Sovereign OS. Your task is to extract actionable intelligence from emails into structured Configuration Items (CIs). Output clear, precise JSON outlining any actionable dates, cost impacts, or operational mandates."

    with open(JSONL_PAYLOAD_PATH, 'w') as f:
        for idx, file in enumerate(eml_files):
            email_data = parse_eml(file)
            prompt = f"Analyze this Email:\nFrom: {email_data['from']}\nSubject: {email_data['subject']}\nDate: {email_data['date']}\n\nBody: {email_data['content']}"
            
            # format as per Gemini Batch API
            request_obj = {
                "request_id": f"email_parse_{idx}",
                "request": {
                    "model": "models/gemini-1.5-flash",
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": prompt}]
                        }
                    ],
                    "system_instruction": {
                        "parts": [{"text": system_prompt}]
                    }
                }
            }
            f.write(json.dumps(request_obj) + '\n')
            
    print(f"Successfully packaged {len(eml_files)} emails into {JSONL_PAYLOAD_PATH}")
    return True

def dispatch_batch():
    try:
        client = genai.Client()
        print("Uploading JSONL to Gemini API...")
        uploaded_file = client.files.upload(
            file=JSONL_PAYLOAD_PATH,
            config={"mime_type": "application/jsonl"}
        )
        print(f"File uploaded. URI: {uploaded_file.name}")
        
        print("Dispatching Batch Job...")
        batch_job = client.batches.create(
            model="gemini-1.5-flash",
            src=uploaded_file.name,
            config={"display_name": "Sovereign-Email-Ingest"}
        )
        
        # Log job to localized tracker
        job_data = {"batch_job_name": batch_job.name, "status": "PENDING"}
        
        if os.path.exists(BATCH_JOBS_LEDGER):
            with open(BATCH_JOBS_LEDGER, 'r') as f:
                ledger = json.load(f)
        else:
            ledger = []
            
        ledger.append(job_data)
        with open(BATCH_JOBS_LEDGER, 'w') as f:
            json.dump(ledger, f, indent=4)
            
        print(f"Batch dispatched. Name: {batch_job.name}. Saved to ledger.")
    except Exception as e:
        print(f"Failed to dispatch batch: {e}")

if __name__ == '__main__':
    if build_jsonl():
        dispatch_batch()
