import imaplib
import email
import re
import os
import json
import uuid
from bs4 import BeautifulSoup
from email.header import decode_header
from dotenv import load_dotenv

# Load credentials from .env file (you need to create this with GMAIL_USER and GMAIL_APP_PASSWORD)
load_dotenv()
USERNAME = os.getenv("GMAIL_USER", "jc2pointzero@gmail.com")
PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "YOUR_APP_PASSWORD_HERE") 

# Connection settings
IMAP_SERVER = "imap.gmail.com"
CONTEXT_FILE = "/home/james/SovereignOS/scripts/fanstack_live_context.txt"
STAGING_FILE = "/home/james/SovereignOS/scripts/promo_staging.json"

def extract_promotional_entropy(html_content):
    """
    The Regex Chainsaw: Strips HTML and extracts the pure cheese viscosity.
    Looks for prices, dates, and capitalized marketing nouns.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    
    # Extract $ amounts
    prices = re.findall(r'\$\d+(?:\.\d{2})?', text)
    # Extract Dates (e.g. May 15-17, June 6)
    dates = re.findall(r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:-\d{1,2})?', text)
    
    # Grab the juiciest sentence containing a price, date, or exclamations
    sentences = text.split('.')
    promo_lines = [s.strip() for s in sentences if '$' in s or 'Night' in s or 'Free' in s or '!' in s]
    
    if promo_lines:
        return " | ".join(set(promo_lines[:2])) # Return the top 2 juiciest lines
    return text[:150] + "..." # Fallback

def sweep_inbox():
    print(f"Connecting to {IMAP_SERVER} as {USERNAME}...")
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(USERNAME, PASSWORD)
    except Exception as e:
        print(f"Login failed! Generate an App Password in your Google Account: {e}")
        return

    # Select the root inbox for the new dedicated burner account
    mail.select('inbox')
    _, messages = mail.search(None, 'UNSEEN')
    
    email_ids = []
    if messages and messages[0]:
        email_ids = messages[0].split()
        
    if not email_ids:
        print("No promotional emails found in label:daily-mlb.")
        return

    print(f"Revving the chainsaw... Found {len(email_ids)} promos waiting in daily-mlb.")
    
    new_context_entries = []

    for e_id in email_ids:
        res, msg_data = mail.fetch(e_id, '(RFC822)')
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Decode Subject
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                # Decode Sender
                sender = msg.get("From")
                print(f"Extracting: {sender} - {subject}")
                
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/html":
                            body = part.get_payload(decode=True).decode()
                            break
                        elif part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode()
                else:
                    body = msg.get_payload(decode=True).decode()
                
                # Run the Regex Chainsaw
                juicy_details = extract_promotional_entropy(body)
                
                # Format for the Staging Area
                injection = f"[CRITICAL PROMO DROP] {sender} announces: {subject}. HIGHLIGHTS: {juicy_details}\n"
                
                promo_data = {
                    "id": str(uuid.uuid4()),
                    "source": sender,
                    "headline": subject,
                    "details": juicy_details,
                    "raw_text": injection
                }
                new_context_entries.append(promo_data)
                
                # Mark as Read so we don't process it again
                mail.store(e_id, '+FLAGS', '\\Seen')

    mail.logout()

    # Move to the Cosmic Sieve (Staging Area)
    if new_context_entries:
        try:
            with open(STAGING_FILE, "r") as f:
                staging_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            staging_data = []
            
        staging_data.extend(new_context_entries)
        
        with open(STAGING_FILE, "w", encoding="utf-8") as f:
            json.dump(staging_data, f, indent=4)
        print(f"Successfully staged {len(new_context_entries)} promos in The Cosmic Sieve!")

if __name__ == "__main__":
    sweep_inbox()
