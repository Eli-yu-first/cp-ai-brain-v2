const fs = require('fs');
const content = fs.readFileSync('client/src/pages/Pork.tsx', 'utf8');

const aiStart = content.indexOf('{/* ═══ AI RECOMMENDATION ═══ */}');
const riskStart = content.indexOf('{/* ═══ RISK + MODULE ENTRY ═══ */}');
const endDiv = content.indexOf('</div>', content.indexOf('</div>', riskStart+100) + 10);
// Wait, we can find the exact lines
const lines = content.split('\n');
let aiStartIdx = -1, aiEndIdx = -1;
let riskStartIdx = -1, riskEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('═══ AI RECOMMENDATION ═══')) aiStartIdx = i;
  if (lines[i].includes('═══ RISK + MODULE ENTRY ═══')) riskStartIdx = i;
}

// AI is an TechPanel, let's find the closing </TechPanel>
for (let i = aiStartIdx; i < lines.length; i++) {
  if (lines[i].includes('</TechPanel>') && i > aiStartIdx + 30) {
     aiEndIdx = i;
     break;
  }
}

// Risk is in <div className="grid gap-5 xl:grid-cols-2">
for (let i = riskStartIdx; i < lines.length; i++) {
   if (lines[i] === '        </div>' && i > riskStartIdx + 30) {
      riskEndIdx = i;
      break;
   }
}

console.log({aiStartIdx, aiEndIdx, riskStartIdx, riskEndIdx});

if (aiStartIdx > -1 && aiEndIdx > -1 && riskStartIdx > -1 && riskEndIdx > -1) {
  const aiBlock = lines.slice(aiStartIdx - 1, aiEndIdx + 1); 
  const riskBlock = lines.slice(riskStartIdx - 1, riskEndIdx + 1);

  // Since Risk is after AI, we reconstruct:
  const newLines = [
    ...lines.slice(0, aiStartIdx - 1),
    ...riskBlock,
    ...aiBlock,
    ...lines.slice(riskEndIdx + 1)
  ];
  fs.writeFileSync('client/src/pages/Pork.tsx', newLines.join('\n'));
  console.log("Swapped!");
}

