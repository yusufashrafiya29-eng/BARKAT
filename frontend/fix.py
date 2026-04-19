import re

with open('src/pages/OwnerDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Top level layout
code = code.replace('className="min-h-screen flex bg-main"', 'className="min-h-screen flex bg-slate-50 text-slate-800"')

# Sidebar
code = code.replace('<aside className="w-64 border-r border-subtle bg-main flex flex-col sticky top-0 h-screen z-50">', '<aside className="w-64 border-r border-slate-800 bg-[#0F172A] text-slate-300 flex flex-col sticky top-0 h-screen z-50">')
code = code.replace('<div className="h-[60px] pl-6 pr-4 border-b border-subtle flex items-center gap-3">', '<div className="h-[60px] pl-6 pr-4 border-b border-slate-800 flex items-center gap-3">')
code = code.replace('<div className="px-4 py-4 text-[11px] font-semibold text-muted uppercase tracking-wider">', '<div className="px-4 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">')
code = code.replace('<div className="w-6 h-6 rounded border border-subtle bg-surface flex items-center justify-center overflow-hidden shrink-0">', '<div className="w-6 h-6 rounded border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">')
code = code.replace('<div className="w-3 h-3 bg-main rounded-sm"></div>', '<div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>')
code = code.replace('activeTab === tab.id \n                  ? \'bg-subtle text-main font-medium\' \n                  : \'text-muted hover:text-main hover:bg-subtle/50 font-normal\'', 'activeTab === tab.id ? \'bg-indigo-600 text-white font-medium shadow-sm\' : \'text-slate-400 hover:text-white hover:bg-slate-800 font-normal\'')
code = code.replace('activeTab === tab.id ? \'text-main\' : \'text-muted\'', 'activeTab === tab.id ? \'text-white\' : \'text-slate-400\'')
code = code.replace('<div className="p-3 border-t border-subtle">', '<div className="p-3 border-t border-slate-800">')
code = code.replace('className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-muted hover:text-main hover:bg-subtle/50 transition-colors"', 'className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"')

# Header
code = code.replace('<main className="flex-1 flex flex-col min-w-0 bg-main">', '<main className="flex-1 flex flex-col min-w-0 bg-slate-50">')
code = code.replace('<header className="h-[60px] border-b border-subtle bg-main px-8 flex items-center justify-between sticky top-0 z-40">', '<header className="h-[60px] border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">')

# Main replacements using regex for exact word match
# Global structural terms
code = re.sub(r'\\bsurface\\b', 'bg-white rounded-xl shadow-sm border border-slate-200', code)
code = re.sub(r'\\bbg-main\\b', 'bg-slate-50', code)
code = re.sub(r'\\bbg-main/80\\b', 'bg-slate-900/50', code)
code = re.sub(r'\\bborder-subtle\\b', 'border-slate-200', code)
code = re.sub(r'\\bbg-subtle/50\\b', 'bg-slate-50', code)
code = re.sub(r'\\bbg-subtle/30\\b', 'bg-slate-50', code)
code = re.sub(r'\\bbg-subtle\\b', 'bg-slate-100', code)
code = re.sub(r'\\btext-muted\\b', 'text-slate-500', code)
code = re.sub(r'\\btext-main\\b', 'text-slate-800', code)

# Forms and buttons
code = re.sub(r'\\form-input\\b', 'w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500', code)
code = re.sub(r'\\bbtn-secondary\\b', 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center', code)
code = re.sub(r'\\bbtn\\b', 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center', code)

with open('src/pages/OwnerDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
