import os
import json
import re

def analyze_codebase():
    results = {
        'backend': {'todos': [], 'large_files': [], 'bare_excepts': [], 'hardcoded_secrets': [], 'incomplete_code': []},
        'frontend': {'todos': [], 'large_files': [], 'any_types': [], 'hardcoded_secrets': [], 'incomplete_code': []},
        'mobile': {'todos': [], 'large_files': [], 'any_types': [], 'hardcoded_secrets': [], 'incomplete_code': []}
    }
    
    def scan_file(filepath, category):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if len(lines) > 500:
                results[category]['large_files'].append({'file': filepath, 'lines': len(lines)})
                
            for i, line in enumerate(lines):
                line_num = i + 1
                line_str = line.strip()
                
                # Check TODO/FIXME
                if re.search(r'(TODO|FIXME|XXX)', line_str):
                    results[category]['todos'].append({'file': filepath, 'line': line_num, 'text': line_str[:100]})
                
                # Check Hardcoded secrets (naive check for 'password', 'secret', 'key' assigned to string)
                if re.search(r'(password|secret|api_key|token)\s*=\s*[\'"][^\'"]+[\'"]', line_str, re.IGNORECASE):
                    if 'test' not in filepath.lower() and 'example' not in filepath.lower():
                        results[category]['hardcoded_secrets'].append({'file': filepath, 'line': line_num, 'text': line_str[:100]})
                
                # Check incomplete code
                if line_str == 'pass' or 'NotImplemented' in line_str or '// ...' in line_str:
                    results[category]['incomplete_code'].append({'file': filepath, 'line': line_num, 'text': line_str[:100]})
                
                if category == 'backend':
                    if re.search(r'except\s*:', line_str) or re.search(r'except\s+Exception\s*:', line_str):
                        results[category]['bare_excepts'].append({'file': filepath, 'line': line_num, 'text': line_str[:100]})
                else:
                    if re.search(r':\s*any\b', line_str):
                        results[category]['any_types'].append({'file': filepath, 'line': line_num, 'text': line_str[:100]})
        except Exception as e:
            pass

    for root, dirs, files in os.walk('.'):
        if any(ignore in root for ignore in ['node_modules', '.git', '.expo', 'venv', 'dist', 'build', '__pycache__', '.pytest_cache']):
            continue
            
        category = None
        if root.startswith('.\\backend') or root.startswith('./backend'):
            category = 'backend'
        elif root.startswith('.\\frontend') or root.startswith('./frontend'):
            category = 'frontend'
        elif root.startswith('.\\captain-app') or root.startswith('./captain-app'):
            category = 'mobile'
            
        if not category:
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in ['.py', '.ts', '.tsx', '.js', '.jsx']:
                scan_file(os.path.join(root, file), category)

    with open('audit_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
analyze_codebase()
