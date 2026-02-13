import re
import sys

filepath = r"c:\Users\40768\.gemini\antigravity\scratch\ecalcOLD\app\calculator-salarii-pro\[year]\page.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
brace_stack = []
paren_stack = []
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            brace_stack.append(i + 1)
        elif char == '}':
            if brace_stack:
                brace_stack.pop()
            else:
                print(f"Extra closing brace at line {i + 1}")
        elif char == '(':
            paren_stack.append(i + 1)
        elif char == ')':
            if paren_stack:
                paren_stack.pop()
            else:
                print(f"Extra closing paren at line {i + 1}")

if brace_stack:
    print(f"Unclosed braces opened at lines: {brace_stack}")
else:
    print("All braces are balanced.")

if paren_stack:
    print(f"Unclosed parens opened at lines: {paren_stack}")
else:
    print("All parens are balanced.")
