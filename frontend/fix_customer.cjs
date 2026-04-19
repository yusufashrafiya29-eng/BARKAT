const fs = require('fs');
let file = 'src/pages/CustomerMenu.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/bg-slate-50 border-b border-slate-200/g, 'bg-white shadow-sm border-b border-slate-200');
code = code.replace(/bg-slate-100/g, 'bg-slate-50');

fs.writeFileSync(file, code);
