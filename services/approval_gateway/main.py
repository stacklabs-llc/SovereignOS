#!/usr/bin/env python3
# ==============================================================================
# Sovereign OS: JIT Mobile Approval Gateway Service
# Path: /home/james/SovereignOS/services/approval_gateway/main.py
# ==============================================================================
import os
import sys
import asyncio
import imaplib
import email
from email.header import decode_header
import threading
import sqlite3
import datetime
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add scripts directory to path to import db helper
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "scripts"))
from core.db import get_db

app = FastAPI(title="Sovereign JIT Mobile Approval Gateway")

# Enable CORS for easy mobile debugging over Tailscale
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RejectRequest(BaseModel):
    comments: str

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h2>Approval Gateway Frontend Missing</h2>", status_code=404)

@app.get("/api/v1/approvals")
async def get_pending_approvals():
    """Get all approvals in Requested state."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT sys_id, u_task_id, u_assigned_to, u_title, u_plan_markdown, u_state, u_auth_level, u_sys_created_on
                FROM u_sys_approval_queue
                WHERE u_state = 'Requested'
                ORDER BY u_sys_created_on ASC
            """)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@app.post("/api/v1/approvals/{sys_id}/approve")
async def approve_request(sys_id: str):
    """Set approval state to Approved and elevate auth level to omega=1."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if record exists
            cursor.execute("SELECT u_task_id, u_title FROM u_sys_approval_queue WHERE sys_id = ?", (sys_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Approval request not found")
                
            task_id, title = row['u_task_id'], row['u_title']
            
            cursor.execute("""
                UPDATE u_sys_approval_queue
                SET u_state = 'Approved',
                    u_auth_level = 'omega=1',
                    u_sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (sys_id,))
            
            # Also auto-update corresponding sys_sdlc_task or sovereign_tickets if they exist
            # to staging / preapproved to run state
            cursor.execute("""
                UPDATE sovereign_tickets
                SET work_notes = 'Omega=1 authorization signed via JIT Gateway'
                WHERE number = ? OR short_description LIKE ?
            """, (task_id, f"%{task_id}%"))
            
            conn.commit()
            
        print(f"⚡ [OMEGA=1 AUTHORIZED] Approved request {sys_id} for task {task_id} ('{title}')")
        return {"status": "success", "message": "Authorized with omega=1 privilege level."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approval update failed: {e}")

@app.post("/api/v1/approvals/{sys_id}/reject")
async def reject_request(sys_id: str, payload: RejectRequest):
    """Set approval state to Rejected."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE u_sys_approval_queue
                SET u_state = 'Rejected',
                    u_comments = ?,
                    u_sys_updated_on = CURRENT_TIMESTAMP
                WHERE sys_id = ?
            """, (payload.comments, sys_id))
            conn.commit()
        print(f"❌ [REJECTED] Rejected approval request {sys_id} with comments: {payload.comments}")
        return {"status": "success", "message": "Approval request rejected."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rejection update failed: {e}")


# ==============================================================================
# Dual-Channel IMAP Polling Thread (Background Process)
# ==============================================================================
def poll_email_approvals():
    """Poll Gmail inbox for reply emails containing #APPROVE OMEGA=1."""
    # Ensure env is loaded
    from dotenv import load_dotenv
    load_dotenv("/home/james/SovereignOS/.env")
    
    email_user = os.getenv("SOVEREIGN_OUTBOUND_USER", "sovereign.os.v1@gmail.com")
    email_pass = os.getenv("SOVEREIGN_OUTBOUND_PASSWORD")
    
    if not email_pass:
        print("[INFO] Email approval poller: SOVEREIGN_OUTBOUND_PASSWORD not defined. Skipping IMAP loop.")
        return
        
    print(f"📡 [STARTUP] Starting JIT Email Poller for account: {email_user}")
    
    while True:
        try:
            # Connect to IMAP
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(email_user, email_pass)
            mail.select("inbox")
            
            # Search for unread messages
            status, messages = mail.search(None, 'UNSEEN')
            if status == "OK" and messages[0]:
                for num in messages[0].split():
                    # Fetch email headers and body
                    status, data = mail.fetch(num, '(RFC822)')
                    if status != "OK":
                        continue
                        
                    raw_email = data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    # Parse subject
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding or "utf-8", errors="ignore")
                    
                    if not subject or "Sovereign OS Approve:" not in subject:
                        continue
                        
                    # Extract sys_id from Subject: e.g. "Sovereign OS Approve: [sys_id]"
                    try:
                        sys_id = subject.split("Sovereign OS Approve:")[-1].strip(" []")
                    except Exception:
                        continue
                        
                    # Get body
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="ignore")
                                break
                    else:
                        body = msg.get_payload(decode=True).decode(msg.get_content_charset() or "utf-8", errors="ignore")
                        
                    if "#APPROVE OMEGA=1" in body:
                        print(f"📧 [EMAIL APPROVAL] Detected #APPROVE OMEGA=1 via email subject token: {sys_id}")
                        
                        # Apply database updates
                        with get_db() as conn:
                            cursor = conn.cursor()
                            cursor.execute("SELECT u_task_id FROM u_sys_approval_queue WHERE sys_id = ? AND u_state = 'Requested'", (sys_id,))
                            row = cursor.fetchone()
                            if row:
                                cursor.execute("""
                                    UPDATE u_sys_approval_queue
                                    SET u_state = 'Approved',
                                        u_auth_level = 'omega=1',
                                        u_sys_updated_on = CURRENT_TIMESTAMP
                                    WHERE sys_id = ?
                                """, (sys_id,))
                                conn.commit()
                                print(f"⚡ [EMAIL AUTH COMPLETE] Task {row['u_task_id']} successfully authorized with omega=1.")
                                
                                # Mark message as read / delete it to prevent double-processing
                                mail.store(num, '+FLAGS', '\\Seen')
                            else:
                                print(f"[WARNING] No pending requested ticket found for sys_id {sys_id}")
                                
            mail.logout()
        except Exception as e:
            # Catch all so polling thread doesn't die
            print(f"[WARNING] JIT Email Poller encountered error: {e}")
            
        # Poll every 10 seconds
        threading.Event().wait(10.0)

@app.on_event("startup")
def start_email_poller():
    t = threading.Thread(target=poll_email_approvals, daemon=True)
    t.start()
