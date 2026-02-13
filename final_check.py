import re
import sys

filepath = r"c:\Users\40768\.gemini\antigravity\scratch\ecalcOLD\app\calculator-salarii-pro\[year]\page.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

def audit(chars_open, chars_close, label):
    stack = []
    for i, line in enumerate(content.split('\n')):
        for char in line:
            if char == chars_open:
                stack.append(i + 1)
            elif char == chars_close:
                if stack:
                    stack.pop()
                else:
                    return f"ERROR: Extra closing {label} at line {i + 1}"
    if stack:
        return f"ERROR: Unclosed {label} at lines: {stack}"
    return f"OK: All {label} balanced."

print(audit('{', '}', "braces"))
print(audit('(', ')', "parens"))

tags = re.findall(r'<(/?[\w\.]+)', content)
stack = []
for tag in tags:
    if tag == 'Fragment' or tag == '': continue
    if tag.startswith('/'):
        closing = tag[1:]
        if stack and stack[-1] == closing: stack.pop()
        else: print(f"ERROR: Tag mismatch for {tag}")
    elif tag.lower() not in {'input', 'img', 'br', 'hr', 'meta', 'link'}:
        stack.append(tag)

if stack: print(f"ERROR: Unclosed tags: {stack}")
else: print("OK: All tags balanced.")
