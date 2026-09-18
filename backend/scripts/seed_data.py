"""
FraudLens AI — Synthetic Data Seeder
Generates realistic demo data: 100+ customers, 150+ accounts,
1000+ transactions, devices, beneficiaries, merchants, networks.
"""

import sys
import os
import io

if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


import random
import uuid
import hashlib
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import *

# Import enums
from app.models.user import UserRole, UserStatus
from app.models.customer import RiskLevel
from app.models.account import AccountType, AccountStatus
from app.models.transaction import TransactionType, PaymentMethod, TransactionStatus
from app.models.risk_score import RiskLevel as RiskLevelEnum, RiskDecision
from app.models.fraud_alert import AlertType, AlertSeverity, AlertStatus
from app.models.investigation import InvestigationPriority, InvestigationStatus
from app.models.beneficiary import BeneficiaryStatus
from app.models.merchant import MerchantStatus
from app.models.fraud_network import NetworkType, NetworkStatus, RelationshipType

from app.services.auth_service import hash_password

random.seed(42)

# Demo data constants
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Arnav",
    "Dhruv", "Kabir", "Ananya", "Saanvi", "Aanya", "Isha", "Pari", "Diya",
    "Myra", "Sara", "Riya", "Priya", "Rohan", "Karan", "Rahul", "Amit",
    "Suresh", "Rajesh", "Neha", "Pooja", "Sunita", "Kavita", "Dev", "Raj",
    "Vikram", "Sanjay", "Manish", "Nikhil", "Deepak", "Ajay", "Mohit", "Gaurav",
    "Meera", "Nidhi", "Swati", "Pallavi", "Shreya", "Tanvi", "Divya", "Komal",
    "Harsha", "Pranav",
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Reddy",
    "Mehta", "Joshi", "Rao", "Nair", "Pillai", "Menon", "Iyer", "Desai",
    "Malhotra", "Kapoor", "Chopra", "Banerjee", "Mukherjee", "Das", "Ghosh",
    "Bose", "Chatterjee", "Srinivasan", "Venkatesh", "Agarwal", "Tiwari", "Mishra",
]

BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
         "Kotak Mahindra", "Punjab National Bank", "Bank of Baroda",
         "Yes Bank", "IndusInd Bank", "Federal Bank"]

CITIES = [
    ("Mumbai", "Maharashtra", 19.076, 72.8777),
    ("Delhi", "Delhi", 28.7041, 77.1025),
    ("Bangalore", "Karnataka", 12.9716, 77.5946),
    ("Hyderabad", "Telangana", 17.385, 78.4867),
    ("Chennai", "Tamil Nadu", 13.0827, 80.2707),
    ("Kolkata", "West Bengal", 22.5726, 88.3639),
    ("Pune", "Maharashtra", 18.5204, 73.8567),
    ("Ahmedabad", "Gujarat", 23.0225, 72.5714),
    ("Jaipur", "Rajasthan", 26.9124, 75.7873),
    ("Lucknow", "Uttar Pradesh", 26.8467, 80.9462),
    ("Chandigarh", "Chandigarh", 30.7333, 76.7794),
    ("Kochi", "Kerala", 9.9312, 76.2673),
    ("Indore", "Madhya Pradesh", 22.7196, 75.8577),
    ("Bhopal", "Madhya Pradesh", 23.2599, 77.4126),
    ("Nagpur", "Maharashtra", 21.1458, 79.0882),
    ("Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185),
    ("Coimbatore", "Tamil Nadu", 11.0168, 76.9558),
    ("Thiruvananthapuram", "Kerala", 8.5241, 76.9366),
    ("Guwahati", "Assam", 26.1445, 91.7362),
    ("Surat", "Gujarat", 21.1702, 72.8311),
]

MERCHANT_CATEGORIES = [
    "Electronics", "Grocery", "Fashion", "Fuel", "Restaurant",
    "Travel", "Healthcare", "Entertainment", "Insurance", "Education",
    "Jewelry", "Home Appliances", "Gaming", "Subscription", "Utilities",
]

DEVICE_TYPES = ["mobile", "desktop", "tablet"]
OS_TYPES = ["Android 14", "iOS 18", "Windows 11", "macOS 15", "Linux", "Android 13", "iOS 17"]
BROWSERS = ["Chrome 128", "Safari 18", "Firefox 130", "Edge 128", "Opera 112", "Samsung Browser"]


def seed():
    """Main seeding function."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🌱 Seeding FraudLens AI database...")

        # Check if data already exists
        if db.query(User).first():
            print("⚠️  Data already exists. Skipping seed.")
            return

        # 1. Create demo users
        print("  Creating users...")
        users = [
            User(name="Admin User", email="admin@fraudlens.ai",
                 password_hash=hash_password("admin123"), role=UserRole.ADMIN, status=UserStatus.ACTIVE),
            User(name="Sarah Chen", email="analyst@fraudlens.ai",
                 password_hash=hash_password("analyst123"), role=UserRole.FRAUD_ANALYST, status=UserStatus.ACTIVE),
            User(name="James Wilson", email="investigator@fraudlens.ai",
                 password_hash=hash_password("invest123"), role=UserRole.INVESTIGATOR, status=UserStatus.ACTIVE),
            User(name="Demo Viewer", email="viewer@fraudlens.ai",
                 password_hash=hash_password("viewer123"), role=UserRole.VIEWER, status=UserStatus.ACTIVE),
        ]
        db.add_all(users)
        db.flush()

        # 2. Create locations
        print("  Creating locations...")
        locations = []
        for city, state, lat, lng in CITIES:
            loc = Location(city=city, state=state, country="India",
                           latitude=lat + random.uniform(-0.05, 0.05),
                           longitude=lng + random.uniform(-0.05, 0.05))
            locations.append(loc)
        db.add_all(locations)
        db.flush()

        # 3. Create devices
        print("  Creating devices...")
        devices = []
        for i in range(40):
            dev = Device(
                device_fingerprint=hashlib.sha256(f"device_{i}_{uuid.uuid4().hex}".encode()).hexdigest(),
                device_type=random.choice(DEVICE_TYPES),
                operating_system=random.choice(OS_TYPES),
                browser=random.choice(BROWSERS),
                first_seen=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
                last_seen=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                risk_score=random.choice([0, 0, 0, 10, 20, 30, 50, 70, 85]),
            )
            devices.append(dev)
        db.add_all(devices)
        db.flush()

        # 4. Create IP addresses
        print("  Creating IP addresses...")
        ip_addresses = []
        for i in range(30):
            ip = IPAddress(
                ip_hash=hashlib.sha256(f"ip_{i}_{random.randint(1,255)}.{random.randint(1,255)}".encode()).hexdigest(),
                country="India",
                region=random.choice([c[1] for c in CITIES]),
                first_seen=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
                last_seen=datetime.utcnow(),
                risk_score=random.choice([0, 0, 0, 15, 30, 45, 60]),
            )
            ip_addresses.append(ip)
        db.add_all(ip_addresses)
        db.flush()

        # 5. Create merchants
        print("  Creating merchants...")
        merchants = []
        merchant_names = [
            "TechMart Electronics", "FreshBasket Grocery", "StyleHub Fashion",
            "PetroIndia Fuels", "Spice Junction", "TravelEase", "MedPlus Pharmacy",
            "CinePlex Entertainment", "SecureLife Insurance", "EduPro Academy",
            "Gemstone Jewelers", "HomeComfort Appliances", "GameZone Hub",
            "StreamPlus Subscription", "PowerGrid Utilities", "QuickBite Cafe",
            "AutoParts Hub", "BookWorld Store", "FitLife Gym", "CloudServe IT",
            "GreenGrocers", "FastTrack Courier", "Mega Mall", "Urban Bazar",
            "Royal Dining", "TechWiz Solutions", "SmartBuy Online", "Heritage Crafts",
            "SkyHigh Airlines", "Metro Transit", "LuxeWear Boutique", "PureHealth Lab",
            "StarBucks Cafe", "Digital Dreams Store", "Fresh Farms Market",
            "Crypto Exchange XYZ", "Unknown Merchant", "Offshore Trading Co",
            "NightOwl Casino", "QuickCash Services",
        ]
        for i, name in enumerate(merchant_names):
            m = Merchant(
                merchant_id=f"MER{i+1:04d}",
                merchant_name=name,
                category=random.choice(MERCHANT_CATEGORIES),
                location_id=random.choice(locations).id,
                risk_score=random.choice([0, 0, 5, 10, 15]) if i < 35 else random.choice([40, 60, 75, 85]),
                status=MerchantStatus.ACTIVE if i < 35 else random.choice([MerchantStatus.ACTIVE, MerchantStatus.SUSPENDED]),
            )
            merchants.append(m)
        db.add_all(merchants)
        db.flush()

        # 6. Create customers
        print("  Creating customers...")
        customers = []
        for i in range(110):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            c = Customer(
                customer_number=f"CUS{i+1:05d}",
                name=f"{fname} {lname}",
                email=f"{fname.lower()}.{lname.lower()}{random.randint(1,99)}@email.com",
                phone=f"+91{random.randint(7000000000, 9999999999)}",
                date_of_birth=datetime(random.randint(1970, 2002), random.randint(1, 12),
                                       random.randint(1, 28)).date(),
                account_created_at=datetime.utcnow() - timedelta(days=random.randint(30, 1800)),
                risk_level=random.choices(
                    [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL],
                    weights=[60, 25, 10, 5]
                )[0],
            )
            customers.append(c)
        db.add_all(customers)
        db.flush()

        # 7. Create accounts
        print("  Creating accounts...")
        accounts = []
        for i, cust in enumerate(customers):
            num_accounts = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
            for j in range(num_accounts):
                acc = Account(
                    customer_id=cust.id,
                    account_number_masked=f"XXXX{random.randint(1000, 9999)}",
                    account_type=random.choice(list(AccountType)),
                    bank=random.choice(BANKS),
                    balance=round(random.uniform(5000, 500000), 2),
                    currency="INR",
                    status=AccountStatus.ACTIVE,
                    created_at=cust.account_created_at or (datetime.utcnow() - timedelta(days=random.randint(30, 1000))),
                )
                accounts.append(acc)
        db.add_all(accounts)
        db.flush()
        print(f"  Created {len(accounts)} accounts")

        # 8. Create beneficiaries
        print("  Creating beneficiaries...")
        beneficiaries = []
        for acc in accounts:
            num_bens = random.randint(1, 5)
            for _ in range(num_bens):
                b = Beneficiary(
                    account_id=acc.id,
                    beneficiary_account_masked=f"XXXX{random.randint(1000, 9999)}",
                    bank=random.choice(BANKS),
                    first_added=acc.created_at + timedelta(days=random.randint(1, 180)),
                    transaction_count=random.randint(0, 50),
                    risk_score=random.choice([0, 0, 0, 10, 20, 30, 50, 70]),
                    status=BeneficiaryStatus.ACTIVE,
                )
                beneficiaries.append(b)
        db.add_all(beneficiaries)
        db.flush()

        # 9. Create transactions (1200+)
        print("  Creating transactions...")
        now = datetime.utcnow()
        transactions = []
        risk_scores_list = []
        predictions_list = []
        features_list = []
        alerts_list = []

        for i in range(1200):
            acc = random.choice(accounts)
            is_suspicious = random.random() < 0.12  # ~12% suspicious

            # Normal transaction parameters
            if not is_suspicious:
                amount = round(random.uniform(100, 25000), 2)
                hour = random.randint(8, 21)
                device = random.choice(devices[:30])  # Known devices
                ben = random.choice([b for b in beneficiaries if b.account_id == acc.id] or beneficiaries[:5])
                merchant = random.choice(merchants[:35])  # Normal merchants
                location = random.choice(locations[:10])  # Normal locations
            else:
                # Suspicious transaction parameters
                amount = round(random.uniform(50000, 500000), 2)
                hour = random.choice([0, 1, 2, 3, 4, 23])
                device = random.choice(devices[30:])  # New/suspicious devices
                ben = random.choice(beneficiaries[-20:])  # New beneficiaries
                merchant = random.choice(merchants[35:])  # Suspicious merchants
                location = random.choice(locations[10:])  # Unusual locations

            ts = now - timedelta(
                days=random.randint(0, 60),
                hours=random.randint(0, 23) if not is_suspicious else 0,
                minutes=random.randint(0, 59),
            )
            ts = ts.replace(hour=hour, minute=random.randint(0, 59))

            txn = Transaction(
                transaction_id=f"TXN{i+10001:05d}",
                account_id=acc.id,
                beneficiary_id=ben.id if random.random() > 0.3 else None,
                merchant_id=merchant.id if random.random() > 0.2 else None,
                amount=amount,
                currency="INR",
                transaction_type=random.choice(list(TransactionType)),
                payment_method=random.choice(list(PaymentMethod)),
                timestamp=ts,
                location_id=location.id,
                device_id=device.id,
                ip_address_id=random.choice(ip_addresses).id,
                status=TransactionStatus.COMPLETED if not is_suspicious else random.choice(
                    [TransactionStatus.HELD, TransactionStatus.PENDING]
                ),
            )
            transactions.append(txn)

        db.add_all(transactions)
        db.flush()

        # 10. Create risk scores and predictions for transactions
        print("  Creating risk scores and predictions...")
        import json as json_mod

        for txn in transactions:
            is_high_risk = txn.status in (TransactionStatus.HELD, TransactionStatus.PENDING)

            if is_high_risk:
                ml_score = round(random.uniform(60, 98), 2)
                anomaly_score = round(random.uniform(55, 95), 2)
                behavior_score = round(random.uniform(50, 90), 2)
                rule_score = round(random.uniform(45, 85), 2)
                fraud_prob = round(random.uniform(0.6, 0.98), 4)
            else:
                ml_score = round(random.uniform(0, 35), 2)
                anomaly_score = round(random.uniform(0, 30), 2)
                behavior_score = round(random.uniform(0, 25), 2)
                rule_score = round(random.uniform(0, 20), 2)
                fraud_prob = round(random.uniform(0.01, 0.3), 4)

            final_score = round(
                ml_score * 0.35 + anomaly_score * 0.25 +
                behavior_score * 0.25 + rule_score * 0.15, 1
            )

            if final_score <= 30:
                risk_level = RiskLevelEnum.LOW
                decision = RiskDecision.APPROVE
            elif final_score <= 60:
                risk_level = RiskLevelEnum.MEDIUM
                decision = RiskDecision.VERIFY
            elif final_score <= 80:
                risk_level = RiskLevelEnum.HIGH
                decision = RiskDecision.REVIEW
            else:
                risk_level = RiskLevelEnum.CRITICAL
                decision = RiskDecision.HOLD

            reasons = []
            if is_high_risk:
                possible_reasons = [
                    "Transaction amount significantly exceeds historical average",
                    "New/unrecognized device detected for this account",
                    "Transaction to a new/unrecognized beneficiary",
                    f"Transaction occurred at unusual hour ({txn.timestamp.hour}:00)",
                    "Transaction location differs from historical pattern",
                    "High transaction velocity detected",
                    "Multiple concurrent risk signals detected",
                    "Machine learning model indicates high fraud probability",
                    "Anomaly detection flagged this transaction as statistically unusual",
                    "Transaction deviates from customer's established behavioral pattern",
                ]
                reasons = random.sample(possible_reasons, random.randint(2, 5))

            risk = RiskScore(
                transaction_id=txn.id,
                ml_score=ml_score, anomaly_score=anomaly_score,
                behavior_score=behavior_score, rule_score=rule_score,
                final_score=final_score, risk_level=risk_level,
                decision=decision, reasons=json_mod.dumps(reasons),
            )
            risk_scores_list.append(risk)

            pred = FraudPrediction(
                transaction_id=txn.id,
                model_version="v1.0",
                fraud_probability=fraud_prob,
                fraud_prediction=fraud_prob >= 0.5,
                anomaly_score=anomaly_score / 100,
                prediction_time=round(random.uniform(10, 80), 2),
            )
            predictions_list.append(pred)

            feat = TransactionFeature(
                transaction_id=txn.id,
                amount_deviation=round(random.uniform(0, 8) if is_high_risk else random.uniform(0, 2), 4),
                velocity_score=round(random.uniform(0.3, 0.9) if is_high_risk else random.uniform(0, 0.3), 4),
                location_deviation=round(random.choice([0.8, 1.0]) if is_high_risk else random.choice([0, 0, 0.3]), 4),
                device_change=round(random.choice([0.8, 1.0]) if is_high_risk else random.choice([0, 0, 0.2]), 4),
                beneficiary_change=round(random.choice([0.8, 1.0]) if is_high_risk else random.choice([0, 0, 0.2]), 4),
                time_anomaly=round(random.uniform(0.5, 0.9) if is_high_risk else random.uniform(0, 0.3), 4),
                merchant_frequency=round(random.uniform(0.5, 1.0) if is_high_risk else random.uniform(0, 0.4), 4),
                account_age_days=random.randint(5, 60) if is_high_risk else random.randint(60, 1000),
                previous_avg_amount=round(random.uniform(5000, 30000), 2),
                transactions_last_hour=random.randint(3, 8) if is_high_risk else random.randint(0, 2),
                transactions_last_day=random.randint(10, 25) if is_high_risk else random.randint(0, 8),
            )
            features_list.append(feat)

            # Create alerts for high/critical risk
            if risk_level in (RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL):
                severity = AlertSeverity.CRITICAL if risk_level == RiskLevelEnum.CRITICAL else AlertSeverity.HIGH
                alert = FraudAlert(
                    transaction_id=txn.id,
                    alert_type=AlertType.HIGH_RISK_TRANSACTION,
                    severity=severity,
                    title=f"High-Risk Transaction: {txn.transaction_id}",
                    description=f"₹{txn.amount:,.0f} flagged with score {final_score}/100. {'; '.join(reasons[:2])}",
                    status=random.choice([AlertStatus.OPEN, AlertStatus.OPEN, AlertStatus.INVESTIGATING]),
                    assigned_to=random.choice([users[1].id, users[2].id]) if random.random() > 0.4 else None,
                )
                alerts_list.append(alert)

        db.add_all(risk_scores_list)
        db.add_all(predictions_list)
        db.add_all(features_list)
        db.add_all(alerts_list)
        db.flush()

        # 11. Create investigations
        print("  Creating investigations...")
        investigations = []
        for alert in alerts_list[:30]:  # Create investigations for first 30 alerts
            inv = Investigation(
                alert_id=alert.id,
                investigator_id=random.choice([users[1].id, users[2].id]),
                priority=InvestigationPriority.CRITICAL if alert.severity == AlertSeverity.CRITICAL else InvestigationPriority.HIGH,
                status=random.choice([InvestigationStatus.OPEN, InvestigationStatus.IN_PROGRESS, InvestigationStatus.CLOSED]),
                notes=random.choice([
                    "Initial review completed. Transaction pattern matches known fraud indicators.",
                    "Customer contacted. Awaiting verification.",
                    "Device fingerprint matches previously flagged device.",
                    "Beneficiary account linked to multiple suspicious transactions.",
                    "Location anomaly confirmed. Transaction origin inconsistent with profile.",
                    None,
                ]),
                resolution="Confirmed fraudulent activity. Account flagged." if random.random() > 0.7 else None,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            )
            if inv.status == InvestigationStatus.CLOSED:
                inv.closed_at = inv.created_at + timedelta(days=random.randint(1, 7))
                inv.resolution = inv.resolution or "Reviewed and cleared after verification."
            investigations.append(inv)
        db.add_all(investigations)

        # 12. Create fraud networks
        print("  Creating fraud networks...")
        networks = [
            FraudNetwork(network_name="Device Sharing Ring A", network_type=NetworkType.DEVICE_SHARING,
                         risk_score=78, status=NetworkStatus.UNDER_INVESTIGATION),
            FraudNetwork(network_name="Beneficiary Chain B", network_type=NetworkType.BENEFICIARY_RING,
                         risk_score=85, status=NetworkStatus.ACTIVE),
            FraudNetwork(network_name="IP Cluster C", network_type=NetworkType.IP_SHARING,
                         risk_score=62, status=NetworkStatus.ACTIVE),
            FraudNetwork(network_name="Transaction Chain D", network_type=NetworkType.TRANSACTION_CHAIN,
                         risk_score=91, status=NetworkStatus.CONFIRMED_FRAUD),
            FraudNetwork(network_name="Mixed Network E", network_type=NetworkType.MIXED,
                         risk_score=55, status=NetworkStatus.ACTIVE),
        ]
        db.add_all(networks)
        db.flush()

        # Create network connections
        connections = []
        for net in networks:
            num_connections = random.randint(5, 15)
            used_pairs = set()
            for _ in range(num_connections):
                src_type = random.choice(["customer", "account", "device"])
                tgt_type = random.choice(["account", "device", "beneficiary", "merchant"])

                src_id = random.randint(1, min(len(customers), 30))
                tgt_id = random.randint(1, min(len(accounts), 30))

                pair = (src_type, src_id, tgt_type, tgt_id)
                if pair in used_pairs:
                    continue
                used_pairs.add(pair)

                rel_map = {
                    ("customer", "account"): RelationshipType.ASSOCIATED_WITH,
                    ("customer", "device"): RelationshipType.USES_DEVICE,
                    ("account", "device"): RelationshipType.USES_DEVICE,
                    ("account", "beneficiary"): RelationshipType.SENDS_TO,
                    ("device", "account"): RelationshipType.USES_DEVICE,
                    ("account", "merchant"): RelationshipType.TRANSACTS_WITH,
                }
                rel = rel_map.get((src_type, tgt_type), RelationshipType.ASSOCIATED_WITH)

                conn = NetworkConnection(
                    network_id=net.id,
                    source_type=src_type, source_id=src_id,
                    target_type=tgt_type, target_id=tgt_id,
                    relationship=rel,
                    weight=round(random.uniform(0.3, 1.0), 2),
                )
                connections.append(conn)
        db.add_all(connections)

        db.commit()

        print(f"""
✅ FraudLens AI — Database seeded successfully!

Summary:
  Users:          {len(users)}
  Customers:      {len(customers)}
  Accounts:       {len(accounts)}
  Transactions:   {len(transactions)}
  Devices:        {len(devices)}
  Beneficiaries:  {len(beneficiaries)}
  Merchants:      {len(merchants)}
  Locations:      {len(locations)}
  IP Addresses:   {len(ip_addresses)}
  Risk Scores:    {len(risk_scores_list)}
  Fraud Alerts:   {len(alerts_list)}
  Investigations: {len(investigations)}
  Networks:       {len(networks)}
  Connections:    {len(connections)}

Demo Credentials:
  Admin:        admin@fraudlens.ai / admin123
  Analyst:      analyst@fraudlens.ai / analyst123
  Investigator: investigator@fraudlens.ai / invest123
  Viewer:       viewer@fraudlens.ai / viewer123
""")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
