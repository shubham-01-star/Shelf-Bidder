const fs = require('fs');
const path = require('path');
const d = './src/app';

const w = (dir) => {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if(fs.statSync(p).isDirectory()) {
      w(p);
    } else if(p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let o = c;
      c = c.replace(/bg-\[#f6f8f6\]/g, 'bg-background-light dark:bg-background-dark')
           .replace(/bg-\[#0a0510\]/g, 'bg-background-light dark:bg-background-dark')
           .replace(/bg-\[#f8faf9\]/g, 'bg-background-light dark:bg-background-dark')
           .replace(/bg-\[#160d21\]/g, 'bg-surface-light dark:bg-surface-dark')
           .replace(/bg-\[#1a1c1e\]/g, 'bg-text-main dark:bg-[#1a1c1e]'); // for dark buttons
      
      // Also ensuring any background colors applied directly are changed if requested.
      if(c !== o) {
        fs.writeFileSync(p, c);
        console.log('Updated ' + p);
      }
    }
  });
};

w(d);
console.log('Done');
