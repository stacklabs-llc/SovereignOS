import fs from 'fs';

const filePath = '/home/james/SovereignOS/dna/agents/SOVEREIGN_FANSTACK_ORACLE/payloads/Gemini-LLM Orchestration_ Gonzo Digest.md';
let content = fs.readFileSync(filePath, 'utf8');

// Find the first \[ or [ immediately followed by whitespace and {
const startIdx = content.indexOf('[\n'); 
let jsonStr = '';

if (startIdx !== -1) {
    const endIdx = content.indexOf(']\n', startIdx);
    if (endIdx !== -1) {
        jsonStr = content.substring(startIdx, endIdx + 1);
    }
}

if (!jsonStr) {
    // Try to find \[
    const startIdx2 = content.indexOf('\\[');
    if (startIdx2 !== -1) {
        const endIdx2 = content.indexOf('\\]', startIdx2);
        if (endIdx2 !== -1) {
            jsonStr = content.substring(startIdx2 + 2, endIdx2);
            jsonStr = '[' + jsonStr + ']';
        }
    }
}

console.log("Found JSON length:", jsonStr.length);

// Clean up markdown escapes
jsonStr = jsonStr.replace(/\\_/g, '_');
jsonStr = jsonStr.replace(/\\n/g, '\\n'); // this might need careful handling, let's just unescape it

// Let's write the raw extracted json to a scratch file so I can inspect or parse it
fs.writeFileSync('/home/james/SovereignOS/01_Sovereign_Portal/temp_extracted.json', jsonStr);
console.log("Saved extracted JSON to temp_extracted.json");
