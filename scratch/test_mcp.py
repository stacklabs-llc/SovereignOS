import asyncio
from scripts.fanstack_mcp_server import call_tool

async def test():
    res = await call_tool("get_persona", {"persona_id": "barf"})
    print("Length of returned text:", len(res[0].text))
    print(res[0].text[:100])

asyncio.run(test())
