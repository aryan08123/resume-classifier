import re
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

custom_stop = {
    "exprience", "experience", "company", "description", "detail", "detailsdescription",
    "month", "year", "less", "skill", "education", "responsibility", "work", "worked", "working",
    "maharashtra", "mumbai", "pune", "nagpur", "india",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "like", "using", "form",
}

def clean_resume(text):
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"\S+@\S+", " ", text)
    text = re.sub(r"\b\d{10,}\b", " ", text)
    text = re.sub(r"[^\x00-\x7f]", " ", text)
    text = re.sub(r"[^a-zA-Z0-9+#.\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()

def preprocess(text):
    tokens = re.findall(r"[a-z0-9+#.]+", text.lower())
    tokens = [t.strip(".") for t in tokens]
    tokens = [t for t in tokens if t and t not in stop_words and len(t) > 1]
    tokens = [lemmatizer.lemmatize(t) for t in tokens]
    tokens = [t for t in tokens
              if t not in custom_stop and not t.startswith(("month", "year"))]
    return " ".join(tokens)

def full_preprocess(raw_text):
    return preprocess(clean_resume(raw_text))