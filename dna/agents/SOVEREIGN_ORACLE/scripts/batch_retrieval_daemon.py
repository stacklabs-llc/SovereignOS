import os
import json
from google import genai

BATCH_JOBS_LEDGER = "/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/scripts/batch_jobs.json"
BREADCRUMB_DIR = "/home/james/SovereignOS/dna/agents/SOVEREIGN_ORACLE/payloads/"

def check_batches():
    if not os.path.exists(BATCH_JOBS_LEDGER):
        print("No batch ledger found.")
        return
        
    with open(BATCH_JOBS_LEDGER, 'r') as f:
        ledger = json.load(f)
        
    client = genai.Client()
    updated_ledger = []
    
    for job in ledger:
        if job.get('status') == 'PENDING':
            try:
                batch_job = client.batches.get(name=job['batch_job_name'])
                state = batch_job.state.name
                print(f"Job {job['batch_job_name']} status: {state}")
                
                if state == 'JOB_STATE_SUCCEEDED':
                    file_content_bytes = client.files.download(name=batch_job.dest.file_name)
                    job_results = file_content_bytes.decode("utf-8")
                    
                    # Write to Sovereign payloads
                    output_path = os.path.join(BREADCRUMB_DIR, f"{job['batch_job_name'].replace('/', '_')}_responses.jsonl")
                    with open(output_path, 'w') as f:
                        f.write(job_results)
                    print(f"Breadcrumb localized to {output_path}")
                    job['status'] = 'COMPLETED'
                    
                elif state == 'JOB_STATE_FAILED':
                    print(f"Job failed: {batch_job.error}")
                    job['status'] = 'FAILED'
            except Exception as e:
                print(f"Could not retrieve job {job['batch_job_name']}: {e}")
                
        updated_ledger.append(job)
        
    with open(BATCH_JOBS_LEDGER, 'w') as f:
        json.dump(updated_ledger, f, indent=4)

if __name__ == '__main__':
    check_batches()
