import json

path = r"C:\Users\maxgiwer\.gemini\antigravity\brain\2143cad7-490a-4dba-9528-42c0505774b7\.system_generated\steps\470\content.md"
with open(path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

prefix = 'goog.script.init("'
idx = text.find(prefix)
if idx != -1:
    start = idx + len(prefix)
    end = text.find('", ""', start)
    raw_str = text[start:end]
    
    # decode JSON string
    # Replace \x escapes with \u00 escapes so json.loads decodes utf-8 properly
    import re
    def hex_to_unicode(match):
        return chr(int(match.group(1), 16))
    
    # raw_str has \x22, \x5b etc.
    # Convert \xHH to the actual character
    converted = re.sub(r'\\x([0-9a-fA-F]{2})', hex_to_unicode, raw_str)
    # Also handle escaped quotes or newlines if needed
    config = json.loads(converted)
    user_html = config["userHtml"]
    with open("d:/ev/extracted_dashboard.html", "w", encoding="utf-8") as out:
        out.write(user_html)
    print("Successfully decoded Thai characters!")
    print("Sample:", user_html[1500:1800])
