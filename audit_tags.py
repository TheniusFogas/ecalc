import re
import sys

filepath = r"c:\Users\40768\.gemini\antigravity\scratch\ecalcOLD\app\calculator-salarii-pro\[year]\page.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Very simple tag extractor
tags = re.findall(r'<(/?\w+)', content)
stack = []
for tag in tags:
    if tag.startswith('/'):
        closing = tag[1:]
        if stack and stack[-1] == closing:
            stack.pop()
        else:
            print(f"Mismatch: extra </{closing}> or missing <{closing}>")
    else:
        # Ignore self-closing (approximate)
        if not re.search(r'<' + tag + r'[^>]*/>', content):
             stack.append(tag)

if stack:
    # Filter out common components that might be false positives if used with self-closing or not
    print(f"Unclosed tags: {stack}")
else:
    print("All tags appear balanced.")
