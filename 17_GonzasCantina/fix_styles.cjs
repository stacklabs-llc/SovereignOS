import fs from 'fs';

let file = fs.readFileSync('/home/james/ai_projects/apiary/01_Sovereign_Portal/src/App.tsx', 'utf8');

// Pitch Radar container
file = file.replace(/border-\[#4C8A62\]\/30 bg-gradient-to-b from-\[#112417\] to-\[#0A1A10\]/g, 
                    'border-[#38bdf8]/30 bg-gradient-to-b from-[#111827] to-[#0B0E14]');

// Pitch Radar live dot
file = file.replace(/bg-\[#E0BC68\]/g, 'bg-[#38bdf8]');

// Broadcast box
file = file.replace(/bg-\[#08110B\]/g, 'bg-[#0B0E14]');
file = file.replace(/bg-\[#12301E\]\/90/g, 'bg-[#111827]/90');

// "Statcast Core" box / "SYNCED" text which is green
file = file.replace(/border-\[#4D8B62\]\/30 bg-\[#4D8B62\]\/10 p-2 text-center text-\[10px\] text-\[#6FAF5F\]/g, 
                    'border-[#38bdf8]/30 bg-[#38bdf8]/10 p-2 text-center text-[10px] text-[#38bdf8]');

fs.writeFileSync('/home/james/ai_projects/apiary/01_Sovereign_Portal/src/App.tsx', file);
console.log('Fixed styling');
