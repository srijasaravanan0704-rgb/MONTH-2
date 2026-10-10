import numpy as np
from typing import List, Dict, Any, Tuple

def extract_suspicious_keywords(
    raw_text: str,
    processed_text: str,
    vectorizer,
    model,
    top_n: int = 6
) -> Tuple[List[str], List[Dict[str, Any]], str]:
    """
    Analyzes the input text against the trained model feature weights (or log odds)
    to extract tokens that contributed most to the prediction.
    Returns: (list of top keyword strings, detailed feature breakdown, human explanation).
    """
    feature_names = vectorizer.get_feature_names_out()
    feature_to_idx = {name: i for i, name in enumerate(feature_names)}
    
    tokens = processed_text.split()
    if not tokens:
        return [], [], "No meaningful words found after preprocessing."
    
    # Calculate feature scores based on algorithm type
    raw_words = raw_text.split()
    word_map = {}
    for w in raw_words:
        cleaned_w = w.lower().strip()
        word_map[cleaned_w] = w
        
    keyword_scores = []
    
    # Determine model log probabilities or coefficients
    has_feature_log_prob = hasattr(model, 'feature_log_prob_')
    has_coef = hasattr(model, 'coef_')
    
    for token in set(tokens):
        if token in feature_to_idx:
            idx = feature_to_idx[token]
            score = 0.0
            is_spam = False
            
            if has_feature_log_prob:
                # MultinomialNB: log_prob[1] - log_prob[0] gives relative spam weight
                log_prob_spam = model.feature_log_prob_[1][idx]
                log_prob_ham = model.feature_log_prob_[0][idx]
                log_odds = log_prob_spam - log_prob_ham
                score = float(log_odds)
                is_spam = score > 0
            elif has_coef:
                coef = model.coef_[0][idx]
                score = float(coef)
                is_spam = score > 0
            else:
                score = 1.0
                is_spam = True
                
            raw_match = token
            # Map tokens like 'exclam', 'currencysym', 'httpurl' to user readable terms
            readable_display = {
                'exclam': '! (exclamation mark)',
                'currencysym': '$ / € (currency symbol)',
                'httpurl': 'URL / Web link',
                'emailaddr': 'Email address',
                'phonenum': 'Phone number',
                'num': 'Numbers / Digits'
            }.get(token, token)

            keyword_scores.append({
                "word": readable_display,
                "raw_word": token,
                "score": round(abs(score), 3),
                "log_odds": round(score, 3),
                "is_spam_indicator": is_spam
            })
            
    # Sort by absolute score descending
    keyword_scores.sort(key=lambda x: x["score"], reverse=True)
    
    # Filter spam indicators if predicted spam, or ham indicators if predicted ham
    spam_indicators = [k for k in keyword_scores if k["is_spam_indicator"]]
    ham_indicators = [k for k in keyword_scores if not k["is_spam_indicator"]]
    
    top_keywords = [k["word"] for k in keyword_scores[:top_n]]
    
    # Build dynamic natural language explanation
    if spam_indicators:
        top_spam_words = [k["word"] for k in spam_indicators[:4]]
        explanation = (
            f"This email contains suspicious patterns and high-risk terms commonly associated with spam, "
            f"such as: {', '.join(top_spam_words)}. These features yielded strong TF-IDF log-odds weights."
        )
    elif ham_indicators:
        top_ham_words = [k["word"] for k in ham_indicators[:4]]
        explanation = (
            f"This email uses standard conversational phrasing and terms typically found in legitimate communications, "
            f"such as: {', '.join(top_ham_words)}."
        )
    else:
        explanation = "The email text evaluated within normal baseline limits."
        
    return top_keywords, keyword_scores[:10], explanation
