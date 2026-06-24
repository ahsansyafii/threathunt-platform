#!/usr/bin/env python3
"""
ThreatHunt - Suricata Bridge Script
====================================
Membaca log Suricata EVE JSON secara real-time dan mengirim
alert ke Supabase database.

Install: pip3 install supabase watchfiles
Jalankan: python3 suricata_bridge.py
"""

import json
import hashlib
import time
import sys
import os
import logging
from datetime import datetime, timezone

# Coba import dependencies
try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: Install dulu: pip3 install supabase")
    sys.exit(1)

# ============================================================
# KONFIGURASI — sesuaikan dengan .env web Anda
# ============================================================
SUPABASE_URL = "https://qonnvllumuhhvqpfooyk.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbm52bGx1bXVoaHZxcGZvb3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk2MjkyMCwiZXhwIjoyMDk1NTM4OTIwfQ.5SxZVfgCU5UNo39V_WoONBvfouIh2gG7wc4D5n32-18"  # Bukan anon key!
EVE_LOG_PATH = "/var/log/suricata/eve.json"
CHECK_INTERVAL_SECONDS = 1  # Seberapa sering cek file baru

# ============================================================
# LOGGING
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SURICATA-BRIDGE] %(levelname)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/var/log/suricata_bridge.log"),
    ],
)
log = logging.getLogger(__name__)


# ============================================================
# MAPPING SEVERITY
# Suricata priority: 1=high, 2=medium, 3=low (kebalikan intuisi)
# ============================================================
def map_severity(priority: int) -> str:
    if priority == 1:
        return "critical"
    elif priority == 2:
        return "high"
    elif priority == 3:
        return "medium"
    else:
        return "low"


def map_attack_type(category: str, signature: str) -> str:
    """Mapping kategori Suricata ke nama serangan yang readable."""
    sig_lower = signature.lower()
    if "ddos" in sig_lower or "flood" in sig_lower or "dos" in sig_lower:
        return "DDoS HTTP Flood" if "http" in sig_lower else "DDoS SYN Flood"
    elif "ssh" in sig_lower and ("brute" in sig_lower or "scan" in sig_lower or "auth" in sig_lower):
        return "Brute Force SSH"
    elif "ftp" in sig_lower and ("brute" in sig_lower or "login" in sig_lower):
        return "Brute Force FTP"
    elif "scan" in sig_lower or "nmap" in sig_lower or "portscan" in sig_lower:
        return "Port Scan (Nmap)"
    elif "sql" in sig_lower or "sqli" in sig_lower or "injection" in sig_lower:
        return "SQL Injection"
    elif "malware" in sig_lower or "trojan" in sig_lower or "beacon" in sig_lower or "c2" in sig_lower:
        return "Malware Beaconing"
    elif "exploit" in sig_lower or "overflow" in sig_lower:
        return "Exploit Attempt"
    elif "xss" in sig_lower or "cross-site" in sig_lower:
        return "XSS Attack"
    elif category:
        return category.replace("-", " ").title()
    else:
        return signature[:50] if signature else "Unknown Alert"


def make_dedup_hash(timestamp: str, src_ip: str, sid: int, signature: str) -> str:
    """Buat hash unik untuk mencegah insert duplikat."""
    raw = f"{timestamp}|{src_ip}|{sid}|{signature}"
    return hashlib.md5(raw.encode()).hexdigest()


def parse_eve_alert(line: str) -> dict | None:
    """Parse satu baris EVE JSON dan return dict untuk Supabase."""
    try:
        event = json.loads(line.strip())
    except json.JSONDecodeError:
        return None

    # Hanya proses event tipe "alert"
    if event.get("event_type") != "alert":
        return None

    alert_data = event.get("alert", {})
    signature = alert_data.get("signature", "")
    priority = alert_data.get("severity", 3)  # Suricata menyebutnya "severity"
    category = alert_data.get("category", "")
    sid = alert_data.get("signature_id", 0)
    gid = alert_data.get("gid", 1)
    rev = alert_data.get("rev", 0)

    src_ip = event.get("src_ip", "unknown")
    dest_ip = event.get("dest_ip", "")
    src_port = event.get("src_port")
    dest_port = event.get("dest_port")
    proto = event.get("proto", "TCP")
    timestamp_str = event.get("timestamp", datetime.now(timezone.utc).isoformat())

    severity = map_severity(priority)
    attack_type = map_attack_type(category, signature)
    dedup_hash = make_dedup_hash(timestamp_str, src_ip, sid, signature)

    return {
        "timestamp": timestamp_str,
        "severity": severity,
        "alert_type": "rule_based",
        "attack_type": attack_type,
        "source_ip": src_ip,
        "dest_ip": dest_ip,
        "source_port": src_port,
        "dest_port": dest_port,
        "protocol": proto.upper(),
        "description": f"[Suricata SID:{sid}] {signature}",
        "detection_source": "suricata",
        "status": "open",
        "suricata_sid": sid,
        "suricata_gid": gid,
        "suricata_rev": rev,
        "suricata_category": category,
        "raw_log": event,
        "dedup_hash": dedup_hash,
    }


def send_to_supabase(client: Client, alert: dict) -> bool:
    """Kirim alert ke Supabase. Return True jika berhasil."""
    try:
        result = client.table("alerts").insert(alert).execute()
        return True
    except Exception as e:
        err_str = str(e)
        if "unique constraint" in err_str or "duplicate" in err_str.lower():
            # Duplikat — skip saja, bukan error
            return True
        log.error(f"Gagal insert ke Supabase: {e}")
        return False


def update_agent_status(client: Client):
    """Update last_seen agent Suricata di Supabase."""
    try:
        client.table("agents").update({
            "status": "active",
            "last_seen": datetime.now(timezone.utc).isoformat()
        }).eq("agent_type", "suricata").execute()
    except Exception as e:
        log.warning(f"Gagal update agent status: {e}")


def tail_file(filepath: str):
    """Generator yang membaca baris baru dari file (seperti tail -f)."""
    with open(filepath, "r") as f:
        # Pindah ke akhir file
        f.seek(0, 2)
        log.info(f"Monitoring file: {filepath} (menunggu alert baru...)")
        while True:
            line = f.readline()
            if line:
                yield line
            else:
                time.sleep(CHECK_INTERVAL_SECONDS)


def main():
    log.info("=" * 60)
    log.info("ThreatHunt - Suricata Bridge v1.0")
    log.info(f"Supabase URL : {SUPABASE_URL}")
    log.info(f"EVE Log Path : {EVE_LOG_PATH}")
    log.info("=" * 60)

    # Cek file ada
    if not os.path.exists(EVE_LOG_PATH):
        log.error(f"File tidak ditemukan: {EVE_LOG_PATH}")
        log.error("Pastikan Suricata berjalan dan eve.json sudah ada.")
        sys.exit(1)

    # Koneksi ke Supabase
    try:
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        log.info("Terhubung ke Supabase!")
    except Exception as e:
        log.error(f"Gagal konek ke Supabase: {e}")
        sys.exit(1)

    alert_count = 0
    error_count = 0
    last_status_update = time.time()

    log.info("Mulai membaca log Suricata...")

    for line in tail_file(EVE_LOG_PATH):
        # Update status agent setiap 60 detik
        if time.time() - last_status_update > 60:
            update_agent_status(client)
            last_status_update = time.time()
            log.info(f"Status: {alert_count} alert terkirim, {error_count} error")

        alert = parse_eve_alert(line)
        if alert is None:
            continue

        success = send_to_supabase(client, alert)
        if success:
            alert_count += 1
            log.info(f"[{alert['severity'].upper()}] {alert['attack_type']} | {alert['source_ip']} → {alert['dest_ip']}")
        else:
            error_count += 1


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("Bridge dihentikan oleh user (Ctrl+C)")
    except Exception as e:
        log.critical(f"Bridge crash: {e}", exc_info=True)
        sys.exit(1)
