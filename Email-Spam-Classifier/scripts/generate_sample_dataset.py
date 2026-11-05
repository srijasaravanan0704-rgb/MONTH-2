import os
import sys
import json
import random
import csv
from datetime import datetime, timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.services.predictor import predictor_service

# Template components for realistic generation
PHISHING_BRANDS = [
    ("PayPal", "security-alert@paypal-login-update", ["xyz", "top", "online", "net"], "http://bit.ly/paypal-verify-now"),
    ("Chase Bank", "notice@chase-banking-support", ["xyz", "buzz", "site"], "http://tinyurl.com/chase-auth-login"),
    ("Bank of America", "fraud-detection@bofa-update-center", ["top", "cc", "club"], "http://bofa-verify-account.xyz/login"),
    ("Wells Fargo", "alert@wellsfargo-security-dept", ["top", "xyz", "info"], "http://is.gd/wellsfargo-protect"),
    ("Apple ID", "support@apple-id-cloud-security", ["online", "vip", "icu"], "http://bit.ly/appleid-confirm-device"),
    ("Netflix", "billing@netflix-member-renewal", ["club", "xyz", "site"], "http://tinyurl.com/netflix-update-billing"),
    ("Microsoft 365", "admin@microsoft365-tenant-alert", ["buzz", "xyz", "work"], "http://cutt.ly/m365-password-reset"),
    ("Amazon Prime", "order-security@amazon-payment-hold", ["top", "live", "xyz"], "http://shorturl.at/amazon-auth-check"),
    ("Google Account", "no-reply@google-account-recovery", ["xyz", "online"], "http://bit.ly/google-security-verify")
]

PHISHING_SUBJECTS = [
    "URGENT: Your {brand} Account Has Been Suspended",
    "Security Alert: Unauthorized Device Login Detected on your {brand}",
    "Action Required: Confirm Your Identity Within 24 Hours",
    "Notice: Your {brand} Access Will Be Terminated Soon",
    "Immediate Verification Needed: Suspicious Transaction on {brand}",
    "Final Warning: Update Your Billing Information Now",
    "Your {brand} Account Is Temporarily Restricted"
]

PHISHING_BODIES = [
    "Dear Valued Customer,\n\nWe detected unauthorized login attempts to your {brand} account from an unknown IP location. For your protection, account access has been restricted.\n\nPlease verify your credentials and billing details immediately by visiting our secure server:\n{link}\n\nFailure to act within 24 hours will lead to permanent account suspension.\n\nSincerely,\n{brand} Security Team",
    "Attention User,\n\nOur automated fraud monitoring system flagged suspicious activity on your {brand} profile. Your access privileges will be revoked unless you confirm your password and 2FA credentials at {link} immediately.\n\nDo not reply to this automated message.\n\n{brand} Protection Center",
    "Dear Customer,\n\nYour monthly {brand} subscription payment failed to process. To prevent service disruption and account cancellation, update your credit card information at:\n{link}\n\nThank you,\n{brand} Billing Department"
]

LOTTERY_SENDERS = [
    ("International Sweepstakes Board", "winner-office@global-prize-draw.org"),
    ("Euro Millions Foundation", "claims-agent@euromillions-payout.net"),
    ("Mega Jackpot Commission", "rewards@lottery-winner-hub.xyz"),
    ("UN Compensation Committee", "director@un-funds-disbursement.org"),
    ("Barrister Donald Williams", "barrister.williams@lawyer-estate-trust.com"),
    ("Global Promo Lottery", "agent@promo-reward-claim.info")
]

LOTTERY_SUBJECTS = [
    "CONGRATULATIONS! You have won ${amount} in our annual lottery!",
    "Official Grant Notification: ${amount} approved for release to your name",
    "Urgent: Claim your unearned inheritance of ${amount} today",
    "Winning Notice: Ticket #{num} selected for grand prize of ${amount}",
    "Confidential Payout: ${amount} transfer pending your bank details"
]

DELIVERY_SENDERS = [
    ("DHL Express", "delivery-alert@dhl-express-tracking.top", "http://dhl-express-fee.top/pay"),
    ("FedEx Courier", "parcel-notice@fedex-shipment-hub.xyz", "http://tinyurl.com/fedex-reschedule-fee"),
    ("UPS Tracking", "notification@ups-parcel-verify.online", "http://bit.ly/ups-unpaid-customs"),
    ("USPS Logistics", "service@usps-tracking-hold.buzz", "http://cutt.ly/usps-package-confirm")
]

DELIVERY_SUBJECTS = [
    "Delivery Notification: Package #{tracking} is on hold due to unpaid customs fee",
    "Action Required: Incomplete shipping address for shipment #{tracking}",
    "Parcel Alert: Redelivery fee of $3.99 required for package #{tracking}",
    "Your package #{tracking} could not be delivered today"
]

CORPORATE_SENDERS = [
    ("Sarah Jenkins", "sarah.jenkins@acmecorp.com"),
    ("David Chen", "david.chen@technova.io"),
    ("Elena Rostova", "elena.rostova@nexusgroup.com"),
    ("Michael Scott", "m.scott@dunder-enterprises.com"),
    ("Priya Sharma", "priya.s@infotechsolutions.com"),
    ("Alex Rivera", "alex.rivera@fintechglobal.org"),
    ("Marcus Brody", "marcus.brody@apexlogistics.com"),
    ("Jessica Alba", "jessica@creativeagency.co")
]

CORPORATE_SUBJECTS = [
    "Project Sync & Weekly Sprint Review Meeting",
    "Quarterly Strategy & Deliverables Deck for Q4",
    "Pull Request Review: Feature/Auth-Workflow (PR #{pr})",
    "Design System Architecture Discussion Follow-up",
    "Team All-Hands Announcement & Schedule Updates",
    "Feedback on the Proposed API Microservices Schema",
    "Budget Allocation and Tooling Subscriptions for 2027",
    "Notes from Client Stakeholder Discovery Workshop",
    "Engineering On-Call Rotation Handover for Next Week"
]

CORPORATE_BODIES = [
    "Hi Team,\n\nJust a reminder that our project sync is scheduled for tomorrow at 10:00 AM EST. Please review the attached slide deck and update your Jira tickets prior to the call.\n\nLet me know if you have any questions.\n\nBest regards,\n{sender_name}",
    "Hi everyone,\n\nPlease find the summary notes and action items from our quarterly strategy meeting earlier today. The roadmap has been shared in our confluence space.\n\nThanks for your great input!\n{sender_name}",
    "Hey team,\n\nI have submitted PR #{pr} for the backend authentication workflow. Please test the edge cases and leave your review comments by end of day tomorrow.\n\nCheers,\n{sender_name}"
]

PERSONAL_SENDERS = [
    ("Priya Kumar", "priya.kumar@gmail.com"),
    ("Karthik Raja", "karthik.raja@yahoo.com"),
    ("Ananya Sundaram", "ananya.sundaram@gmail.com"),
    ("Siddharth M", "siddharth.m@outlook.com"),
    ("Divya Balaji", "divya.balaji@gmail.com"),
    ("Vignesh R", "vignesh.r@gmail.com")
]

PERSONAL_SUBJECTS = [
    "Dinner plans this Saturday evening?",
    "Weekend road trip photos & travel itinerary",
    "Recipe for the homemade filter coffee and snacks",
    "Quick catch up: How is your new project going?",
    "Book club recommendation: The Psychology of Money",
    "Family gathering next Sunday at grandma's house",
    "Happy Birthday! Wishing you a wonderful year ahead"
]

PERSONAL_BODIES = [
    "Hey Srija,\n\nHope you're having a productive week! Are you free to meet up for dinner this Saturday around 7 PM? Let me know if that works or if another time is better.\n\nTalk soon,\n{sender_name}",
    "Hi,\n\nAttaching the photos from our weekend trip. Had so much fun! Let's plan the next trek soon.\n\nWarmly,\n{sender_name}",
    "Hello,\n\nJust wanted to check in and see how you are doing with your work. Let me know when you're free for a quick call.\n\nCheers,\n{sender_name}"
]

TRANSACTIONAL_SENDERS = [
    ("Amazon.com", "auto-confirm@amazon.com"),
    ("GitHub Notifications", "notifications@github.com"),
    ("Uber Receipts", "uber.us@uber.com"),
    ("LinkedIn", "messages-noreply@linkedin.com"),
    ("Medium Daily Digest", "digest@medium.com"),
    ("Delta Air Lines", "ticketreceipt@delta.com")
]

TRANSACTIONAL_SUBJECTS = [
    "Your Amazon.com order #{order_id} has shipped!",
    "[GitHub] Subscribed issue: Release v2.4.0 is now live",
    "Your Wednesday morning trip with Uber",
    "You have 3 new profile views this week on LinkedIn",
    "The Daily Digest: Top Stories in AI & Software Engineering",
    "Flight confirmation: E-ticket for flight DL-{flight_num}"
]

def generate_500_emails():
    emails = []
    random.seed(42) # Deterministic high quality dataset

    # 1. Phishing Emails (120 samples)
    for i in range(120):
        brand, sender_prefix, tlds, link = random.choice(PHISHING_BRANDS)
        tld = random.choice(tlds)
        sender = f"{brand.title()} Security <{sender_prefix}.{tld}>"
        subject = random.choice(PHISHING_SUBJECTS).format(brand=brand)
        body = random.choice(PHISHING_BODIES).format(brand=brand, link=link)
        emails.append({
            "category": "Phishing / Credential Theft",
            "sender": sender,
            "subject": subject,
            "body": body,
            "ground_truth": "spam"
        })

    # 2. Financial / Lottery Scams (70 samples)
    amounts = ["1,000,000", "2,500,000", "5,000,000", "750,000", "10,000,000"]
    for i in range(70):
        name, sender_email = random.choice(LOTTERY_SENDERS)
        amount = random.choice(amounts)
        num = random.randint(100000, 999999)
        sender = f"{name} <{sender_email}>"
        subject = random.choice(LOTTERY_SUBJECTS).format(amount=amount, num=num)
        body = (
            f"Dear Lucky Winner,\n\nYou have been selected as the beneficiary of ${amount} in our cash payout program.\n"
            f"Reference Batch #{num}. To process your wire transfer immediately, reply with your full bank account details "
            f"and passport copy. Processing fee of $150 applies.\n\nDo not hesitate, offer expires in 48 hours!\n\nRegards,\n{name}"
        )
        emails.append({
            "category": "Financial / Lottery Scam",
            "sender": sender,
            "subject": subject,
            "body": body,
            "ground_truth": "spam"
        })

    # 3. Delivery / Fake Invoice Scams (60 samples)
    for i in range(60):
        courier, sender_email, link = random.choice(DELIVERY_SENDERS)
        tracking = f"{random.choice(['US', 'DH', 'FX'])}-{random.randint(100000, 999999)}"
        sender = f"{courier} Alerts <{sender_email}>"
        subject = random.choice(DELIVERY_SUBJECTS).format(tracking=tracking)
        body = (
            f"Hello Customer,\n\nYour shipment {tracking} from international distribution cannot be dispatched because "
            f"a customs clearance fee of $3.99 remains unpaid.\n\nPlease visit {link} within 12 hours to update your address "
            f"and pay the invoice. Failure to pay will result in package destruction.\n\n{courier} Automated System"
        )
        emails.append({
            "category": "Fake Invoice / Delivery Scam",
            "sender": sender,
            "subject": subject,
            "body": body,
            "ground_truth": "spam"
        })

    # 4. Corporate Work Emails (130 samples)
    for i in range(130):
        name, sender_email = random.choice(CORPORATE_SENDERS)
        pr = random.randint(102, 980)
        sender = f"{name} <{sender_email}>"
        subject = random.choice(CORPORATE_SUBJECTS).format(pr=pr)
        body = random.choice(CORPORATE_BODIES).format(sender_name=name, pr=pr)
        emails.append({
            "category": "Legitimate Corporate",
            "sender": sender,
            "subject": subject,
            "body": body,
            "ground_truth": "ham"
        })

    # 5. Personal / Social Emails (60 samples)
    for i in range(60):
        name, sender_email = random.choice(PERSONAL_SENDERS)
        sender = f"{name} <{sender_email}>"
        subject = random.choice(PERSONAL_SUBJECTS)
        body = random.choice(PERSONAL_BODIES).format(sender_name=name)
        emails.append({
            "category": "Personal / Friends",
            "sender": sender,
            "subject": subject,
            "body": body,
            "ground_truth": "ham"
        })

    # 6. Transactional / Notifications (60 samples)
    for i in range(60):
        name, sender_email = random.choice(TRANSACTIONAL_SENDERS)
        order_id = random.randint(11000000, 99000000)
        flight_num = random.randint(100, 999)
        sender = f"{name} <{sender_email}>"
        subject = random.choice(TRANSACTIONAL_SUBJECTS).format(order_id=order_id, flight_num=flight_num)
        body = (
            f"Hello,\n\nThis is an automated notification regarding your account activity on {name}.\n"
            f"Reference code: #{order_id}. You can review your transaction details at any time by signing in to your verified account.\n\n"
            f"Thank you for choosing {name}."
        )
        emails.append({
            "category": "Transactional Service",
            "sender": sender,
            "subject": subject,
            "body": body,
            "ground_truth": "ham"
        })

    # Total = 120 + 70 + 60 + 130 + 60 + 60 = 500 emails!
    random.shuffle(emails)
    return emails

def main():
    print("Generating 500 diverse, realistic sample emails...")
    dataset = generate_500_emails()
    print(f"Generated {len(dataset)} emails.")

    # 1. Save to ml/dataset/sample_500_emails.csv
    csv_path = os.path.join(BASE_DIR, "ml", "dataset", "sample_500_emails.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "category", "ground_truth", "sender", "subject", "body"])
        for idx, item in enumerate(dataset, 1):
            writer.writerow([idx, item["category"], item["ground_truth"], item["sender"], item["subject"], item["body"]])
    print(f"Saved CSV to {csv_path}")

    # 2. Save to ml/dataset/sample_500_emails.json
    json_path = os.path.join(BASE_DIR, "ml", "dataset", "sample_500_emails.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"Saved JSON to {json_path}")

    # 3. Analyze all 500 emails and populate backend prediction history!
    print("Populating backend prediction history with full multi-layer analysis...")
    predictor_service.prediction_history = []
    
    start_time = datetime.now() - timedelta(days=14)
    for idx, item in enumerate(dataset):
        # Stagger timestamps across the past 14 days
        simulated_time = start_time + timedelta(minutes=idx * 40, seconds=random.randint(10, 50))
        
        # Run full prediction
        result = predictor_service.predict(
            subject=item["subject"],
            body=item["body"],
            sender=item["sender"]
        )
        
        # Override timestamp for realistic historical timeline
        predictor_service.prediction_history[-1]["timestamp"] = simulated_time.isoformat()
        if (idx + 1) % 100 == 0:
            print(f"Analyzed {idx + 1} / 500 emails...")

    predictor_service._save_history()
    print(f"Successfully populated {len(predictor_service.prediction_history)} historical records in prediction_history.json!")

if __name__ == "__main__":
    main()

