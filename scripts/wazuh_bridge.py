#!/usr/bin/env python3
"""
ThreatHunt - Wazuh Bridge (via OpenSearch API)
================================================
Mengambil alert dari Wazuh menggunakan OpenSearch REST API,
lalu mengirim ke Supabase secara real-time.

Install : pip3 install supabase requests
Jalankan: sudo python3 wazuh_bridge.py
"""

import json
import hashlib
import time
import sys
import logging
import urllib3
from datetime import datetime, timezone, timedelta

try:
    import requests
    from supabase import create_client
except ImportError:
    print("ERROR: Jalankan dulu: pip3 install supabase requests")
    sys.exit(1)

# Matikan warning SSL (karena Wazuh pakai self-signed certificate)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ============================================================
# KONFIGURASI — sudah disesuaikan dengan setup Anda
# ============================================================
WAZUH_HOST          = "https://192.168.0.103"
# Pakai localhost karena script jalan di mesin yang sama dengan Wazuh
OPENSEARCH_HOST     = "https://localhost:9200"
OPENSEARCH_USER     = "admin"
OPENSEARCH_PASS     = "Admin123*"

SUPABASE_URL        = "https://qonnvllumuhhvqpfooyk.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbm52bGx1bXVoaHZxcGZvb3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk2MjkyMCwiZXhwIjoyMDk1NTM4OTIwfQ.5SxZVfgCU5UNo39V_WoONBvfouIh2gG7wc4D5n32-18"  # ← Ganti ini!

POLL_INTERVAL_SEC   = 5    # Ambil alert baru setiap 5 detik
ALERT_INDEX         = "wazuh-alerts-*"  # Index OpenSearch Wazuh

# ============================================================
# LOGGING
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WAZUH-BRIDGE] %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ============================================================
# MAPPING SEVERITY
# Wazuh level: 1-6=low, 7-11=medium, 12-14=high, 15=critical
# ============================================================
def map_severity(level: int) -> str:
    if level >= 15:
        return "critical"
    elif level >= 12:
        return "high"
    elif level >= 7:
        return "medium"
    else:
        return "low"


def map_attack_type(rule: dict) -> str:
    """Mapping Wazuh rule ke nama serangan."""
    groups     = rule.get("groups", [])
    desc       = rule.get("description", "").lower()
    rule_id    = rule.get("id", "0")

    if "authentication_failed" in groups or "authentication_failures" in groups:
        if "ssh"  in desc: return "Brute Force SSH"
        if "ftp"  in desc: return "Brute Force FTP"
        if "rdp"  in desc: return "Brute Force RDP"
        return "Brute Force Attack"
    if "web" in groups and ("attack" in groups or "sql_injection" in groups):
        if "sql"   in desc: return "SQL Injection"
        if "xss"   in desc: return "XSS Attack"
        return "Web Attack"
    if "malware" in groups or "virus" in groups:
        return "Malware Beaconing"
    if "scan"   in groups or "recon" in groups:
        return "Port Scanning"
    if "dos"    in groups or "ddos" in groups:
        return "DDoS Attack"
    if "rootkit" in groups:
        return "Rootkit Detected"
    if "syscheck" in groups:
        return "File Integrity Violation"
    if "brute" in desc or "multiple failed" in desc:
        return "Brute Force Attack"
    if "sql"   in desc: return "SQL Injection"
    if "scan"  in desc: return "Port Scan (Nmap)"
    if "malware" in desc: return "Malware Beaconing"
    return rule.get("description", f"Wazuh Rule {rule_id}")[:60]


def make_hash(*args) -> str:
    raw = "|".join(str(a) for a in args)
    return hashlib.md5(raw.encode()).hexdigest()


# ============================================================
# QUERY OPENSEARCH — ambil alert baru sejak timestamp tertentu
# ============================================================
def fetch_alerts_since(since: datetime) -> list:
    """Ambil alert dari OpenSearch yang timestamp-nya lebih baru dari `since`."""
    since_str = since.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    query = {
        "size": 100,
        "sort": [{"timestamp": {"order": "asc"}}],
        "query": {
            "bool": {
                "filter": [
                    {"range": {"timestamp": {"gte": since_str}}}
                ]
            }
        }
    }

    url = f"{OPENSEARCH_HOST}/{ALERT_INDEX}/_search"
    try:
        resp = requests.post(
            url,
            auth=(OPENSEARCH_USER, OPENSEARCH_PASS),
            json=query,
            verify=False,   # self-signed cert
            timeout=10,
        )
        resp.raise_for_status()
        hits = resp.json().get("hits", {}).get("hits", [])
        return hits
    except requests.exceptions.ConnectionError:
        log.warning("Tidak bisa konek ke OpenSearch — coba lagi...")
        return []
    except Exception as e:
        log.error(f"Error query OpenSearch: {e}")
        return []


def parse_hit(hit: dict) -> dict | None:
    """Konversi satu hit OpenSearch ke format Supabase."""
    src        = hit.get("_source", {})
    rule       = src.get("rule", {})
    agent      = src.get("agent", {})
    data       = src.get("data", {})
    timestamp  = src.get("timestamp", datetime.now(timezone.utc).isoformat())

    rule_id    = rule.get("id", "0")
    rule_level = int(rule.get("level", 1))
    agent_id   = agent.get("id", "000")
    agent_name = agent.get("name", "unknown")

    # Cari source IP
    src_ip = (
        data.get("srcip") or
        data.get("src_ip") or
        data.get("remote_ip") or
        agent.get("ip") or
        "unknown"
    )
    dest_ip  = data.get("dstip") or data.get("dest_ip") or ""

    src_port  = None
    dest_port = None
    try:
        sp = data.get("srcport") or data.get("src_port")
        dp = data.get("dstport") or data.get("dest_port")
        if sp: src_port  = int(sp)
        if dp: dest_port = int(dp)
    except (ValueError, TypeError):
        pass

    severity    = map_severity(rule_level)
    attack_type = map_attack_type(rule)
    dedup_hash  = make_hash(timestamp, src_ip, rule_id, agent_id)

    return {
        "timestamp":          timestamp,
        "severity":           severity,
        "alert_type":         "rule_based",
        "attack_type":        attack_type,
        "source_ip":          src_ip,
        "dest_ip":            dest_ip or None,
        "source_port":        src_port,
        "dest_port":          dest_port,
        "protocol":           "TCP",
        "description":        f"[Wazuh Rule {rule_id}] Level {rule_level}: {rule.get('description', '')}",
        "detection_source":   "wazuh",
        "status":             "open",
        "wazuh_rule_id":      int(rule_id) if str(rule_id).isdigit() else None,
        "wazuh_rule_level":   rule_level,
        "wazuh_agent_id":     agent_id,
        "wazuh_agent_name":   agent_name,
        "raw_log":            src,
        "dedup_hash":         dedup_hash,
    }


def upsert_agent(client, name: str, ip: str, agent_id: str):
    try:
        client.table("agents").upsert({
            "name":       f"wazuh-{name}",
            "agent_type": "wazuh_agent" if agent_id != "000" else "wazuh_manager",
            "host_ip":    ip or "unknown",
            "status":     "active",
            "last_seen":  datetime.now(timezone.utc).isoformat(),
        }, on_conflict="name").execute()
    except Exception as e:
        log.warning(f"Gagal upsert agent: {e}")


def send_to_supabase(client, alert: dict) -> bool:
    try:
        client.table("alerts").insert(alert).execute()
        return True
    except Exception as e:
        err = str(e)
        if "unique" in err or "duplicate" in err.lower():
            return True   # duplikat, skip
        log.error(f"Gagal insert Supabase: {e}")
        return False


# ============================================================
# TEST KONEKSI
# ============================================================
def test_opensearch() -> bool:
    try:
        r = requests.get(
            f"{OPENSEARCH_HOST}/_cluster/health",
            auth=(OPENSEARCH_USER, OPENSEARCH_PASS),
            verify=False,
            timeout=5,
        )
        r.raise_for_status()
        status = r.json().get("status", "unknown")
        log.info(f"OpenSearch cluster status: {status}")
        return True
    except Exception as e:
        log.error(f"Tidak bisa konek ke OpenSearch ({OPENSEARCH_HOST}): {e}")
        return False


# ============================================================
# MAIN
# ============================================================
def main():
    log.info("=" * 60)
    log.info("ThreatHunt - Wazuh Bridge v2.0 (OpenSearch API)")
    log.info(f"Wazuh Host      : {WAZUH_HOST}")
    log.info(f"OpenSearch Host : {OPENSEARCH_HOST}")
    log.info(f"Supabase URL    : {SUPABASE_URL}")
    log.info(f"Poll interval   : {POLL_INTERVAL_SEC}s")
    log.info("=" * 60)

    # Test koneksi OpenSearch — jika gagal, tunggu dan retry (jangan crash)
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        if test_opensearch():
            break
        log.warning(f"Retry {attempt}/{max_retries} — tunggu 10 detik...")
        time.sleep(10)
    else:
        log.error("OpenSearch tidak bisa diakses setelah beberapa percobaan.")
        log.error("Coba cek: sudo ss -tlnp | grep 9200")
        sys.exit(1)

    # Koneksi Supabase
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        log.info("Terhubung ke Supabase!")
    except Exception as e:
        log.error(f"Gagal konek Supabase: {e}")
        sys.exit(1)

    # Mulai dari 1 menit yang lalu agar tidak miss alert baru saat start
    last_ts  = datetime.now(timezone.utc) - timedelta(minutes=1)
    total    = 0
    errors   = 0

    log.info("Mulai polling alert dari Wazuh...")

    while True:
        hits = fetch_alerts_since(last_ts)

        if hits:
            log.info(f"Ditemukan {len(hits)} alert baru...")

        for hit in hits:
            alert = parse_hit(hit)
            if alert is None:
                continue

            # Update last_ts agar tidak re-fetch alert yang sama
            hit_ts = hit.get("_source", {}).get("timestamp", "")
            if hit_ts:
                try:
                    dt = datetime.fromisoformat(hit_ts.replace("Z", "+00:00"))
                    if dt > last_ts:
                        last_ts = dt + timedelta(milliseconds=1)
                except Exception:
                    pass

            # Upsert info agent
            src   = hit.get("_source", {})
            agent = src.get("agent", {})
            upsert_agent(supabase, agent.get("name",""), agent.get("ip",""), agent.get("id","000"))

            # Kirim ke Supabase
            if send_to_supabase(supabase, alert):
                total += 1
                log.info(
                    f"[{alert['severity'].upper():8s}] "
                    f"{alert['attack_type'][:35]:35s} | "
                    f"Agent: {alert['wazuh_agent_name']} | "
                    f"Rule: {alert['wazuh_rule_id']}"
                )
            else:
                errors += 1

        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("Bridge dihentikan (Ctrl+C)")
    except Exception as e:
        log.critical(f"Bridge crash: {e}", exc_info=True)
        sys.exit(1)

