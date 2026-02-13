import re
import sys

filepath = r"c:\Users\40768\.gemini\antigravity\scratch\ecalcOLD\app\calculator-salarii-pro\[year]\page.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Improved regex to find all opening and closing tags, but skip self-closing ones
# Matches <tag or </tag
tag_pattern = re.compile(r'<(/?[\w\.]+)')
# Matches <tag attributes />
self_closing_pattern = re.compile(r'<[\w\.]+(?:\s+[^>]*?)?/>')

void_elements = {'input', 'img', 'br', 'hr', 'meta', 'link'}

stack = []
pos = 0
while True:
    match = tag_pattern.search(content, pos)
    if not match:
        break
    
    start_pos = match.start()
    tag_name = match.group(1)
    
    # Check if this whole element is self-closing
    end_bracket = content.find('>', start_pos)
    is_self_closing = False
    if end_bracket != -1:
        if content[end_bracket-1] == '/':
            is_self_closing = True
    
    if not is_self_closing:
        if tag_name.startswith('/'):
            closing = tag_name[1:]
            if stack and stack[-1][0] == closing:
                stack.pop()
            else:
                line_count = content.count('\n', 0, start_pos) + 1
                print(f"Extra closing tag </{closing}> at line {line_count}")
        elif tag_name.lower() not in void_elements:
            line_count = content.count('\n', 0, start_pos) + 1
            stack.append((tag_name, line_count))
    
    pos = match.end()

if stack:
    print("Unclosed tags:")
    for tag, line in stack:
        print(f"<{tag}> opened at line {line}")
else:
    print("All tags appear balanced (ignoring void elements and self-closing).")
