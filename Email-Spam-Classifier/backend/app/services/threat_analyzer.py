import re
import urllib.parse
from typing import Dict, Any, List, Tuple

# Suspicious TLDs often abused in phishing and spam
SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".buzz", ".icu", ".click", ".cam", ".tk", ".ml", ".ga", 
    ".cf", ".gq", ".work", ".loan", ".racing", ".country", ".stream", ".download",
    ".bid", ".accountant", ".science", ".cricket", ".party", ".faith"
}

# Known URL shorteners
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "cutt.ly",
    "shorturl.at", "rebrand.ly", "tiny.cc", "goo.gl", "qr.ae", "adf.ly", "bc.vc"
}

# Legitimate brands commonly spoofed in phishing
TARGETED_BRANDS = {
    "paypal": ["paypal.com"],
    "apple": ["apple.com", "icloud.com"],
    "google": ["google.com", "gmail.com"],
    "microsoft": ["microsoft.com", "outlook.com", "live.com"],
    "amazon": ["amazon.com", "amazon.in", "amazon.co.uk"],
    "netflix": ["netflix.com"],
    "meta": ["meta.com", "facebook.com", "instagram.com"],
    "facebook": ["facebook.com"],
    "instagram": ["instagram.com"],
    "chase": ["chase.com"],
    "wells fargo": ["wellsfargo.com"],
    "bank of america": ["bankofamerica.com"],
    "dhl": ["dhl.com"],
    "fedex": ["fedex.com"],
    "ups": ["ups.com"],
    "irs": ["irs.gov"],
    "dropbox": ["dropbox.com"]
}

# Free webmail providers
FREE_MAIL_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", 
    "mail.com", "protonmail.com", "zoho.com", "yandex.com", "icloud.com"
}

# Keywords / Patterns by threat vector
URGENCY_PATTERNS = [
    r"\b(account|access|service)\s+(has\s+been\s+)?(suspended|locked|terminated|blocked|frozen)\b",
    r"\bwithin\s+(24|48|12|6)\s+hours?\b",
    r"\b(urgent|immediately|act\s+now|immediate\s+action\s+required|final\s+notice|last\s+chance)\b",
    r"\bunauthorized\s+(login|access|transaction|activity)\b",
    r"\byour\s+account\s+will\s+be\s+(deleted|deactivated|closed)\b",
    r"\bsecurity\s+alert\b",
    r"\bfailure\s+to\s+(respond|verify|update)\b"
]

FINANCIAL_PATTERNS = [
    r"\b(won|winner|winning)\s+(\$|£|€|rs\.?|cash|lottery|prize|jackpot)\b",
    r"\b(\$|£|€)\s*\d+([,\.]\d+)*\s*(cash|reward|prize|grant|inheritance|donation)\b",
    r"\b(claim\s+your\s+(prize|reward|cash|funds|grant))\b",
    r"\b(wire\s+transfer|western\s+union|moneygram)\b",
    r"\b(bitcoin|crypto|wallet\s+address|usdt|ethereum)\b",
    r"\bunclaimed\s+(funds|assets|money|inheritance)\b",
    r"\bselected\s+as\s+(the\s+)?(winner|grand\s+prize)\b"
]

CREDENTIAL_HARVEST_PATTERNS = [
    r"\b(verify|confirm|update|validate)\s+(your\s+)?(identity|account|credentials|password|email|profile)\b",
    r"\b(enter|provide)\s+(your\s+)?(password|pin|ssn|social\s+security|credit\s+card|cvv)\b",
    r"\b(security\s+check|two-factor|otp|one-time\s+password)\b",
    r"\blogin\s+(here|to\s+verify|below|immediately)\b",
    r"\breset\s+your\s+password\b"
]

INVOICE_DELIVERY_PATTERNS = [
    r"\b(unpaid\s+invoice|invoice\s+attached|payment\s+overdue)\b",
    r"\b(delivery\s+failed|package\s+pending|customs\s+fee|shipping\s+fee)\b",
    r"\b(reschedule\s+delivery|confirm\s+shipping\s+address)\b",
    r"\b(receipt\s+for\s+your\s+order|order\s+confirmed\s+for\s+\$)\b"
]

MALWARE_ATTACHMENT_PATTERNS = [
    r"\b\w+\.(exe|scr|vbs|bat|iso|apk|jar|cmd|ps1|xlsm|docm)\b",
    r"\b(enable\s+macros|password\s+protected\s+zip|open\s+the\s+attached\s+archive)\b"
]

def extract_urls(text: str) -> List[str]:
    """Finds all URLs and IP addresses in the text."""
    url_pattern = r'(https?://[^\s<>"\']+|www\.[^\s<>"\']+)'
    return re.findall(url_pattern, text, re.IGNORECASE)

def analyze_sender(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Analyzes sender email address, domain, and potential brand spoofing.
    """
    sender = (sender or "").strip()
    if not sender:
        return {
            "has_sender": False,
            "email": "",
            "domain": "",
            "is_suspicious_tld": False,
            "is_free_provider": False,
            "spoofing_warning": None
        }

    # Extract email from format "Name <email@domain.com>" or "email@domain.com"
    email_match = re.search(r'[\w\.-]+@([\w\.-]+)', sender)
    if not email_match:
        return {
            "has_sender": True,
            "email": sender,
            "domain": "",
            "is_suspicious_tld": False,
            "is_free_provider": False,
            "spoofing_warning": "Invalid email address format"
        }

    full_email = email_match.group(0).lower()
    domain = email_match.group(1).lower()

    # Check suspicious TLD
    is_suspicious_tld = any(domain.endswith(tld) for tld in SUSPICIOUS_TLDS)

    # Check free provider
    is_free_provider = domain in FREE_MAIL_PROVIDERS

    # Check Brand Spoofing (e.g. claims to be PayPal in subject/sender name, but sender is @gmail or @paypal-xyz)
    spoofing_warning = None
    combined_context = f"{sender} {subject}".lower()
    
    for brand, legit_domains in TARGETED_BRANDS.items():
        if brand in combined_context:
            is_legit_domain = any(domain == d or domain.endswith("." + d) for d in legit_domains)
            if not is_legit_domain:
                spoofing_warning = f"Sender claims to represent {brand.title()}, but email domain is '{domain}' instead of official ({', '.join(legit_domains)})."
                break

    return {
        "has_sender": True,
        "email": full_email,
        "domain": domain,
        "is_suspicious_tld": is_suspicious_tld,
        "is_free_provider": is_free_provider,
        "spoofing_warning": spoofing_warning
    }

def analyze_links(text: str) -> List[Dict[str, Any]]:
    """
    Analyzes URLs found in email body for suspicious indicators.
    """
    raw_urls = extract_urls(text)
    link_results = []
    
    for url in raw_urls[:10]: # Analyze up to 10 URLs
        url_lower = url.lower()
        clean_url = url
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "http://" + clean_url

        try:
            parsed = urllib.parse.urlparse(clean_url)
            hostname = parsed.hostname or ""
        except Exception:
            hostname = ""

        is_shortener = hostname in SHORTENER_DOMAINS
        is_ip_address = bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', hostname))
        is_suspicious_tld = any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS)
        has_login_path = any(term in url_lower for term in ["login", "signin", "verify", "update", "secure", "banking", "confirm", "claim"])

        risk = "Safe"
        reasons = []
        if is_ip_address:
            risk = "Critical"
            reasons.append("Raw numeric IP address destination")
        elif is_shortener:
            risk = "High"
            reasons.append("URL Shortener masks true destination")
        elif is_suspicious_tld:
            risk = "High"
            reasons.append("Suspicious / High-Abuse Top Level Domain")
        elif has_login_path:
            risk = "Medium"
            reasons.append("Link targets authentication or credential prompt")

        link_results.append({
            "url": url,
            "domain": hostname,
            "is_shortener": is_shortener,
            "is_ip": is_ip_address,
            "risk": risk,
            "reasons": reasons
        })

    return link_results

def run_deep_threat_analysis(
    subject: str,
    body: str,
    sender: str,
    ml_prediction: str,
    ml_spam_prob: float
) -> Dict[str, Any]:
    """
    Performs full multi-layer cybersecurity threat evaluation.
    Combines ML inference with heuristic security checks.
    """
    full_text = f"{sender} {subject}\n\n{body}"
    lower_text = full_text.lower()

    # 1. Sender Analysis
    sender_info = analyze_sender(sender, subject, body)

    # 2. Link Analysis
    links_info = analyze_links(body)

    # 3. Pattern Matching
    urgency_flags = [p for p in URGENCY_PATTERNS if re.search(p, lower_text)]
    financial_flags = [p for p in FINANCIAL_PATTERNS if re.search(p, lower_text)]
    credential_flags = [p for p in CREDENTIAL_HARVEST_PATTERNS if re.search(p, lower_text)]
    invoice_flags = [p for p in INVOICE_DELIVERY_PATTERNS if re.search(p, lower_text)]
    malware_flags = [p for p in MALWARE_ATTACHMENT_PATTERNS if re.search(p, lower_text)]

    # Urgency Level
    if len(urgency_flags) >= 2 or re.search(r"\b(24|12)\s+hours?\b", lower_text):
        urgency_level = "Critical"
    elif len(urgency_flags) == 1:
        urgency_level = "High"
    elif re.search(r"\burgent|asap|soon\b", lower_text):
        urgency_level = "Medium"
    else:
        urgency_level = "None"

    # Threat Classification
    threat_category = "Legitimate Email"
    if sender_info.get("spoofing_warning") or (credential_flags and (links_info or urgency_flags)):
        threat_category = "Phishing / Credential Theft"
    elif financial_flags:
        threat_category = "Financial / Lottery Scam"
    elif malware_flags:
        threat_category = "Malware / Malicious Attachment"
    elif invoice_flags and (urgency_flags or links_info):
        threat_category = "Fake Invoice / Delivery Scam"
    elif ml_prediction == "spam":
        threat_category = "Promotional Spam / Bulk Mail"

    # Compute Heuristic Risk Adjustment
    heuristic_score = 0
    if sender_info.get("spoofing_warning"):
        heuristic_score += 45
    if sender_info.get("is_suspicious_tld"):
        heuristic_score += 25
    if any(l["risk"] in ["High", "Critical"] for l in links_info):
        heuristic_score += 30
    if credential_flags:
        heuristic_score += 30
    if financial_flags:
        heuristic_score += 35
    if urgency_flags:
        heuristic_score += 20
    if malware_flags:
        heuristic_score += 40

    # Composite Risk Score (0 - 100)
    # Blend ML model probability with heuristic evidence
    raw_ml_score = int(round(ml_spam_prob * 100))
    if heuristic_score > 0:
        composite_score = min(100, max(raw_ml_score, int(0.55 * raw_ml_score + 0.45 * heuristic_score)))
    else:
        composite_score = raw_ml_score

    # Override for safe legitimate emails
    if not sender_info.get("spoofing_warning") and not links_info and not credential_flags and not financial_flags and ml_prediction == "ham":
        composite_score = min(composite_score, 15)

    # Determine Threat Level
    if composite_score >= 85:
        threat_level = "Critical Threat"
    elif composite_score >= 65:
        threat_level = "High Risk"
    elif composite_score >= 40:
        threat_level = "Suspicious"
    elif composite_score >= 20:
        threat_level = "Low Risk"
    else:
        threat_level = "Clean / Safe"

    # Security Checks Checklist (Interactive Audit Cards)
    security_checks = [
        {
            "name": "Machine Learning NLP Model",
            "status": "passed" if ml_prediction == "ham" else "failed",
            "details": f"Model probability: {(ml_spam_prob * 100):.1f}% spam likelihood based on TF-IDF feature analysis."
        },
        {
            "name": "Sender Domain & Brand Authenticity",
            "status": "failed" if sender_info.get("spoofing_warning") else ("warning" if sender_info.get("is_suspicious_tld") else "passed"),
            "details": sender_info.get("spoofing_warning") or (
                f"Sender domain '@{sender_info.get('domain', 'verified')}' verified." if sender_info.get("domain") else "No sender address specified."
            )
        },
        {
            "name": "Urgency & Psychological Coercion",
            "status": "failed" if urgency_level == "Critical" else ("warning" if urgency_level in ["High", "Medium"] else "passed"),
            "details": f"Urgency index: {urgency_level}. " + (
                "Contains artificial panic triggers or immediate deadlines." if urgency_level != "None" else "No pressure tactics detected."
            )
        },
        {
            "name": "Embedded Links & URL Inspection",
            "status": "failed" if any(l["risk"] in ["High", "Critical"] for l in links_info) else ("warning" if links_info else "passed"),
            "details": (
                f"Found {len(links_info)} link(s). " + (
                    "Warning: Shorteners or high-risk destinations detected." if any(l["risk"] in ["High", "Critical"] for l in links_info) else "Standard links inspected."
                )
            ) if links_info else "No external links detected in message body."
        },
        {
            "name": "Sensitive Credential Requests",
            "status": "failed" if credential_flags else "passed",
            "details": "Alert: Requests passwords, OTPs, or financial information." if credential_flags else "No sensitive credential solicitations found."
        },
        {
            "name": "Financial Incentive / Prize Bait",
            "status": "failed" if financial_flags else "passed",
            "details": "Alert: References prize money, unearned rewards, or wire transfers." if financial_flags else "No fraudulent financial bait detected."
        }
    ]

    # Concrete Recommendations
    recommendations = []
    if threat_level in ["Critical Threat", "High Risk"]:
        recommendations.append("🚨 DO NOT click any links, open attachments, or reply to this message.")
        if sender_info.get("spoofing_warning"):
            recommendations.append(f"⚠️ Brand Spoof Alert: Contact the organization via their official website, not through details in this email.")
        if any(l["is_shortener"] for l in links_info):
            recommendations.append("🔗 URL Shortener Warning: The destination link is obscured. Do not visit it.")
        if credential_flags:
            recommendations.append("🔑 Never disclose passwords, OTPs, or bank account credentials over email.")
        recommendations.append("🛡️ Mark this email as Spam / Phishing in your email provider and delete it.")
    elif threat_level == "Suspicious":
        recommendations.append("⚠️ Verify the sender's identity through a separate, trusted channel before responding.")
        recommendations.append("🔍 Hover over any links without clicking to verify destination addresses.")
    else:
        recommendations.append("✅ This email appears standard and legitimate. Normal email hygiene applies.")

    # Tamil Summary (தமிழ் விளக்கம்)
    if threat_level in ["Critical Threat", "High Risk"]:
        if threat_category == "Phishing / Credential Theft":
            tamil_summary = "எச்சரிக்கை! இந்த மின்னஞ்சல் உங்கள் கடவுச்சொல் அல்லது தனிப்பட்ட தகவல்களை திருட முயற்சிக்கும் ஆபத்தான Phishing மோசடி. எந்த இணைப்பையும் கிளிக் செய்யாதீர்கள்."
        elif threat_category == "Financial / Lottery Scam":
            tamil_summary = "எச்சரிக்கை! இது ஒரு போலி பண/பரிசு மோசடி (Financial Scam). வங்கி விவரங்களை பகிர வேண்டாம், பணம் செலுத்த வேண்டாம்."
        else:
            tamil_summary = "எச்சரிக்கை! இந்த மின்னஞ்சலில் ஆபத்தான/சந்தேகத்திற்கிடமான அச்சுறுத்தல்கள் கண்டறியப்பட்டுள்ளன. இணைப்புகளை திறக்காதீர்கள்."
    elif threat_level == "Suspicious":
        tamil_summary = "கவனம்! இந்த மின்னஞ்சல் சில சந்தேகத்திற்கிடமான அம்சங்களை கொண்டுள்ளது. அனுப்புநரை சரிபார்த்து எச்சரிக்கையுடன் செயல்படவும்."
    else:
        tamil_summary = "இந்த மின்னஞ்சல் பாதுகாப்பானது. இதில் எந்தவித அச்சுறுத்தல்களோ அல்லது ஏமாற்று வேலைகளோ கண்டறியப்படவில்லை."

    return {
        "threat_level": threat_level,
        "threat_category": threat_category,
        "risk_score": composite_score,
        "urgency_level": urgency_level,
        "security_checks": security_checks,
        "urls_detected": links_info,
        "sender_analysis": sender_info,
        "recommendations": recommendations,
        "tamil_summary": tamil_summary
    }

