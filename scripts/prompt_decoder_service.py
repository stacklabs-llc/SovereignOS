import sys
import json
from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel

router = APIRouter()

class OptimizationPayload(BaseModel):
    raw_text: str
    macro_mode: str  # 'cinematic', 'raw_entropy', 'retro_16bit'

@router.post("/api/system/seeder/optimize")
def optimize_prompt(payload: OptimizationPayload):
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be blank.")
        
    base_text = payload.raw_text
    
    # Apply strict macro processing logic based on the user's selected toggle button
    if payload.macro_mode == "cinematic":
        enriched = f"{base_text}. Styled under the Brooks Exception: represented as a creative parody, utilizing a distinct parody identity and stylized artistic concept (flat 2D vector comic, retro 16-bit, or woodcut apothecary line art), completely avoiding photorealistic human likenesses or direct copies of real-world entities."
    elif payload.macro_mode == "raw_entropy":
        enriched = f"{base_text}. Infuse strict structural fatalism, caps-lock volatility spikes, and raw unhinged stadium heartbreak terminology."
    elif payload.macro_mode == "retro_16bit":
        enriched = f"{base_text}. Aligned with the metsy-prime 16-bit Cozy Kiosk framework, utilizing rigid coordinates and tactical grid parameters."
    else:
        enriched = base_text
        
    return {"status": "SUCCESS", "optimized_prompt": enriched}

# Expose as a standalone app if executed directly via Uvicorn on Port 5057
app = FastAPI(title="Sovereign Prompt Decoder Gate")
app.include_router(router)
