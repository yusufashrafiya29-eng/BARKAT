const fs = require('fs');
const files = ['src/pages/WaiterDashboard.tsx', 'src/pages/CustomerMenu.tsx', 'src/pages/Login.tsx', 'src/pages/OwnerSignup.tsx', 'src/pages/StaffSignup.tsx', 'src/pages/VerifyOTP.tsx'];
for(const file of files) {
   if(!fs.existsSync(file)) continue;
   let code = fs.readFileSync(file, 'utf8');

   code = code.replace(/\bsurface\b/g, 'bg-white rounded-xl shadow-sm border border-slate-200');
   code = code.replace(/\bbg-main(\/[0-9]+)?\b/g, 'bg-slate-50');
   code = code.replace(/\bbg-subtle(\/[0-9]+)?\b/g, 'bg-slate-100');
   code = code.replace(/\bborder-subtle\b/g, 'border-slate-200');
   code = code.replace(/\bborder-active\b/g, 'border-indigo-500');
   code = code.replace(/\btext-muted\b/g, 'text-slate-500');
   code = code.replace(/\btext-main\b/g, 'text-slate-800');
   
   code = code.replace(/\bform-input\b/g, 'w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500');
   code = code.replace(/\bbtn-secondary\b/g, 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center');
   code = code.replace(/\bbtn\b(?!-)/g, 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center');
   
   fs.writeFileSync(file, code);
}
console.log('Update finished.');
