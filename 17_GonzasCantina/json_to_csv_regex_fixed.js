import fs from 'fs';

const filePath = '/home/james/SovereignOS/dna/agents/SOVEREIGN_FANSTACK_ORACLE/payloads/Gemini-LLM Orchestration_ Gonzo Digest.md';
let content = fs.readFileSync(filePath, 'utf8');

// Strip out weird markdown formatting before we search for objects
content = content.replace(/\u00A0/g, ' '); 
content = content.replace(/\\\$/g, '$');   
content = content.replace(/\\_/g, '_');    
content = content.replace(/\\>/g, '>');    
content = content.replace(/\\n\\>/g, '');  
content = content.replace(/\\'/g, "'");    
content = content.replace(/\\\\"/g, '\\"'); 

const matches = content.match(/\{\s*"name"\s*:\s*"[^"]+",\s*"u_system_prompt"[\s\S]*?"u_cadence"\s*:\s*"[^"]+"\s*\}/g);

if (!matches) {
    console.error("No matches found!");
    process.exit(1);
}

const parsedPersonas = [];
let fails = 0;
for (const match of matches) {
    try {
        let cleanMatch = match.replace(/,\s*}/, '}');
        // Clean any invalid backslashes (keep valid ones like \n, \", \\)
        cleanMatch = cleanMatch.replace(/\\(?!n|r|t|"|\\)/g, '');
        
        const obj = JSON.parse(cleanMatch);
        parsedPersonas.push(obj);
    } catch (e) {
        fails++;
    }
}

console.log(`Successfully parsed ${parsedPersonas.length} personas. Failed: ${fails}`);

if (parsedPersonas.length > 0) {
    const headers = Object.keys(parsedPersonas[0]);

    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of parsedPersonas) {
        const values = headers.map(header => escapeCsvValue(row[header]));
        csvRows.push(values.join(','));
    }

    const outPath = '/home/james/.gemini/antigravity/brain/4e6401f7-612e-4f97-a806-348ac765f755/personas_spreadsheet_full.csv';
    fs.writeFileSync(outPath, csvRows.join('\n'));
}
