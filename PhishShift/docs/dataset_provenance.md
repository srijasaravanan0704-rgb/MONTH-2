# PhishShift: Dataset Provenance & Data Hygiene Protocol

---

### 1. Dataset Overview

The PhishShift dataset (`dataset_raw.csv` & processed splits) was constructed to provide a high-quality, reproducible, legal benchmark for evaluating natural language message security classifiers without exposing real credentials, private corporate communications, or active malicious infrastructure.

- **Total Generated Raw Samples**: 492
- **Clean Labeled Samples Post-Deduplication**: 408
- **Class Balance**: 224 Benign (54.9%), 184 Phishing (45.1%)
- **Channel Representation**: 280 Email communications (68.6%), 128 SMS messages (31.4%)
- **Distinct Campaign Clusters**: 20 orthogonal threat & benign operational campaigns

---

### 2. Schema Specification

Each record in `data/raw/dataset_raw.csv` and the processed partitions contains the following normalized fields:

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `message_id` | String | Unique identifier | `MSG-1042` |
| `channel` | Enum (`email`, `sms`) | Communication delivery vector | `email` |
| `subject_or_title` | String | Subject header or SMS label | `Your Microsoft 365 Password Expires in 24 Hours` |
| `body_text` | Text | Primary message content (defanged) | `Dear User, your password expires...` |
| `sanitized_url_features` | String | Semicolon-delimited inert URL tokens | `hxxps[://]login-microsoft365[.]net/auth` |
| `sender_domain_type` | String | Sender provenance category | `spoofed_lookalike`, `legitimate_corporate` |
| `label` | Enum (`phishing`, `benign`) | Ground-truth security label | `phishing` |
| `campaign_group` | String | Campaign cluster identifier | `m365_credential_harvest` |
| `collected_date` | Date (`YYYY-MM-DD`) | Date of ingestion/generation | `2026-10-09` |
| `source_provenance` | String | Generation methodology & source | `synthetic_educational_m365_phish` |

---

### 3. Campaign Taxonomy

The dataset spans 20 distinct campaign clusters representing real-world organizational security challenges:

#### A. Malicious Phishing & Smishing Campaigns (9 clusters):
1. `m365_credential_harvest`: Microsoft 365 password expiration, MFA re-registration, and quarantine release lures.
2. `payroll_wire_fraud`: Business Email Compromise (BEC), CEO wire requests, direct deposit routing alterations.
3. `it_helpdesk_vpn`: Zero-trust VPN gateway updates, urgent SSL certificate renewals, IT ticket cancellation scams.
4. `sms_delivery_smishing`: USPS, FedEx, DHL, and UPS undelivered parcel fee collection lures.
5. `sms_banking_alert_smishing`: Chase, Wells Fargo, BofA, and Citi fraudulent debit charge alerts.
6. `tax_and_crypto_fraud`: IRS refund rebate forms, Coinbase wallet unfreezing notices, SSN suspension threats.
7. `social_engineering_survey_gift`: Amazon, Target, and Costco employee appreciation gift card lures.
8. `fake_invoice_subscription`: Best Buy Geek Squad auto-renewal invoices, Norton/McAfee cancellation refund lures.
9. `cloud_storage_onedrive_phish`: SharePoint and Dropbox shared document viewing traps.

#### B. Benign Operational & False-Positive Stress Campaigns (11 clusters):
1. `legitimate_password_reset`: Automated single-use passcodes and password recovery notices from Google, Atlassian, Okta, and GitHub.
2. `routine_payroll_statement`: ADP and Workday bi-weekly earnings notifications and W-4 tax withholding reminders.
3. `it_maintenance_announcement`: Data center network maintenance windows and mandatory annual cybersecurity awareness courses.
4. `customer_shipping_order_benign`: Genuine Amazon order dispatches, Apple Store purchase receipts, and airline confirmations.
5. `sms_legitimate_notifications`: Pharmacy prescription pickups, ride-share arrivals (Uber, Lyft), and doctor appointment confirmations.
6. `meeting_and_collaboration_benign`: Weekly sprint planning calendar invitations, Confluence architecture notes, and Jira pull request review requests.
7. `academic_and_research_benign`: University canvas assignment rubrics, campus library book returns, and colloquium announcements.
8. `travel_hotel_booking_benign`: Hotel reservation check-in vouchers (Marriott Bonvoy, Delta Airlines, Hertz).
9. `sms_legitimate_2fa_codes`: Shortcode two-factor one-time verification passcodes (Google, Microsoft, PayPal).

---

### 4. URL Defanging & Zero-Execution Protocol

In compliance with cybersecurity safety standards:
- All URLs in the raw dataset, synthetic generators, and test suites are defanged:
  - Protocols: `http://` $\rightarrow$ `hxxps[://]`
  - Delimiters: `.` $\rightarrow$ `[.]`
- The application executes **zero outbound network connections** to user-provided or ingested links.
- URL feature extraction is conducted strictly on inert text patterns using compiled regular expressions.

---

### 5. Deduplication & Zero-Leakage Splitting

1. **Exact Deduplication**: Normalized texts matching verbatim are pruned.
2. **Near-Duplicate Pruning**: RapidFuzz normalized Levenshtein distance ($> 98\%$ sequence identity) identifies and prunes redundant template copies, preventing artificial density.
3. **Campaign Separation**:
   - Four full campaign groups (`social_engineering_survey_gift`, `sms_delivery_smishing`, `customer_shipping_order_benign`, `sms_legitimate_notifications`) are withheld exclusively for the **Campaign Holdout Set** (105 samples).
   - The training set (275 samples) and validation set (28 samples) share zero campaign groups with the holdout set, completely eliminating template memorization and data leakage.
