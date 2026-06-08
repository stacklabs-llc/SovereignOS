# ANTIGRAVITY WORK ORDER
## Mission: FanStack Mailbag — One-Click UI Trigger
**Date:** May 26, 2026
**Issued By:** James (Sovereign OS Principal Architect)
**Ticket:** Create STRY in sovereign_tickets before starting (KI-023)
**Target:** FanStack UI (Port 3010) + FanStack Admin API (Port 8001)

---

## THE VISION

Barf should be able to fetch his own mail. The Pilot should never have to
paste a terminal command or spin up a work order just to run the gmail
promo sweeper mid-session. One button in the FanStack UI triggers the full
mailbag sweep and reports back inline.

---

## STEP 1 — Backend: Add Mailbag API Endpoint

Add a new route to the FanStack Admin API (`scripts/fanstack_admin_api.py`
or wherever `/api/` routes live on port 8001):

```python
@app.post("/api/mailbag/sweep")
async def run_mailbag():
    """
    Triggers the gmail_promo_sweeper.py script and returns results.
    """
    import subprocess
    result = subprocess.run(
        ["/home/james/SovereignOS/.venv/bin/python3",
         "/home/james/SovereignOS/scripts/gmail_promo_sweeper.py"],
        capture_output=True, text=True, timeout=60
    )
    
    # Read staging results
    try:
        with open("/home/james/SovereignOS/scripts/promo_staging.json") as f:
            staging = json.load(f)
        recent = staging[-10:] if len(staging) >= 10 else staging
    except:
        recent = []
    
    return {
        "status": "complete",
        "stdout": result.stdout,
        "stderr": result.stderr,
        "items_staged": len(staging) if staging else 0,
        "recent": recent
    }
```

---

## STEP 2 — Frontend: Add Mailbag Button to FanStack UI

Find the appropriate location in the FanStack Sports UI — either the main
toolbar, the TMI NewsDesk panel, or the daily prep controls section.

Add a **"📬 Fetch Mailbag"** button:

```tsx
const [mailbagStatus, setMailbagStatus] = useState<'idle'|'running'|'done'>('idle');
const [mailbagResults, setMailbagResults] = useState<any>(null);

const fetchMailbag = async () => {
  setMailbagStatus('running');
  const res = await fetch('/api/mailbag/sweep', { method: 'POST' });
  const data = await res.json();
  setMailbagResults(data);
  setMailbagStatus('done');
};
```

Button UI:
```tsx
<button
  onClick={fetchMailbag}
  disabled={mailbagStatus === 'running'}
  className="mailbag-btn"
>
  {mailbagStatus === 'running' ? '📬 Fetching...' : '📬 Fetch Mailbag'}
</button>

{mailbagStatus === 'done' && mailbagResults && (
  <div className="mailbag-results">
    <p>{mailbagResults.items_staged} items staged</p>
    {mailbagResults.recent.map((item: any) => (
      <div key={item.id} className="mailbag-item">
        <span className="headline">{item.headline}</span>
        <span className="source">{item.source}</span>
      </div>
    ))}
  </div>
)}
```

---

## STEP 3 — Verify

1. Click "📬 Fetch Mailbag" in the FanStack UI
2. Button shows "Fetching..." while running
3. Results display inline — count of items staged + top headlines
4. Confirm `promo_staging.json` updated with new entries
5. Confirm `fanstack_live_context.txt` updated
6. Zero console errors

---

## PASS CRITERIA

- [ ] `/api/mailbag/sweep` endpoint exists and runs the sweeper
- [ ] Button visible in FanStack UI
- [ ] Results render inline after sweep completes
- [ ] Works mid-session without touching the terminal
- [ ] Ticket closed per KI-039

---

*Stack Labs LLC / Sovereign OS — Campsite Protocol*
