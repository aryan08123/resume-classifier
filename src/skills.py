import re, json, os

_path = os.path.join(os.path.dirname(__file__), "..", "app", "skills.json")
ALL_SKILLS = json.load(open(_path))      # normalized, longest first

# a specific database implies the general skill
IMPLIES = {
    "mysql": "sql", "postgresql": "sql", "sql server": "sql",
    "sqlserver": "sql", "pl sql": "sql",
}

def norm(s):
    s = re.sub(r"[^a-z0-9+#.\s]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()

def extract_skills(text):
    text = norm(text)
    found = set()
    for skill in ALL_SKILLS:
        # optional trailing "s" so "REST APIs" matches "rest api"
        pattern = r"(?<![a-z0-9+#.])" + re.escape(skill) + r"s?(?![a-z0-9+#])"
        if re.search(pattern, text):
            found.add(skill)
    for skill, implied in IMPLIES.items():
        if skill in found:
            found.add(implied)
    return sorted(found)