import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))

import joblib, numpy as np
import nltk
from flask import Flask, render_template, request
from pypdf import PdfReader
from sklearn.metrics.pairwise import cosine_similarity

for pkg in ["stopwords", "wordnet"]:
    nltk.download(pkg, quiet=True)

from preprocess import full_preprocess
from skills import extract_skills

BASE = os.path.dirname(__file__)
model = joblib.load(os.path.join(BASE, "model.joblib"))
tfidf = model.named_steps["tfidf"]          # reuse the fitted vectorizer for similarity

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024    # 2 MB upload limit


def read_resume(file, text):
    if file and file.filename:
        name = file.filename.lower()
        if name.endswith(".pdf"):
            reader = PdfReader(file)
            return " ".join((p.extract_text() or "") for p in reader.pages)
        if name.endswith(".txt"):
            return file.read().decode("utf-8", errors="ignore")
    return text or ""


def classify(processed, top_n=3):
    scores = model.decision_function([processed])[0]
    order = np.argsort(scores)[::-1][:top_n]
    return [model.classes_[i] for i in order]


def match_report(resume_raw, jd_raw):
    r_skills, j_skills = set(extract_skills(resume_raw)), set(extract_skills(jd_raw))
    overlap = r_skills & j_skills
    skill_score = len(overlap) / len(j_skills) if j_skills else 0
    vecs = tfidf.transform([full_preprocess(resume_raw), full_preprocess(jd_raw)])
    text_score = float(cosine_similarity(vecs[0], vecs[1])[0][0])
    return {
        "overall": round(100 * (0.4 * text_score + 0.6 * skill_score), 1),
        "text_similarity": round(100 * text_score, 1),
        "skill_match": round(100 * skill_score, 1),
        "matched_skills": sorted(overlap),
        "missing_skills": sorted(j_skills - r_skills),
    }


@app.route("/", methods=["GET", "POST"])
def index():
    result, error = None, None
    if request.method == "POST":
        resume = read_resume(request.files.get("resume_file"), request.form.get("resume_text"))
        jd = request.form.get("job_description", "").strip()
        if len(resume.split()) < 20:
            error = "Please upload or paste a resume (at least 20 words)."
        else:
            result = {
                "roles": classify(full_preprocess(resume)),
                "skills": extract_skills(resume),
            }
            if jd:
                result["match"] = match_report(resume, jd)
    return render_template("index.html", result=result, error=error)


if __name__ == "__main__":
    app.run(debug=True)