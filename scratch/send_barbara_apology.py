import os
import sys
sys.path.append("/home/james/SovereignOS/scripts")
from send_dispatch_report import send_dispatch

body = """Dear Barbara,

Please accept my sincere apologies for the earlier email. A technical database mapping issue temporarily crossed our setup files, sending you the incorrect brand documentation for "Smyrna Paws & Provisions." I want to assure you that your actual brand—Wild Paws & Rusty Canvas Art Rescue—is the sole focus of this workspace and has now been fully, custom-built from the ground up.

Your true, dedicated brand advocates are fully operational in the database:
- Barb the Founder (Badass Sanctuary Director & Lead Artist, companion Rusty)
- Jack the Carpenter (Lead Builder & Canvas Framer, companion Barnaby)
- Doc Wheeler (Sanctuary Triage Vet, companion Patch)
- Jukebox Jesse (Jukebox Custodian, companion Chopper)
- Sweet Moscato Sally (Art Gallery Curator, companion Bella)
- Buster the Brawler (Rescue Enforcer & Security, companion Max)

Your high-fidelity, private dashboard is live on your secure Tailscale network on Port 3020.

Attached to this email is your completed, high-fidelity, print-ready "Wild Paws & Rusty Canvas Art Rescue Genesis Lookbook and Production Bible." It compiles your custom oil-painting style artist biographies, shelter triage logs, and Smyrna wood-grain canvas assets.

Thank you for your patience, your dedication to animal rescue in Smyrna, and for holding us to the highest standard.

Warm regards,

James Carroll  
Principal Architect, Sovereign OS"""

success = send_dispatch(
    subject="Corrected: Wild Paws & Rusty Canvas Art Rescue Stack Activation Update",
    body=body,
    attachment_path="/home/james/sovereign_inbox/reports/Wild_Paws_&_Rusty_Canvas_Art_Rescue_Genesis_Lookbook_and_Production_Bible.pdf",
    recipient="bakerninja2@gmail.com"
)
print("SUCCESS:", success)
sys.exit(0 if success else 1)
