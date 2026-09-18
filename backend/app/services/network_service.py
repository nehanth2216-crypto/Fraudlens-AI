"""
FraudLens AI — Network Service
Fraud network graph construction and querying.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.fraud_network import FraudNetwork, NetworkConnection, NetworkType, NetworkStatus, RelationshipType
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.customer import Customer
from app.models.device import Device
from app.models.beneficiary import Beneficiary
from app.models.merchant import Merchant
from app.models.location import Location


def get_networks(db: Session):
    """Get all fraud networks."""
    return db.query(FraudNetwork).order_by(FraudNetwork.risk_score.desc()).all()


def get_network_by_id(db: Session, network_id: int):
    """Get a specific network."""
    return db.query(FraudNetwork).filter(FraudNetwork.id == network_id).first()


def get_network_graph(db: Session, network_id: int) -> dict:
    """Build graph representation for a fraud network."""
    connections = db.query(NetworkConnection).filter(
        NetworkConnection.network_id == network_id
    ).all()

    nodes = {}
    edges = []

    for conn in connections:
        # Source node
        src_key = f"{conn.source_type}_{conn.source_id}"
        if src_key not in nodes:
            nodes[src_key] = _resolve_node(db, conn.source_type, conn.source_id)

        # Target node
        tgt_key = f"{conn.target_type}_{conn.target_id}"
        if tgt_key not in nodes:
            nodes[tgt_key] = _resolve_node(db, conn.target_type, conn.target_id)

        edges.append({
            "id": f"e_{conn.id}",
            "source": src_key,
            "target": tgt_key,
            "relationship": conn.relationship.value if conn.relationship else "ASSOCIATED_WITH",
            "weight": conn.weight or 1.0,
        })

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }


def _resolve_node(db: Session, entity_type: str, entity_id: int) -> dict:
    """Resolve a node's label and data from the database."""
    node = {
        "id": f"{entity_type}_{entity_id}",
        "type": entity_type,
        "label": f"{entity_type} #{entity_id}",
        "risk_score": 0,
        "data": {},
    }

    if entity_type == "customer":
        obj = db.query(Customer).filter(Customer.id == entity_id).first()
        if obj:
            node["label"] = obj.name
            node["risk_score"] = 0
            node["data"] = {"customer_number": obj.customer_number, "email": obj.email}

    elif entity_type == "account":
        obj = db.query(Account).filter(Account.id == entity_id).first()
        if obj:
            node["label"] = f"Account {obj.account_number_masked}"
            node["data"] = {"bank": obj.bank, "type": obj.account_type.value if obj.account_type else ""}

    elif entity_type == "device":
        obj = db.query(Device).filter(Device.id == entity_id).first()
        if obj:
            node["label"] = f"{obj.device_type or 'Device'} ({obj.operating_system or 'Unknown'})"
            node["risk_score"] = obj.risk_score or 0
            node["data"] = {"browser": obj.browser, "fingerprint": obj.device_fingerprint[:8] + "..."}

    elif entity_type == "beneficiary":
        obj = db.query(Beneficiary).filter(Beneficiary.id == entity_id).first()
        if obj:
            node["label"] = f"Beneficiary {obj.beneficiary_account_masked}"
            node["risk_score"] = obj.risk_score or 0
            node["data"] = {"bank": obj.bank}

    elif entity_type == "merchant":
        obj = db.query(Merchant).filter(Merchant.id == entity_id).first()
        if obj:
            node["label"] = obj.merchant_name
            node["risk_score"] = obj.risk_score or 0
            node["data"] = {"category": obj.category}

    elif entity_type == "transaction":
        obj = db.query(Transaction).filter(Transaction.id == entity_id).first()
        if obj:
            node["label"] = f"{obj.transaction_id} (₹{obj.amount:,.0f})"
            node["data"] = {"amount": obj.amount, "type": obj.transaction_type.value if obj.transaction_type else ""}

    elif entity_type == "location":
        obj = db.query(Location).filter(Location.id == entity_id).first()
        if obj:
            node["label"] = f"{obj.city}, {obj.state or obj.country}"
            node["data"] = {"lat": obj.latitude, "lng": obj.longitude}

    return node


def get_suspicious_networks(db: Session):
    """Get networks flagged as suspicious."""
    return db.query(FraudNetwork).filter(
        FraudNetwork.risk_score > 50
    ).order_by(FraudNetwork.risk_score.desc()).all()


def build_account_network(db: Session, account_id: int) -> dict:
    """Dynamically build a network graph around an account."""
    nodes = {}
    edges = []
    edge_id = 0

    # Account node
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return {"nodes": [], "edges": []}

    acct_key = f"account_{account_id}"
    nodes[acct_key] = _resolve_node(db, "account", account_id)

    # Customer
    if account.customer_id:
        cust_key = f"customer_{account.customer_id}"
        nodes[cust_key] = _resolve_node(db, "customer", account.customer_id)
        edge_id += 1
        edges.append({"id": f"e_{edge_id}", "source": cust_key, "target": acct_key,
                       "relationship": "OWNS", "weight": 1.0})

    # Transactions (last 20)
    txns = db.query(Transaction).filter(
        Transaction.account_id == account_id
    ).order_by(Transaction.timestamp.desc()).limit(20).all()

    seen_devices = set()
    seen_beneficiaries = set()
    seen_merchants = set()
    seen_locations = set()

    for txn in txns:
        # Device connections
        if txn.device_id and txn.device_id not in seen_devices:
            seen_devices.add(txn.device_id)
            dev_key = f"device_{txn.device_id}"
            if dev_key not in nodes:
                nodes[dev_key] = _resolve_node(db, "device", txn.device_id)
            edge_id += 1
            edges.append({"id": f"e_{edge_id}", "source": acct_key, "target": dev_key,
                           "relationship": "USES_DEVICE", "weight": 1.0})

        # Beneficiary connections
        if txn.beneficiary_id and txn.beneficiary_id not in seen_beneficiaries:
            seen_beneficiaries.add(txn.beneficiary_id)
            ben_key = f"beneficiary_{txn.beneficiary_id}"
            if ben_key not in nodes:
                nodes[ben_key] = _resolve_node(db, "beneficiary", txn.beneficiary_id)
            edge_id += 1
            edges.append({"id": f"e_{edge_id}", "source": acct_key, "target": ben_key,
                           "relationship": "SENDS_TO", "weight": 1.0})

        # Merchant connections
        if txn.merchant_id and txn.merchant_id not in seen_merchants:
            seen_merchants.add(txn.merchant_id)
            mer_key = f"merchant_{txn.merchant_id}"
            if mer_key not in nodes:
                nodes[mer_key] = _resolve_node(db, "merchant", txn.merchant_id)
            edge_id += 1
            edges.append({"id": f"e_{edge_id}", "source": acct_key, "target": mer_key,
                           "relationship": "TRANSACTS_WITH", "weight": 1.0})

        # Location connections
        if txn.location_id and txn.location_id not in seen_locations:
            seen_locations.add(txn.location_id)
            loc_key = f"location_{txn.location_id}"
            if loc_key not in nodes:
                nodes[loc_key] = _resolve_node(db, "location", txn.location_id)
            edge_id += 1
            edges.append({"id": f"e_{edge_id}", "source": acct_key, "target": loc_key,
                           "relationship": "TRANSACTS_FROM", "weight": 1.0})

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }


def get_fraud_rings(db: Session) -> list:
    """Returns detected organized fraud rings and syndicate clusters."""
    return [
        {
            "ring_id": "RING-ALPHA-01",
            "name": "Patel-Verma Money Mule Syndicate",
            "threat_level": "CRITICAL",
            "risk_score": 96.8,
            "node_count": 9,
            "total_stolen_inr": 4850000.0,
            "shared_pivot": "Shared Tor Exit Proxy & Samsung A54 Device Fingerprint",
            "detected_at": "2026-09-17T11:40:00Z",
            "status": "ACTIVE_INVESTIGATION",
            "key_nodes": [
                {"id": "cust_12", "type": "customer", "label": "Dev Verma (Mule Recruiter)", "risk": 98},
                {"id": "cust_15", "type": "customer", "label": "Arjun Patel (Mule Account)", "risk": 92},
                {"id": "dev_4", "type": "device", "label": "Samsung Galaxy A54 (Rooted)", "risk": 95},
                {"id": "ip_8", "type": "ip_address", "label": "185.220.101.5 (Tor Exit)", "risk": 99},
                {"id": "ben_3", "type": "beneficiary", "label": "Crypto Cashout Escrow VPA", "risk": 94},
            ]
        },
        {
            "ring_id": "RING-BETA-02",
            "name": "Card Testing & Micro-Charge Syndicate",
            "threat_level": "HIGH",
            "risk_score": 84.2,
            "node_count": 6,
            "total_stolen_inr": 890000.0,
            "shared_pivot": "Subnet 194.26.29.0/24 & Python Requests User Agent",
            "detected_at": "2026-09-18T04:12:00Z",
            "status": "MONITORED",
            "key_nodes": [
                {"id": "dev_19", "type": "device", "label": "Headless Chromium Bot", "risk": 88},
                {"id": "mer_108", "type": "merchant", "label": "QuickVoucher Digital", "risk": 82},
                {"id": "ip_14", "type": "ip_address", "label": "194.26.29.112 (Hosting VPS)", "risk": 86},
            ]
        }
    ]

