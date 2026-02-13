import re
import sys

filepath = r"c:\Users\40768\.gemini\antigravity\scratch\ecalcOLD\app\calculator-salarii-pro\[year]\page.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
paren_stack = []
for i, line in enumerate(lines):
    for char in line:
        if char == '(':
            paren_stack.append(i + 1)
        elif char == ')':
            if paren_stack:
                paren_stack.pop()
            else:
                print(f"Extra closing paren at line {i + 1}")

if paren_stack:
    print(f"Unclosed parens opened at lines: {paren_stack}")
else:
    print("All parens are balanced.")
