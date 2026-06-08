import sqlite3

html_file = "/home/james/SovereignOS/sovereign_employee_center.html"
with open(html_file, "r", encoding="utf-8") as f:
    html_content = f.read()

db_path = "/home/james/SovereignOS/scripts/sovereign_core.db"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT ticket_id, title, status, priority FROM sdlc_tickets LIMIT 20")
tickets = c.fetchall()
ticket_text = "\n".join([f"- [{t['ticket_id']}] {t['title']} | Status: {t['status']} | Priority: {t['priority']}" for t in tickets])

c.execute("SELECT node_id, hardware, agent_class, status FROM fleet_nodes")
nodes = c.fetchall()
node_text = "\n".join([f"- [{n['node_id']}] {n['hardware']} | Class: {n['agent_class']} | Status: {n['status']}" for n in nodes])

output_file = "/home/james/SovereignOS/NotebookLM_Payload/CLAUDE_PROMPT_EMPLOYEE_CENTER.md"
with open(output_file, "w", encoding="utf-8") as f:
    f.write("Here is the full context of the actual Sovereign Employee Center UI along with the live production data from the CMDB `sovereign_core.db` tables.\n\n")
    f.write("---\n\n### 1. LIVE DATA: sdlc_tickets\n")
    f.write(ticket_text + "\n\n")
    f.write("### 2. LIVE DATA: fleet_nodes\n")
    f.write(node_text + "\n\n")
    f.write("---\n\n### 3. SOURCE CODE: sovereign_employee_center.html\n\n```html\n")
    f.write(html_content + "\n```\n")

print("Generated prompt file successfully.")
