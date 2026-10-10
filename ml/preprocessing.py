import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Ensure NLTK resources are available
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

stemmer = PorterStemmer()

# Custom stopword list: keep words like 'not', 'no', 'free', 'win', 'claim', 'cash', etc.
try:
    NLTK_STOPWORDS = set(stopwords.words('english'))
    # Keep negation and urgent spam indicator words out of stopword removal
    PRESERVED_WORDS = {'no', 'not', 'nor', 'free', 'win', 'winner', 'cash', 'prize', 'claim', 'urgent'}
    STOPWORDS = NLTK_STOPWORDS - PRESERVED_WORDS
except Exception:
    STOPWORDS = set([
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
        "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
        "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
        "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
        "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
        "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
        "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
        "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
        "in", "out", "on", "off", "over", "under", "again", "further", "then", "once"
    ])

def preprocess_text(text: str) -> str:
    """
    Cleans and normalizes email subject + body text for spam classification.
    Preserves spam-indicative signals such as URLs, email addresses, currency symbols, and exclamation marks.
    """
    if not text or not isinstance(text, str):
        return ""
    
    # 1. Lowercase
    text = text.lower()
    
    # 2. Normalize URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' httpurl ', text)
    
    # 3. Normalize Email Addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', ' emailaddr ', text)
    
    # 4. Normalize Currency Symbols ($ £ € ₹)
    text = re.sub(r'[\$\£\€\₹]', ' currencysym ', text)
    
    # 5. Normalize Phone Numbers / Digits
    text = re.sub(r'\b\d{7,11}\b', ' phonenum ', text)
    text = re.sub(r'\b\d+\b', ' num ', text)
    
    # 6. Preserve key punctuation patterns (! and ?) by converting to token or word
    text = re.sub(r'\!+', ' exclam ', text)
    text = re.sub(r'\?+', ' questionm ', text)
    
    # 7. Remove remaining non-alphanumeric punctuation except space
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # 8. Tokenize and filter stopwords + apply stemming
    tokens = text.split()
    cleaned_tokens = []
    for token in tokens:
        if token not in STOPWORDS and len(token) > 1:
            stemmed = stemmer.stem(token)
            cleaned_tokens.append(stemmed)
            
    return " ".join(cleaned_tokens)

if __name__ == "__main__":
    sample = "WINNER! You have won $1000 cash. Claim at http://example.com or call 9876543210 NOW!"
    print("Original:", sample)
    print("Preprocessed:", preprocess_text(sample))
