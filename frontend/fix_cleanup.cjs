const fs = require('fs');
const files = ['src/pages/WaiterDashboard.tsx', 'src/pages/CustomerMenu.tsx', 'src/pages/Login.tsx', 'src/pages/OwnerSignup.tsx', 'src/pages/StaffSignup.tsx', 'src/pages/VerifyOTP.tsx'];
for(const file of files) {
   if(!fs.existsSync(file)) continue;
   let code = fs.readFileSync(file, 'utf8');

   code = code.replace(/bg-bg-white rounded-xl shadow-sm border border-slate-200/g, 'bg-slate-100');
   code = code.replace(/border border-transparent hover:border-slate-200 hover:bg-slate-100 rounded-md/g, 'hover:bg-slate-100 rounded-md transition-colors');
   
   fs.writeFileSync(file, code);
}
console.log('Cleanup finished.');
