const fs = require('fs');

let file = fs.readFileSync('/home/james/ai_projects/apiary/01_Sovereign_Portal/src/App.tsx', 'utf8');

// Header buttons
file = file.replace(/bg-\[#C79B3A\]\/20 text-\[#E0BC68\] border border-\[#C79B3A\] shadow-\[0_0_15px_rgba\(199,155,58,0\.3\)\]/g, 
                    'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)]');

// Mobile button logic
file = file.replace(/'border-\[#C79B3A\]\/50 text-\[#C79B3A\] hover:bg-\[#C79B3A\]\/20'/g,
                    "'border-[#38bdf8]/50 text-[#38bdf8] hover:bg-[#38bdf8]/20'");

// Main Room Header Text
file = file.replace(/'font-serif text-\[#E0BC68\]'/g, "'font-serif text-[#38bdf8]'");

// Top Nav "Live" Dots for starter and general rooms
file = file.replace(/text-\[#E7C85C\]/g, 'text-[#38bdf8]'); 
// Wait, I might want to leave text-[#E7C85C] in the snackbar ternary, so let me do a more specific replace.

// Broadcast text
file = file.replace(/<span className="font-medium text-\[#C79B3A\]">On The Range \(CBS\)<\/span>/g, '<span className="font-medium text-[#38bdf8]">Mets Pregame (SNY)</span>');
file = file.replace(/<span className="font-medium">Inside Amen Corner<\/span>/g, '<span className="font-medium">Game Telecast (SNY)</span>');
file = file.replace(/<span className="font-medium">Featured Groups<\/span>/g, '<span className="font-medium">Postgame Wrap-up (SNY)</span>');

// Pitch Radar header
file = file.replace(/text-\[#E0BC68\]/g, 'text-[#38bdf8]');

// On Air Button (Command Center)
file = file.replace(/bg-\[#1A110B\] border border-\[#24150D\](.*?)text-\[#E7C85C\]/, 'bg-[#111827] border border-[#38bdf8]/30$1text-[#38bdf8]');
file = file.replace(/bg-\[#E7C85C\] group-hover:bg-red-500 shadow-\[0_0_5px_currentColor\]/g, 'bg-[#38bdf8] group-hover:bg-[#FF5910] shadow-[0_0_5px_currentColor]');

// TV Buttons Hover
file = file.replace(/hover:text-\[#4285F4\] hover:border-\[#4285F4\]\/50/g, 'hover:text-[#38bdf8] hover:border-[#38bdf8]/50');

// Footer text CBS to SNY
file = file.replace(/CBS Feed/g, 'SNY Feed');

fs.writeFileSync('/home/james/ai_projects/apiary/01_Sovereign_Portal/src/App.tsx', file);
console.log('Done');
