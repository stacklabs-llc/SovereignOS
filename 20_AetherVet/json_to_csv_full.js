import fs from 'fs';

const extractedStr = fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/temp_extracted.json', 'utf8');

let cleanStr = extractedStr;
cleanStr = cleanStr.replace(/\u00A0/g, ' '); // non-breaking spaces
cleanStr = cleanStr.replace(/\\\$/g, '$');   // markdown escaped $
cleanStr = cleanStr.replace(/\\_/g, '_');    // markdown escaped _
cleanStr = cleanStr.replace(/\\>/g, '>');    // markdown blockquotes inside strings
cleanStr = cleanStr.replace(/\\n\\>/g, '');  // markdown quotes at end of lines
cleanStr = cleanStr.replace(/\\'/g, "'");    // replace escaped single quotes which are invalid JSON
cleanStr = cleanStr.replace(/\\\\"/g, '\\"'); // fix escaped quotes that were double escaped

try {
    const jsonData = JSON.parse(cleanStr);
    
    const headers = Object.keys(jsonData[0]);

    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row

    for (const row of jsonData) {
        const values = headers.map(header => escapeCsvValue(row[header]));
        csvRows.push(values.join(','));
    }

    const outPath = '/home/james/.gemini/antigravity/brain/4e6401f7-612e-4f97-a806-348ac765f755/personas_spreadsheet_full.csv';
    fs.writeFileSync(outPath, csvRows.join('\n'));
    console.log(`Saved completely FULL CSV to ${outPath} with ${jsonData.length} personas`);
} catch(e) {
    console.error("JSON PARSE ERROR", e.message);
    
    // Fallback: try finding incomplete chunks or invalid formatting
    const errLocation = parseInt(e.message.match(/position (\d+)/)?.[1]);
    if (errLocation) {
        console.error("Context:");
        console.error(cleanStr.substring(errLocation - 60, errLocation + 60));
    }
}
