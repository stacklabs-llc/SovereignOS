import fs from 'fs';
import path from 'path';

// Read the JSON file
const jsonPath = '/home/james/SovereignOS/dna/agents/SOVEREIGN_FANSTACK_ORACLE/payloads/updated_personas_apr9.json';
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.error("JSON is empty or not an array");
    process.exit(1);
}

// Extract headers
const headers = Object.keys(jsonData[0]);

// Function to escape CSV values
const escapeCsvValue = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

// Create CSV string
const csvRows = [];
csvRows.push(headers.join(',')); // Header row

for (const row of jsonData) {
    const values = headers.map(header => escapeCsvValue(row[header]));
    csvRows.push(values.join(','));
}

const outPath = '/home/james/.gemini/antigravity/brain/4e6401f7-612e-4f97-a806-348ac765f755/personas_spreadsheet.csv';
fs.writeFileSync(outPath, csvRows.join('\n'));
console.log(`Saved to ${outPath}`);
