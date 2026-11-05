# PhishShift: Intelligent Message Risk Scanner (ML-07)
## Architectural Design & Pipeline Specification

---

### 1. Executive Architecture Overview

**PhishShift** is an intermediate-to-advanced cybersecurity and NLP web platform designed for educational message risk triage, explainable threat identification, and robustness stress testing. The platform operates on a clean separation of concerns:

- **Frontend Tier**: Single Page Application built on React 19, Vite, Tailwind CSS, Lucide React icons, and Recharts. Connects to backend services via reverse proxy (`/api`).
- **Backend Tier**: High-concurrency RESTful API built with Python 3.12, FastAPI, Pydantic v2 validation, and SQLite via SQLAlchemy.
- **Machine Learning & NLP Engine**: Scikit-learn pipelines with TF-IDF sublinear vectorization, Calibrated Linear SVM (Platt scaling), L2 Logistic Regression, Multinomial Naive Bayes, and a transparent Rule-Based Heuristic baseline.
- **Explainability & Attribution Layer**: Transparent dual-evidence pipeline synthesizing word-level feature contributions with deterministic cybersecurity rule indicators.
- **Robustness Testing Suite**: Automated adversarial perturbation harness evaluating punctuation noise, casing alterations, whitespace splitting, and legitimate business deadline false-positive resistance.

```mermaid
flowchart TD
    subgraph Frontend["React 19 + Vite Frontend"]
        UI_Dash[Dashboard & KPI Telemetry]
        UI_Scan[Message Scanner & Educational Presets]
        UI_Hist[Audit History & CSV Export]
        UI_Insights[Model Insights & PR Curves]
        UI_Settings[Threshold & Privacy Settings]
    end

    subgraph Backend["FastAPI REST Backend (Port 8000)"]
        API_Scan["/api/scan"]
        API_Summary["/api/dashboard/summary"]
        API_Hist["/api/scans & /api/scans/export"]
        API_Metrics["/api/models/metrics"]
        API_Rob["/api/robustness/results"]
        DB[(SQLite phishshift.db)]
    end

    subgraph MLEngine["ML & Inference Service"]
        Preproc[Text Normalization & URL Defanger]
        Abstain[Abstention & OOD Validator]
        TFIDF[TF-IDF N-gram Vectorizer (1,2)]
        SVM[Calibrated Linear SVM]
        LR[Logistic Regression]
        Rules[Rule-Based Heuristic Engine]
        Attribution[Feature Attribution Engine]
    end

    UI_Scan -->|POST /api/scan| API_Scan
    UI_Dash -->|GET /api/dashboard/summary| API_Summary
    UI_Hist -->|GET /api/scans| API_Hist
    UI_Insights -->|GET /api/models/metrics| API_Metrics

    API_Scan --> Preproc
    Preproc --> Abstain
    Abstain --> TFIDF
    TFIDF --> SVM
    TFIDF --> LR
    Preproc --> Rules
    SVM --> Attribution
    LR --> Attribution
    Rules --> Attribution

    Attribution -->|Structured Assessment| API_Scan
    API_Scan --> DB
    API_Summary --> DB
    API_Hist --> DB
```

---

### 2. Dual-Layer Risk Assessment & Decision Logic

To prevent brittle classifications, PhishShift employs a **two-layer decision framework**:

1. **Statistical ML Model (Linear SVM with Platt Sigmoid Calibration)**:
   - Computes a true, continuous posterior probability $P(\text{phishing} \mid \text{text})$.
   - Uses sublinear TF scaling: $1 + \log(\text{tf})$ to dampen the impact of repeated keywords.
   - Restricts n-gram range to unigrams and bigrams $(1, 2)$ to capture multi-word threat motifs (e.g., "password expires", "verify credentials", "wire transfer").

2. **Deterministic Cybersecurity Heuristic Engine**:
   - Detects five orthogonal categories of evidence:
     - **Urgency Pressure**: Imminent account locks, 24-hour expiration warnings, disciplinary threats.
     - **Credential Triggers**: Requests to re-authenticate, SSO update portals, MFA tokens, login disavowal.
     - **Financial Pressure**: ACH wire routing changes, overdue invoices, cryptocurrency ransom/withdrawal alerts.
     - **Inert Defanged URLs**: Lookalike TLDs (`.tk`, `.top`, `.cc`, `.xyz`, `.club`), IP addresses, and authentication path segments.
     - **Benign Counter-Evidence**: Administrative maintenance schedules, calendar invitations, appointment confirmations, opt-out compliance phrases (`Reply STOP`).

#### Decision Thresholding & Abstention Logic:

$$\text{Risk Category} = \begin{cases}
\text{Higher Risk} & \text{if } P \ge T_{\text{high}} \text{ and not abstained} \\
\text{Lower Risk} & \text{if } P \le T_{\text{low}} \text{ and heuristic count } < 3 \\
\text{Needs Review} & \text{if } T_{\text{low}} < P < T_{\text{high}}, \text{ or heuristic conflict, or abstained}
\end{cases}$$

Where default thresholds are $T_{\text{high}} = 0.70$ and $T_{\text{low}} = 0.40$.

- **Abstention Policy**: If input contains fewer than 3 recognizable word tokens or consists of repetitive non-linguistic noise, the model automatically abstains, setting `abstained = true` and `requires_review = true` to prevent false confidence on out-of-scope inputs.

---

### 3. Model Explainability & Feature Attribution

Rather than producing an opaque "black-box" risk score, PhishShift extracts word-level feature attributions by projecting the active n-grams of the input through regularized model coefficients:

$$\text{Attribution}(w_i) = \text{TF-IDF}(w_i) \cdot \beta_i$$

- **Positive Attributions ($+ \text{Risk}$)**: Words such as `urgent`, `expires`, `verify`, `direct deposit`, `wire` that increase phishing probability.
- **Negative Attributions ($- \text{Risk}$)**: Words such as `dental`, `appointment`, `sprint`, `pr`, `receipt` that decrease risk and reinforce benign context.

---

### 4. Privacy-Preserving Architecture

- **Minimal Necessary Storage**: In accordance with cybersecurity data minimization principles, PhishShift defaults to storing only a 180-character truncated preview (`body_preview`) in SQLite.
- **Opt-in Retention**: Full body retention (`stored_full_body = true`) is only activated when explicitly requested by the user.
- **Zero URL Execution**: URLs are sanitized and defanged (`hxxps[://]domain[.]tld`) into inert text representations prior to storage or feature extraction. Under no circumstances are outbound HTTP requests initiated to user-supplied links.
- **Error Obfuscation**: The FastAPI backend strips internal filesystem paths and stack traces from production client error responses, mitigating information disclosure.
