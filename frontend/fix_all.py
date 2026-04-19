import os
import re

files_to_update = [
    'src/pages/CustomerMenu.tsx',
    'src/pages/WaiterDashboard.tsx',
    'src/pages/Login.tsx',
    'src/pages/OwnerSignup.tsx',
    'src/pages/StaffSignup.tsx',
    'src/pages/VerifyOTP.tsx'
]

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Special header fixes for CustomerMenu
    code = code.replace('<main className="min-h-screen bg-main font-sans pb-32">', '<main className="min-h-screen bg-slate-50 font-sans pb-32 text-slate-800">')

    # General replacements
    code = re.sub(r'\\bsurface\\b', 'bg-white rounded-xl shadow-sm border border-slate-200', code)
    code = re.sub(r'\\bbg-main\\b', 'bg-slate-50', code)
    code = re.sub(r'\\bbg-main/90\\b', 'bg-white/90', code)
    code = re.sub(r'\\bbg-main/80\\b', 'bg-white/80', code)
    code = re.sub(r'\\bborder-subtle\\b', 'border-slate-200', code)
    code = re.sub(r'\\bbg-subtle/50\\b', 'bg-slate-50', code)
    code = re.sub(r'\\bbg-subtle/30\\b', 'bg-slate-50', code)
    code = re.sub(r'\\bbg-subtle\\b', 'bg-slate-100', code)
    code = re.sub(r'\\btext-muted\\b', 'text-slate-500', code)
    code = re.sub(r'\\btext-main\\b', 'text-slate-800', code)

    # Forms and buttons
    code = re.sub(r'\\bform-input\\b', 'w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500', code)
    code = re.sub(r'\\bbtn-secondary\\b', 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center', code)
    code = re.sub(r'\\bbtn\\b', 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center', code)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Files updated")
