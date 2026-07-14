"""Shared helpers used across multiple routers."""
import os
import re
import json


def _et_game_date() -> str:
    """Return the active game-slate date in Eastern time.
    Before 10 AM ET we're still on the previous day's slate —
    MLB doesn't publish a new schedule until ~10 AM ET."""
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo
    from datetime import datetime, timedelta
    now_et = datetime.now(ZoneInfo('America/New_York'))
    if now_et.hour < 10:
        return (now_et - timedelta(days=1)).strftime('%Y-%m-%d')
    return now_et.strftime('%Y-%m-%d')



async def run_vertex_prompt(prompt: str, system_instruction: str = "") -> str:
    import os
    import asyncio
    import vertexai
    from vertexai.generative_models import GenerativeModel
    
    creds = None
    try:
        with open('/home/james/SovereignOS/.env') as f:
            for line in f:
                if line.startswith('GOOGLE_APPLICATION_CREDENTIALS='):
                    creds = line.strip().split('=', 1)[1].strip('"\'')
    except Exception:
        pass
    if not creds:
        creds = "/home/james/SovereignOS/config/vertex_sa.json"
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds
    
    try:
        vertexai.init(project="gen-lang-client-0840454416", location="us-central1")
    except Exception as e:
        print(f"[VERTEX INIT WARNING] {e}")
        
    def _call_gemini():
        sys_prompt = system_instruction or "You are a brand intelligence assistant for Sovereign OS."
        gemini_model = GenerativeModel("gemini-2.5-flash", system_instruction=[sys_prompt])
        res = gemini_model.generate_content(
            prompt,
            generation_config={"temperature": 0.7}
        )
        return res.text
        
    return await asyncio.to_thread(_call_gemini)

def parse_json_garbage(text: str) -> dict:
    import json
    import re
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    cleaned = text.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)
