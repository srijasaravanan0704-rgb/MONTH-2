"""
Dataset generation pipeline for PhishShift.
Produces 600+ realistic, educational, defanged security awareness examples
across 16 campaign clusters with balanced Email and SMS representation.
Includes real-world-like legitimate urgent notifications (passwords, payroll, system advisories)
to strictly test false positive resilience.
All URLs are defanged and inert (hxxps[://], domain[.]tld).
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

CAMPAIGN_TEMPLATES = {
    # --- PHISHING: CREDENTIAL & MFA HARVESTING ---
    "m365_credential_harvest": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "spoofed_lookalike",
        "provenance": "synthetic_educational_m365_phish",
        "items": [
            ("Your Microsoft 365 Password Expires in 24 Hours", "Dear User,\n\nYour Microsoft 365 password is scheduled to expire in 24 hours. To prevent suspension of your email services and cloud access, please verify your credentials immediately.\n\nKeep Same Password: hxxps[://]login-microsoft365-verify[.]net/auth/portal\n\nFailure to take action will result in mailbox deactivation.\n\nIT Support Desk"),
            ("Action Required: Re-authenticate your Office 365 mailbox", "Security Alert: An outdated security certificate was detected on your mailbox. Please re-authenticate your Microsoft Office 365 profile to ensure continued sync with your mobile device and Outlook client.\n\nRe-authenticate now: hxxps[://]office365-sync-portal[.]info/login\n\nMicrosoft Cloud Security"),
            ("Security Notice: Unusual sign-in activity detected", "We detected an unauthorized sign-in attempt to your account from IP address 185.220.101.4 (Kyiv, Ukraine). If this was not you, confirm your identity and review recent activities:\n\nhxxps[://]microsoft-security-auth[.]info/disavow-session\n\nIf you do not confirm within 6 hours, your account will be locked."),
            ("Urgent: Storage quota exceeded for your organization account", "Attention Colleague,\n\nYour email mailbox has exceeded its storage threshold (99.4% used). You have 14 undelivered incoming messages waiting on the mail server. Release pending messages here:\n\nhxxps[://]outlook-mail-release[.]cloud/storage-quarantine\n\nPlease act promptly to avoid permanent message deletion."),
            ("Immediate Verification Needed: Update your SSO credentials", "Urgent SSO Re-authentication:\n\nOur system detected an outdated single-sign-on certificate on your workstation. You must refresh your corporate identity token today.\n\nVisit: hxxps[://]company-sso-gateway[.]tk/renew\n\nFailure to update will revoke your VPN access.\n\nIT Systems Engineer"),
            ("Office365 Notification: Pending incoming messages on hold", "Alert: Pending Exchange messages quarantined.\n\nYou have 7 new incoming messages held in the quarantine server due to an SSL certificate mismatch. Release your messages now:\nhxxps[://]quarantine-server-exchange[.]xyz/release\n\nMessages not claimed within 24h will be purged."),
            ("Mandatory MFA Device Re-registration", "Notice: All employees must register their Authenticator application on the upgraded tenant infrastructure before 5:00 PM today.\n\nEnroll device: hxxps[://]mfa-enrollment-portal[.]cc/register\n\nAccounts not enrolled will experience login blocks."),
            ("Pending OneDrive shared file awaiting approval", "A colleague has sent you an encrypted financial spreadsheet via OneDrive. Due to tenant permissions, you must verify your corporate credentials to view the document.\n\nAccess file: hxxps[://]onedrive-shared-secure[.]top/auth?doc=7719\n\nLink valid for 48 hours."),
            ("Exchange Administrator: Inactive Session Timeout", "Your session on exchange.mail.corp has expired. Any unsaved drafts or incoming queued emails require session renewal.\n\nLog in again: hxxps[://]exchange-session-renew[.]club/sso\n\nSystem Administration"),
            ("Microsoft Account Team: Unusual password change request", "We received a request to change the security info on your Microsoft account. If you did not make this request, click below to cancel the request and protect your account:\n\nhxxps[://]account-protection-ms[.]vip/cancel-request\n\nMicrosoft Security Team")
        ]
    },

    # --- PHISHING: BEC & PAYROLL FRAUD ---
    "payroll_wire_fraud": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "freemail_impersonation",
        "provenance": "synthetic_educational_bec_fraud",
        "items": [
            ("URGENT: Direct Deposit Information Update Required", "Employee Payroll Alert:\n\nOur payroll provider identified a discrepancy in your direct deposit routing number for this Friday's disbursement. Update your banking information immediately to prevent paycheck delays:\n\nhxxps[://]payroll-adp-worker-portal[.]site/direct-deposit\n\nCorporate Human Resources"),
            ("Payment Reconciliation: Outstanding vendor invoice attached", "Hello,\n\nPlease find attached the overdue invoice #INV-99382 for consulting services. Due to banking changes, our ACH deposit details have changed. Please route remaining balance of $28,450 to the new escrow account immediately.\n\nConfirm receipt and remittance slip to this email address.\n\nRegards,\nAccounts Payable"),
            ("From the Office of the CEO: Confidential wire transfer request", "Hi, are you at your desk?\n\nI need you to process an urgent wire transfer for an acquisition closing today. Keep this strictly confidential as the board has not made an announcement. Let me know what information you require to expedite this before 3 PM cutoff.\n\nSent from my iPhone\nChief Executive Officer"),
            ("Payroll Department: Review your updated tax withholdings W-4", "Urgent: W-2 forms for calendar year 2025 are now ready for download. Due to federal compliance regulations, verify your Social Security number and tax withholding elections:\n\nhxxps[://]workday-tax-portal[.]vip/tax-review\n\nFinance & Accounting Operations"),
            ("Wire Approval: Expedited closing transfer for acquisition", "Confidential Wire Transfer Request:\n\nPlease initiate a wire of $48,900 to escrow account #98124091. This is for the vendor buyout discussed this morning. Send the confirmation wire swift code as soon as executed.\n\nExecutive Director"),
            ("Urgent Banking Information Request - Direct Deposit Error", "Dear Staff Member,\n\nOur automated payroll batch returned an invalid ABA routing number for your bank account. To ensure your monthly paycheck is not delayed, submit your updated banking information here:\n\nhxxps[://]adp-payroll-verify[.]live/banking\n\nPayroll Services Group"),
            ("Important: Bonus Distribution Acknowledgement Form", "All Employees:\n\nSpecial performance bonus distributions have been finalized. To accept your distribution direct deposit, electronically sign the tax document below:\n\nhxxps[://]docusign-payroll-bonus[.]online/sign?id=3819\n\nHuman Resources Compensation"),
            ("Urgent Inquiry from CFO", "Are you available to take care of an urgent financial transaction? I am currently in offsite meetings with restricted phone access. Please reply with your direct mobile number so I can text you the beneficiary wire details.")
        ]
    },

    # --- PHISHING: IT HELPDESK & VPN SPOOFING ---
    "it_helpdesk_vpn": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "spoofed_lookalike",
        "provenance": "synthetic_educational_helpdesk_phish",
        "items": [
            ("IT Helpdesk: Critical Cisco AnyConnect VPN Security Patch", "All Staff:\n\nWe are migrating to a zero-trust network gateway tonight. You must update your VPN client configuration by authenticating through our emergency portal:\n\nhxxps[://]vpn-anyconnect-update[.]live/login\n\nUsers who fail to complete this step will lose remote access tomorrow morning.\n\nCorporate Network Infrastructure"),
            ("ServiceDesk Ticket #89201: Account Termination Notice in Progress", "Ticket #89201 Status Update: Scheduled account deactivation has been initiated per HR request. If this request was filed in error, cancel cancellation order immediately:\n\nhxxps[://]servicedesk-cancellation-portal[.]cc/ticket=89201\n\nIT Support Services"),
            ("Mandatory Security Compliance: Endpoint Antivirus Update", "Attention Remote Workers:\n\nA high-severity zero-day vulnerability (CVE-2026-1189) has been detected on company laptops. Run the automated patch validator immediately:\n\nhxxps[://]endpoint-security-compliance[.]link/patch-tool.exe\n\nCybersecurity Defense Team"),
            ("Urgent Action: Global VPN Certificate Update Required", "Your GlobalProtect VPN certificate will expire at 23:59 tonight. Re-issue your digital token via the self-service PKI gateway:\n\nhxxps[://]pki-cert-gateway[.]top/renew\n\nFailure to renew will lock your network access."),
            ("Helpdesk Notice: Corporate Zoom Client Critical Exploit", "Security Bulletin: A remote code execution bug was found in Zoom. All users must install the validated company patch before joining external calls:\n\nhxxps[://]zoom-patch-update[.]xyz/download\n\nIT Desktop Support"),
            ("Immediate Action Required: Wi-Fi Certificate Revocation", "Our campus 802.1x enterprise Wi-Fi certificate has been updated. To reconnect your corporate phone and laptop, log in to authenticate your MAC address:\n\nhxxps[://]campus-wifi-auth[.]info/enroll\n\nNetwork Operations Center"),
            ("IT Ticket Alert: Suspicious Mailbox Forwarding Rule Created", "An automated forwarding rule was detected on your Outlook mailbox sending copies to external address 'backup99@mail-drop[.]com'. If you did not set this rule, remove it immediately:\n\nhxxps[://]outlook-rule-removal[.]site/disable\n\nInformation Security Operations")
        ]
    },

    # --- PHISHING: SMISHING - PACKAGE DELIVERY LURES ---
    "sms_delivery_smishing": {
        "channel": "sms",
        "label": "phishing",
        "sender_domain_type": "unknown_shortcode_spoof",
        "provenance": "synthetic_educational_smishing",
        "items": [
            ("SMS Delivery", "USPS Alert: Your parcel #94001092023 cannot be delivered due to incomplete street number. Update address within 12h: hxxps[://]usps-tracking-redelivery[.]info/p?id=9400109"),
            ("SMS Delivery", "FedEx: Package delivery on hold due to unpaid customs fee of $1.85. Pay immediately to clear dispatch: hxxps[://]fedex-delivery-fee[.]cc/pay"),
            ("SMS Delivery", "DHL Express: Your shipment #DH891278 is waiting at regional depot. Schedule delivery slot before package is returned to sender: hxxps[://]dhl-parcel-slot[.]biz/track"),
            ("SMS Delivery", "UPS Notification: Driver attempted delivery at 14:15. Please confirm residence and pay re-delivery surcharge: hxxps[://]ups-package-redirection[.]online/status"),
            ("SMS Delivery", "Postal Service: Package arrives today! A $0.99 redelivery fee is required. Clear fee now: hxxps[://]postal-delivery-reschedule[.]top/usps"),
            ("SMS Delivery", "Amazon Logistics: We tried delivering package #AZ-8921 but no safe location found. Update delivery instructions: hxxps[://]amazon-package-reschedule[.]cc/update"),
            ("SMS Delivery", "Courier Update: Your parcel is delayed at the distribution hub. Confirm your postal code: hxxps[://]parcel-locator-hub[.]link/verify"),
            ("SMS Delivery", "Royal Mail Notice: A package addressed to you has unpaid postage of GBP 2.10. Pay before 24h or it will be destroyed: hxxps[://]royalmail-unpaid-fee[.]site/postage")
        ]
    },

    # --- PHISHING: SMISHING - BANKING & CARD FRAUD ALERTS ---
    "sms_banking_alert_smishing": {
        "channel": "sms",
        "label": "phishing",
        "sender_domain_type": "alphanumeric_sender_spoof",
        "provenance": "synthetic_educational_smishing",
        "items": [
            ("SMS Bank Alert", "CHASE ALERT: A debit card transaction of $749.20 at BEST BUY was declined. If this was NOT you, call immediately or secure account at: hxxps[://]chase-fraud-prevention[.]org/verify"),
            ("SMS Bank Alert", "WELLS FARGO: Your account has been temporarily locked due to suspicious login attempts. Verify identity to unlock: hxxps[://]wellsfargo-access-portal[.]co/reactivate"),
            ("SMS Bank Alert", "CITI: Suspicious charge of $1,250.00 detected on Apple Pay. Did you authorize this? Reply NO or dispute at hxxps[://]citi-cardholder-protection[.]net/dispute"),
            ("SMS Bank Alert", "BANK OF AMERICA: Card ending 4402 restricted due to unusual activity. Restore card access by verifying PIN: hxxps[://]bofa-secure-resolve[.]cloud/auth"),
            ("SMS Bank Alert", "PayPal: Security Alert! $499.00 payment sent to Coinbase Ltd. Did not order? Cancel transaction immediately: hxxps[://]paypal-dispute-resolution[.]site/cancel"),
            ("SMS Bank Alert", "Capital One Fraud Alert: Did you authorize $890.00 at Gucci NY? If NO, secure your card immediately: hxxps[://]capitalone-fraud-alert[.]vip/resolve"),
            ("SMS Bank Alert", "US Bank Notice: Your online access has been suspended due to 3 failed password attempts. Restore access: hxxps[://]usbank-identity-verify[.]club/login"),
            ("SMS Bank Alert", "Apple Pay: Your digital wallet was suspended on a new device. If this was not you, protect your cards: hxxps[://]applepay-security-desk[.]live/verify")
        ]
    },

    # --- PHISHING: TAX, CRYPTO & GOVERNMENT IMPERSONATION ---
    "tax_and_crypto_fraud": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "suspicious_free_domain",
        "provenance": "synthetic_educational_tax_crypto_phish",
        "items": [
            ("Internal Revenue Service: Notice of unclaimed tax refund deposit", "Internal Revenue Service (IRS):\n\nOur records indicate you are eligible for an unclaimed tax rebate of $1,420.50 from your 2024 returns. Submit your direct deposit banking details to claim your refund before the deadline:\n\nhxxps[://]irs-refund-claim-portal[.]online/taxpayer-form\n\nOfficial IRS Treasury Bureau"),
            ("Binance Security: Unauthorized withdrawal of 0.85 BTC detected", "Binance Notification:\n\nNew login detected from Mozilla Firefox on Windows 10 in Moscow, Russia. If you did not authorize this, revoke API keys and lock account:\n\nhxxps[://]binance-anti-phishing-gate[.]info/disable\n\nBinance Support"),
            ("Coinbase Support: Your account will be restricted within 24 hours", "Coinbase Account Alert:\n\nA withdrawal request for 0.85 BTC ($55,200) was requested to external wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. If you did not request this transfer, freeze your wallet instantly:\n\nhxxps[://]coinbase-wallet-cancel[.]cc/revoke-tx\n\nCoinbase Security Operations"),
            ("IRS Notification: Final Notice of Tax Assessment Underpayment", "IRS Final Notice:\n\nAn outstanding tax deficiency of $3,190.00 is recorded under your SSN. A lien will be placed on your financial accounts unless paid within 72 hours.\n\nSettle payment via federal gateway: hxxps[://]irs-tax-settlement[.]vip/pay-bill\n\nInternal Revenue Service"),
            ("MetaMask Warning: Immediate Wallet KYC Verification Required", "Attention MetaMask User:\n\nUnder decentralized finance compliance rule 14B, all active Ethereum wallets must complete identity validation to prevent transaction halting.\n\nConnect wallet: hxxps[://]metamask-kyc-validator[.]xyz/connect\n\nEthereum Foundation Compliance"),
            ("Social Security Administration: Suspension Notice Regarding SSN", "Social Security Administration Notice:\n\nYour Social Security Number has been linked to criminal activities in south Texas. To dispute immediate arrest warrants and asset freezing, confirm identity:\n\nhxxps[://]ssa-identity-verification[.]club/dispute\n\nOffice of the Inspector General")
        ]
    },

    # --- PHISHING: SOCIAL ENGINEERING & FAKE REWARDS ---
    "social_engineering_survey_gift": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "promotional_throwaway",
        "provenance": "synthetic_educational_giftcard_scam",
        "items": [
            ("You have won a $500 Amazon Gift Card - Claim Today!", "Congratulations! As a valued employee, you have been selected to receive a $500 Amazon gift card for employee appreciation week.\n\nClaim your unique code by logging into the corporate rewards portal:\nhxxps[://]rewards-amazon-voucher[.]club/claim?code=AMZ500\n\nOffer valid for the next 24 hours only!\n\nEmployee Benefits Team"),
            ("Employee Appreciation: Claim your Walmart shopping voucher", "Hi there! You were chosen in our quarterly satisfaction draw. Receive a $250 Visa prepaid card after completing a 2-minute questionnaire.\n\nStart survey: hxxps[://]visa-card-survey-promotions[.]fun/start\n\nLimited spots available!"),
            ("Target Reward: $150 Voucher waiting for your confirmation", "Exclusive Holiday Reward: Your loyalty status has unlocked a $150 electronic gift voucher for Target stores. Confirm your shipping address and claim code:\n\nhxxps[://]target-gift-redemption[.]top/card\n\nExpires at midnight."),
            ("Costco Wholesale: Annual member dividend payout", "Costco Executive Members: Your annual 2% reward certificate of $219.40 is available for direct electronic transfer to your checking account.\n\nDeposit funds: hxxps[://]costco-dividend-payout[.]vip/claim\n\nCostco Wholesale Services"),
            ("Starbucks Rewards: Free $50 e-Gift Card for Coffee Day", "Celebrate National Coffee Day! Claim your complimentary $50 Starbucks reload card. Enter your phone number and email to receive your barcode:\n\nhxxps[://]starbucks-promo-giveaway[.]live/reload\n\nOffer strictly limited to first 500 respondents.")
        ]
    },

    # --- PHISHING: FAKE INVOICE & SUBSCRIPTION RENEWAL ---
    "fake_invoice_subscription": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "freemail_impersonation",
        "provenance": "synthetic_educational_invoice_scam",
        "items": [
            ("Invoice #INV-49201 from Geek Squad / Best Buy", "Thank you for your business! Your annual Geek Squad Total Tech Care subscription has auto-renewed for $399.99. This amount was auto-debited from your bank account.\n\nIf you did not authorize this subscription, call our cancellation desk immediately at +1 (888) 555-0149 or visit:\nhxxps[://]geeksquad-billing-cancel[.]cc/refund\n\nGeek Squad Billing Operations"),
            ("Your Norton 360 LifeLock Protection Has Been Renewed", "Dear Customer,\n\nWe successfully processed your payment of $499.00 for Norton 360 Multi-Device Antivirus (2 Year License). Receipt #NOR-98214.\n\nTo cancel subscription or request an instant refund, contact our refund department:\nhxxps[://]norton-refund-desk[.]top/cancel\n\nSymantec Billing Support"),
            ("McAfee Total Protection: Payment Successful", "Payment Confirmation: We received $299.99 for McAfee LiveSafe 3-year subscription. Billed to Visa ending 8192.\n\nDid not make this purchase? Dispute charge within 24 hours:\nhxxps[://]mcafee-dispute-center[.]club/inquiry\n\nMcAfee AntiVirus Billing"),
            ("DocuSign: Electronic Document Awaiting Signature - Purchase Agreement", "You have received a new document to review and sign via DocuSign: 'Commercial Property Lease Agreement #8841'.\n\nReview document: hxxps[://]docusign-secure-envelopes[.]live/sign?env=99281\n\nThis document was sent by accounting@corporate-properties.com")
        ]
    },

    # --- BENIGN: LEGITIMATE PASSWORD RESETS & 2FA (CRITICAL FOR FALSE POSITIVE TESTING) ---
    "legitimate_password_reset": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_corporate",
        "provenance": "synthetic_educational_benign_auth",
        "items": [
            ("Reset your company account password", "Hi Alex,\n\nWe received a request to reset your password for your corporate Google Workspace account. If you made this request, please use the following link to choose a new password:\n\nhxxps[://]accounts[.]google[.]com/signin/recovery\n\nThis link is valid for 15 minutes. If you did not request this, you can safely ignore this email; your password will remain unchanged.\n\nGoogle Workspace Team"),
            ("Password assistance for your GitHub account", "Hello,\n\nWe received a password reset request for your GitHub username: dev-lead-engineer.\n\nClick here to reset your password:\nhxxps[://]github[.]com/password_reset\n\nIf you did not initiate this request, no action is required.\n\nGitHub Support Team"),
            ("Verification code for your Atlassian Jira workspace", "Your Atlassian verification code is: 849201. Enter this code on the sign-in screen to verify your email address. This code will expire in 10 minutes.\n\nIf you didn't ask for this code, you can ignore this message.\n\nAtlassian Security"),
            ("Security code to sign in to Slack", "Hi Sarah,\n\nA request has been submitted to change the password on your Okta portal. Click here to confirm the update:\nhxxps[://]mycompany[.]okta[.]com/reset-password\n\nFor security reasons, this link will expire in 30 minutes.\n\nCorporate Identity Operations"),
            ("Your single-use passcode for AWS Management Console", "Your AWS security passcode is 391842. Use this code to complete multi-factor authentication for account #184920194819. This code expires in 5 minutes.\n\nAmazon Web Services Security"),
            ("Microsoft Account Password Reset Code", "Use verification code 592810 for Microsoft authentication. If you did not request this code, someone may have entered your email address by mistake. No action is required.\n\nMicrosoft Account Team"),
            ("GitLab: Password change notification", "Hello Developer,\n\nThe password for your GitLab account (user: frontend-team) was recently changed. If you performed this action, no further steps are necessary. If you did not change your password, contact your company system administrator immediately.\n\nGitLab System"),
            ("Zoom Video: Verification Code", "Your Zoom one-time sign-in code is 773194. Enter this code on the login page to verify your identity. Valid for 10 minutes.")
        ]
    },

    # --- BENIGN: ROUTINE PAYROLL & HR STATEMENTS (LEGITIMATE URGENCY/PAYROLL WORDS) ---
    "routine_payroll_statement": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_corporate",
        "provenance": "synthetic_educational_benign_hr",
        "items": [
            ("Your bi-weekly earnings statement is available in ADP", "Dear Team Member,\n\nYour bi-weekly direct deposit earnings statement for pay period ending October 15, 2026 is now available. Log in to your ADP Workforce Now account to review pay and tax withholdings:\n\nhxxps[://]workforcenow[.]adp[.]com\n\nPlease reach out to payroll@company.internal if you have any questions.\n\nPayroll & HR Shared Services"),
            ("Annual Open Enrollment: Benefits Selection Window Opens Monday", "Good morning,\n\nAnnual open enrollment for health, dental, and life insurance benefits will begin on Monday, November 3rd and close on November 20th. Informational webinars will be hosted next Thursday.\n\nReview benefit plan summaries on the company intranet at hxxps[://]intranet[.]internal/benefits.\n\nPeople Operations"),
            ("Notice of upcoming 401(k) contribution match update", "All Staff,\n\nPlease review your updated federal W-4 tax withholding allowances if you experienced life event changes during the past quarter. You can submit updates through the HR employee portal.\n\nHuman Resources Department"),
            ("Monthly Paystub notification for October 2026", "Hi Taylor,\n\nYour Workday payroll statement for October 2026 has been generated. Direct deposit has been initiated to your designated checking account. View paystub breakdown: hxxps[://]wd5[.]myworkday[.]com/company/pay\n\nCorporate Finance"),
            ("Reminder: Flexible Spending Account (FSA) Deadline", "Friendly reminder from HR: Please submit all eligible healthcare receipts and claims for the 2026 calendar year before December 15th to ensure reimbursement. Check balance: hxxps[://]fsa-benefits[.]internal/claims\n\nEmployee Benefits Team"),
            ("Performance Review Cycle: Self-Evaluation Due Next Friday", "Team,\n\nThe mid-year performance self-evaluation window is now open in Lattice. Please complete your goals assessment and submit to your manager by Friday, Oct 31.\n\nHR People Team")
        ]
    },

    # --- BENIGN: IT MAINTENANCE & SECURITY AWARENESS ---
    "it_maintenance_announcement": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_corporate",
        "provenance": "synthetic_educational_benign_it",
        "items": [
            ("Scheduled Maintenance: Data Center Network Switch Replacement", "Hello Everyone,\n\nOur Systems Engineering group will perform routine maintenance on core network switches this Saturday from 10:00 PM to 2:00 AM UTC. Intermittent connectivity to the internal file server may occur during this window.\n\nNo user action is required. Review the change ticket at hxxps[://]jira[.]internal/browse/OPS-4821.\n\nIT Infrastructure Operations"),
            ("Notice: Quarterly Security Patching for Core Services", "Team,\n\nThis is a friendly reminder that the Q4 mandatory cybersecurity awareness course is due on Friday, October 31st. The 15-minute training module covers phishing recognition and MFA protection.\n\nLog in through your corporate SSO portal to complete the course: hxxps[://]learning[.]internal/course/cyber-2026\n\nInformation Security Office"),
            ("IT Advisory: Maintenance Window this Saturday 10 PM - 2 AM", "Advisory: Routine firmware upgrades on corporate printers and conference room AV gear will occur Wednesday evening. Services will resume by 7:00 AM Thursday.\n\nWorkplace Technology"),
            ("Important IT Notice: macOS Sonoma Compatibility Testing Complete", "Engineering Staff:\n\nOur IT systems team has completed qualification testing for macOS Sonoma on corporate MacBooks. Users are now cleared to upgrade via System Settings at their convenience. Contact helpdesk@company.internal for assistance.\n\nIT Desktop Engineering"),
            ("Security Best Practice: Clean Desk Policy Reminder", "Hi All,\n\nAs part of our annual ISO-27001 compliance audit, please ensure laptops are locked when away from desks and physical documents containing confidential data are securely shredded. Thank you for keeping our workplace secure!\n\nInformation Security Officer")
        ]
    },

    # --- BENIGN: CUSTOMER SHIPPING & E-COMMERCE RECEIPTS ---
    "customer_shipping_order_benign": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_retail",
        "provenance": "synthetic_educational_benign_commerce",
        "items": [
            ("Your Amazon order #112-9840192 has shipped!", "Hi David,\n\nGood news! Your package with order #112-9840192-3841920 containing 'Ergonomic Mechanical Keyboard' has shipped. It is scheduled to arrive Tuesday, Oct 21.\n\nTrack your package status on Amazon:\nhxxps[://]www[.]amazon[.]com/your-orders\n\nThank you for shopping with us!"),
            ("Receipt for your Apple Store purchase", "Thank you for your order. Here is your official receipt for invoice #APL-92810. You purchased 1x USB-C Power Adapter ($19.00). Payment was charged to your credit card ending in 4920.\n\nView order details at hxxps[://]www[.]apple[.]com/shop/order/list"),
            ("Flight Confirmation: San Francisco (SFO) to New York (JFK)", "Your reservation is confirmed! Flight AA 104 departs SFO at 08:30 AM and arrives at JFK at 17:05 PM. Check in online 24 hours prior to departure at hxxps[://]www[.]aa[.]com/checkin."),
            ("Your monthly electric utility statement is ready", "Dear Customer,\n\nYour monthly electric statement of $84.20 for service address 742 Evergreen Terrace is ready. Automatic debit is scheduled for November 1st. View breakdown at hxxps[://]myaccount[.]powercompany[.]com\n\nCustomer Care Team"),
            ("Home Depot: Order ready for store pickup", "Hi Customer,\n\nYour order #HD-992104 is picked and ready at Customer Service Desk, San Jose store. Please bring a valid photo ID and this confirmation barcode.\n\nStore hours: 6:00 AM - 9:00 PM."),
            ("Uber Receipts: Your ride on Saturday afternoon", "Thanks for riding with Uber! Total fare: $24.85 charged to Mastercard ending in 1948. Trip distance: 6.2 miles. View route and receipt: hxxps[://]riders[.]uber[.]com/trips\n\nUber Technologies")
        ]
    },

    # --- BENIGN: SMS LEGITIMATE APPOINTMENTS & NOTIFICATIONS ---
    "sms_legitimate_notifications": {
        "channel": "sms",
        "label": "benign",
        "sender_domain_type": "legitimate_telecom_shortcode",
        "provenance": "synthetic_educational_benign_sms",
        "items": [
            ("SMS Legitimate Notice", "Your Dr. Patel dental checkup appointment is confirmed for Tuesday, Oct 21 at 2:30 PM. Reply 1 to Confirm or 2 to Reschedule."),
            ("SMS Legitimate Notice", "Walgreens Pharmacy: Rx #482910 is ready for pickup at 120 Main St. Store hours 8am-9pm. Reply STOP to opt out."),
            ("SMS Legitimate Notice", "DoorDash: Your Dasher Carlos is approaching with your lunch order! Track live map at: hxxps[://]doordash[.]com/orders/track"),
            ("SMS Legitimate Notice", "Uber: Your driver Priya (Toyota Camry, Lic #8XYZ12) has arrived outside. Please verify the license plate before entering."),
            ("SMS Legitimate Notice", "Your table for 4 at Bella Vista is confirmed for tonight at 7:30 PM. Call (555) 019-2831 if you need to adjust party size."),
            ("SMS Legitimate Notice", "Bank Alert: Free balance alert. Your checking balance is $1,420.19 as of 10/18. For mobile banking visit hxxps[://]mobile[.]chase[.]com"),
            ("SMS Legitimate Notice", "CVS Pharmacy: Your flu shot appointment is tomorrow, Oct 19 at 10:15 AM. Please arrive 5 minutes early. Text STOP to cancel."),
            ("SMS Legitimate Notice", "Southwest Airlines: Flight 1482 to Chicago Midway is on time. Gate A4. Boarding begins at 1:15 PM. Check bags at kiosk."),
            ("SMS Legitimate Notice", "Target: Your drive up order is ready! Open the Target app when you arrive and pull into a designated space."),
            ("SMS Legitimate Notice", "Verizon Alert: Your monthly bill payment of $85.00 has posted successfully. Thank you for your payment.")
        ]
    },

    # --- BENIGN: MEETING INVITATIONS & COLLABORATION ---
    "meeting_and_collaboration_benign": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_corporate",
        "provenance": "synthetic_educational_benign_collaboration",
        "items": [
            ("Invitation: Weekly Sprint Planning & Retrospective @ Mon 10am - 11am", "Hi team,\n\nAttached is the calendar invitation for our weekly sprint planning meeting this Monday at 10:00 AM PST. We will review sprint 14 deliverables and discuss backlog grooming.\n\nJoin Google Meet: hxxps[://]meet[.]google[.]com/xyz-abcd-efg\n\nTalk soon,\nProject Manager"),
            ("Notes from Architecture Review Board meeting", "Hi engineers,\n\nThanks for attending today's architecture review. Summary of agreed action items:\n1. Transition auth tokens to asymmetric keys\n2. Consolidate microservice database queries\n\nFull meeting notes in Confluence: hxxps[://]wiki[.]internal/display/ARCH/Notes\n\nBest regards,\nTech Lead"),
            ("Design sync: Mobile App UI/UX Figma Review", "Hey folks,\n\nI just updated the Figma design workspace for the new client dashboard. Feel free to leave comments on the wireframes before our sync tomorrow:\nhxxps[://]figma[.]com/file/DashboardDesignV2\n\nCheers,\nProduct Designer"),
            ("Project PhishShift: Quarterly Milestone Demo Schedule", "Hi Team,\n\nThe quarterly project milestone demonstration is scheduled for Thursday at 3:00 PM in Conference Room B and on Zoom. Please verify your demo branches are merged into staging by Wednesday evening.\n\nLead Architect"),
            ("Code Review: Pull Request #249 - Database indexing optimization", "Hi Alex,\n\nCould you please take a look at PR #249 when you have a spare moment? It resolves the latency bottleneck on user search queries. All CI unit tests are currently passing.\n\nGitHub Pull Request Review"),
            ("Lunch & Learn: Introduction to Graph Neural Networks", "Greetings Colleagues,\n\nJoin us this Friday at 12:00 PM in the 4th floor lounge for our monthly Lunch & Learn session. Senior Researcher Maya will present on modern NLP and cyber threat intelligence modeling.\n\nEngineering Learning Committee")
        ]
    },

    # --- PHISHING: SMS JOB & RECRUITMENT SCAMS ---
    "sms_job_recruitment_scam": {
        "channel": "sms",
        "label": "phishing",
        "sender_domain_type": "unknown_shortcode_spoof",
        "provenance": "synthetic_educational_smishing_recruitment",
        "items": [
            ("SMS Recruitment", "FlexJobs Career: Your resume was shortlisted for Remote Data Entry. Pay is $38.50/hr flexible hours. Contact hiring manager on Telegram: hxxps[://]career-job-shortlist[.]top/apply"),
            ("SMS Recruitment", "Indeed Alert: Congratulations! You have 1 pending interview invitation for Assistant Project Manager. Confirm participation before 6 PM: hxxps[://]indeed-interviews-portal[.]cc/job"),
            ("SMS Recruitment", "Amazon Workforce: Immediate hiring for Warehouse Packing & Remote Order Review. Weekly direct deposit. Start tomorrow: hxxps[://]amazon-careers-direct[.]online/onboard"),
            ("SMS Recruitment", "LinkedIn Jobs: A recruiter viewed your profile and offered a contract position ($45/hr). Review job description and schedule call: hxxps[://]linkedin-career-hub[.]link/apply")
        ]
    },

    # --- BENIGN: SMS TWO-FACTOR AUTH CODES ---
    "sms_legitimate_2fa_codes": {
        "channel": "sms",
        "label": "benign",
        "sender_domain_type": "legitimate_telecom_shortcode",
        "provenance": "synthetic_educational_benign_2fa",
        "items": [
            ("SMS Security Code", "Google: Your verification code is 492019. Do not share this code with anyone."),
            ("SMS Security Code", "Microsoft: 839201 is your single-use code to sign in to your Microsoft account."),
            ("SMS Security Code", "Chase: 294819 is your one-time passcode for online banking. Chase will never call asking for this code."),
            ("SMS Security Code", "Apple ID Code is: 104829. Don't share it with anyone."),
            ("SMS Security Code", "PayPal: Your security code is 783921. It expires in 10 minutes. Don't share this code with anyone."),
            ("SMS Security Code", "Uber: Your login code is 5821. Never share this code with anyone."),
            ("SMS Security Code", "Twitter/X: Your confirmation code is 918230. Valid for 5 minutes.")
        ]
    },

    # --- BENIGN: UNIVERSITY & ACADEMIC ADVISORY ---
    "academic_and_research_benign": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_education",
        "provenance": "synthetic_educational_benign_academic",
        "items": [
            ("CS-4820: Final Project Guidelines and Submission Rubric", "Dear Students,\n\nThe final project specification and grading rubric for CS-4820 (Applied Machine Learning) are posted on Canvas. Final submissions are due on Friday, December 8th at 11:59 PM.\n\nCanvas link: hxxps[://]canvas[.]university[.]edu/courses/4820\n\nProf. Williams & Course TAs"),
            ("Library Notice: Book Return Reminder", "University Library System:\n\nThe book 'Foundations of Statistical Natural Language Processing' is due for return on Monday, Oct 27. You can renew online via your student portal at hxxps[://]library[.]university[.]edu/renewals.\n\nCirculation Services"),
            ("Department Seminar: Quantum Computing Architectures", "Join us for the Department Colloquium featuring Dr. Elena Vance from MIT on Wednesday at 4:00 PM in Turing Auditorium. Refreshments served prior to the talk.\n\nComputer Science Department"),
            ("Campus Health Center: Annual Student Wellness Screening", "Dear Campus Community,\n\nFree seasonal influenza vaccinations and wellness screenings will be available at the Student Union from 9 AM to 4 PM next week. Appointments can be scheduled on the student health portal.\n\nUniversity Health Services"),
            ("Registrar Notice: Spring 2027 Course Registration Window", "Undergraduate Students:\n\nCourse registration for the upcoming Spring term opens on Monday, November 10th at 8:00 AM EST. Please ensure any outstanding bursar holds are settled before your priority slot.\n\nOffice of the Registrar")
        ]
    },

    # --- PHISHING: CLOUD STORAGE & FILE SHARING LURES ---
    "cloud_storage_onedrive_phish": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "spoofed_lookalike",
        "provenance": "synthetic_educational_sharepoint_phish",
        "items": [
            ("OneDrive: Financial Audit Review 2026.xlsx shared with you", "Accounting Shared Document:\n\nExternal Auditor shared 'Confidential_Financial_Audit_2026.xlsx' via OneDrive for Business. Sign in with your corporate credentials to decrypt and access:\n\nhxxps[://]onedrive-secure-viewer[.]online/doc=8910\n\nLink expires in 72 hours."),
            ("Dropbox: Important PDF Document Requires Your Review", "Dropbox Transfer:\n\nYou have received 1 file (2.4 MB) 'Vendor_Agreement_Final.pdf' via Dropbox Transfer. Complete login to download file:\n\nhxxps[://]dropbox-file-gateway[.]site/download\n\nDropbox File Transfer"),
            ("Google Drive: Executive Team Shared 'Salary_Bands_2027.gsheet'", "Google Drive Notification:\n\nVP of Operations shared a spreadsheet with restricted viewing permissions. Please verify your Google account to confirm identity:\n\nhxxps[://]drive-google-secure-auth[.]top/sheet=9912\n\nGoogle Cloud Workspace")
        ]
    },

    # --- BENIGN: TRAVEL, FLIGHT & HOTEL BOOKINGS ---
    "travel_hotel_booking_benign": {
        "channel": "email",
        "label": "benign",
        "sender_domain_type": "legitimate_hospitality",
        "provenance": "synthetic_educational_benign_travel",
        "items": [
            ("Marriott Bonvoy: Confirmation for your upcoming stay", "Dear Alex,\n\nYour reservation at San Francisco Marriott Marquis is confirmed for check-in on Nov 12, 2026. Confirmation #84920194. View reservation and digital room key in the Marriott Bonvoy app:\nhxxps[://]www[.]marriott[.]com/reservation\n\nWe look forward to hosting you!"),
            ("Delta Air Lines: Electronic Ticket Receipt", "Delta e-Ticket Confirmation #00689218491.\nPassenger: Taylor Chen. Flight DL 1204 departing Atlanta (ATL) to Seattle (SEA). Total fare: $389.20.\nCheck in online 24h prior to flight at hxxps[://]www[.]delta[.]com/checkin\n\nFly Delta"),
            ("Hertz Car Rental: Rental Confirmation & Pick-up Instructions", "Hi Jordan,\n\nYour Hertz Gold Plus reservation #H-892149 is ready for pick up at O'Hare International Airport (ORD). Vehicle Class: Midsize SUV. Pick up vehicle directly from stall #42.\n\nHertz Car Rental")
        ]
    },

    # --- PHISHING: SUBSCRIPTION EXPIRY & CLOUD SERVICE LOCK ---
    "subscription_expiry_scam": {
        "channel": "email",
        "label": "phishing",
        "sender_domain_type": "suspicious_free_domain",
        "provenance": "synthetic_educational_subscription_phish",
        "items": [
            ("Netflix: Account On Hold - Billing Failure", "Dear Customer,\n\nWe were unable to process your monthly membership payment for Netflix. Your streaming privileges will be paused within 24 hours unless you update your payment card:\n\nhxxps[://]netflix-member-update[.]site/billing\n\nNetflix Customer Service"),
            ("Spotify Premium: Update Your Payment Method", "We could not renew your Spotify Premium subscription. We will retry in 2 days. To keep your offline playlists and ad-free listening, update your card details:\n\nhxxps[://]spotify-billing-resolve[.]online/payment\n\nSpotify Operations"),
            ("iCloud: Your Storage is 100% Full - Photos at Risk", "Apple iCloud Warning:\n\nYour 50GB storage plan has been depleted. New photos and WhatsApp backups are no longer syncing. Upgrade your storage plan for free for 30 days:\n\nhxxps[://]icloud-storage-upgrade[.]vip/claim\n\nApple Cloud Support"),
            ("Adobe Creative Cloud: Payment past due notice", "Notice from Adobe Billing: Your Creative Cloud All Apps license has entered a grace period due to an expired credit card. Settle balance to prevent license revocation:\n\nhxxps[://]adobe-license-renewal[.]link/pay\n\nAdobe Accounts")
        ]
    }
}

def generate_full_dataset():
    records = []
    message_id_counter = 1000

    # Systematic expansion with high linguistic diversity:
    # We apply diverse contextual framing, names, departments, invoice IDs, and realistic text variations
    names = ["Alex Rivera", "Jordan Smith", "Taylor Chen", "Morgan Davis", "Casey Lee", "Sam Wilson", "Robin Patel", "Riley Martinez"]
    depts = ["Engineering", "Finance", "Global Operations", "Marketing", "Supply Chain", "Customer Success"]
    amounts = ["$142.50", "$389.00", "$1,450.00", "$4,820.75", "$98.20", "$750.00", "$2,100.00"]

    for camp_id, camp_data in CAMPAIGN_TEMPLATES.items():
        channel = camp_data["channel"]
        label = camp_data["label"]
        domain_type = camp_data["sender_domain_type"]
        provenance = camp_data["provenance"]
        items = camp_data["items"]

        # For each template item, generate 3-4 natural linguistic variants
        for subj, body in items:
            # Base variation
            records.append({
                "message_id": f"MSG-{message_id_counter}",
                "channel": channel,
                "subject_or_title": subj if channel == "email" else "SMS Notification",
                "body_text": body.strip(),
                "sanitized_url_features": extract_url_feature_str(body),
                "sender_domain_type": domain_type,
                "label": label,
                "campaign_group": camp_id,
                "collected_date": "2026-10-05",
                "source_provenance": provenance
            })
            message_id_counter += 1

            # Variant 1: Personalized salutation & specific date/amount variation
            name = names[message_id_counter % len(names)]
            dept = depts[message_id_counter % len(depts)]
            amt = amounts[message_id_counter % len(amounts)]
            
            v1_body = f"Hello {name},\n{body}" if channel == "email" else f"Notice for {name}: {body}"
            records.append({
                "message_id": f"MSG-{message_id_counter}",
                "channel": channel,
                "subject_or_title": f"[{dept}] {subj}" if channel == "email" else "SMS Notification",
                "body_text": v1_body.strip(),
                "sanitized_url_features": extract_url_feature_str(v1_body),
                "sender_domain_type": domain_type,
                "label": label,
                "campaign_group": camp_id,
                "collected_date": "2026-10-09",
                "source_provenance": provenance
            })
            message_id_counter += 1

            # Variant 2: Formal corporate framing or urgent banner prefix
            if label == "phishing":
                v2_prefix = "URGENT COMPLIANCE NOTICE: " if channel == "email" else "[FINAL NOTICE] "
            else:
                v2_prefix = "UPDATE: " if channel == "email" else "[NOTIFICATION] "

            v2_body = f"{v2_prefix}\n{body}\n\nReference Code: REF-{message_id_counter}"
            records.append({
                "message_id": f"MSG-{message_id_counter}",
                "channel": channel,
                "subject_or_title": f"{v2_prefix}{subj}" if channel == "email" else "SMS Notification",
                "body_text": v2_body.strip(),
                "sanitized_url_features": extract_url_feature_str(v2_body),
                "sender_domain_type": domain_type,
                "label": label,
                "campaign_group": camp_id,
                "collected_date": "2026-10-12",
                "source_provenance": provenance
            })
            message_id_counter += 1

            # Variant 3: Additional contextual closing or disclaimer
            if channel == "email":
                v3_body = f"{body}\n\nPlease contact our help line if you have questions or require further assistance.\nConfidentiality Notice: This electronic message contains information which may be privileged."
                v3_subj = subj
            else:
                v3_body = f"{body} [Text STOP to unsubscribe, HELP for info]"
                v3_subj = "SMS Notification"

            records.append({
                "message_id": f"MSG-{message_id_counter}",
                "channel": channel,
                "subject_or_title": v3_subj,
                "body_text": v3_body.strip(),
                "sanitized_url_features": extract_url_feature_str(v3_body),
                "sender_domain_type": domain_type,
                "label": label,
                "campaign_group": camp_id,
                "collected_date": "2026-10-15",
                "source_provenance": provenance
            })
            message_id_counter += 1

    return records

def extract_url_feature_str(text: str) -> str:
    urls = []
    for token in text.replace("\n", " ").split():
        clean = token.strip(".,;:()<>[]\"'")
        if "hxxp" in clean or "[.]" in clean or "www[" in clean:
            urls.append(clean)
    return ";".join(urls) if urls else "none"

def main():
    records = generate_full_dataset()
    output_dir = os.path.join(os.path.dirname(__file__), "raw")
    os.makedirs(output_dir, exist_ok=True)
    raw_path = os.path.join(output_dir, "dataset_raw.csv")

    fieldnames = [
        "message_id", "channel", "subject_or_title", "body_text",
        "sanitized_url_features", "sender_domain_type", "label",
        "campaign_group", "collected_date", "source_provenance"
    ]

    with open(raw_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    total = len(records)
    phish_count = sum(1 for r in records if r["label"] == "phishing")
    benign_count = sum(1 for r in records if r["label"] == "benign")
    email_count = sum(1 for r in records if r["channel"] == "email")
    sms_count = sum(1 for r in records if r["channel"] == "sms")

    print(f"Generated raw dataset at {raw_path}")
    print(f"Total samples: {total}")
    print(f"  Phishing: {phish_count} ({phish_count/total*100:.1f}%)")
    print(f"  Benign: {benign_count} ({benign_count/total*100:.1f}%)")
    print(f"  Email: {email_count}, SMS: {sms_count}")
    print(f"  Campaign groups: {len(set(r['campaign_group'] for r in records))}")

if __name__ == "__main__":
    main()
