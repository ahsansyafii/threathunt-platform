# 🛡️ Panduan Integrasi Suricata + Wazuh → ThreatHunt Web

## Prasyarat

- Ubuntu VM (VirtualBox) dengan Suricata dan Wazuh sudah terinstall
- Python 3.8+ di VM
- Akses internet dari VM (untuk koneksi ke Supabase)
- Windows host dengan proyek Next.js ini

---

## LANGKAH 1 — Setup Supabase Database

### 1.1 Dapatkan Service Role Key

1. Buka browser → https://supabase.com/dashboard
2. Pilih project Anda (pyglgmtzvnraqiilxbgc)
3. Klik **Settings** → **API**
4. Copy **service_role** key (BUKAN anon key!)
5. Simpan key ini — akan dipakai di bridge script

### 1.2 Jalankan SQL Migration

1. Di Supabase Dashboard → klik **SQL Editor**
2. Klik **+ New query**
3. Copy seluruh isi file: `supabase/migrations/20260528_initial_schema.sql`
4. Paste ke SQL Editor → klik **Run**
5. Pastikan muncul "Success. No rows returned"

---

## LANGKAH 2 — Setup Bridge Scripts di Ubuntu VM

### 2.1 Transfer File ke VM

Dari Windows, copy script ke Ubuntu VM.
Gunakan SCP (via PowerShell) atau copy manual:

```powershell
# Dari Windows PowerShell (sesuaikan IP VM)
scp scripts/suricata_bridge.py user@192.168.56.10:/opt/threathunt/
scp scripts/wazuh_bridge.py user@192.168.56.10:/opt/threathunt/
scp scripts/requirements.txt user@192.168.56.10:/opt/threathunt/
```

Atau jika tidak ada SCP, buat file manual di VM:

```bash
# Di Ubuntu VM
sudo mkdir -p /opt/threathunt
sudo nano /opt/threathunt/suricata_bridge.py
# Paste isi file, save dengan Ctrl+X → Y → Enter
```

### 2.2 Install Python Dependencies

```bash
# Di Ubuntu VM
sudo apt update
sudo apt install python3-pip -y
sudo pip3 install supabase
```

### 2.3 Edit Konfigurasi Bridge Scripts

**Untuk Suricata Bridge:**
```bash
sudo nano /opt/threathunt/suricata_bridge.py
```
Ubah baris ini:
```python
SUPABASE_SERVICE_KEY = "GANTI_DENGAN_SERVICE_ROLE_KEY"
```
Ganti dengan service_role key dari Langkah 1.1

**Untuk Wazuh Bridge:**
```bash
sudo nano /opt/threathunt/wazuh_bridge.py
```
Ubah baris yang sama dengan service_role key.

### 2.4 Verifikasi Path Log

```bash
# Cek Suricata EVE JSON ada
ls -la /var/log/suricata/eve.json

# Cek Wazuh alerts JSON ada
sudo ls -la /var/ossec/logs/alerts/alerts.json

# Jika tidak ada, aktifkan JSON logging di Wazuh:
sudo nano /var/ossec/etc/ossec.conf
# Tambahkan di bagian <alerts>:
# <log_format>json</log_format>
# Lalu restart: sudo systemctl restart wazuh-manager
```

### 2.5 Test Jalankan Manual

```bash
# Test Suricata Bridge (biarkan jalan, lihat outputnya)
sudo python3 /opt/threathunt/suricata_bridge.py

# Di terminal lain, test Wazuh Bridge
sudo python3 /opt/threathunt/wazuh_bridge.py
```

Output yang diharapkan:
```
2026-05-28 19:00:00 [SURICATA-BRIDGE] INFO: Terhubung ke Supabase!
2026-05-28 19:00:00 [SURICATA-BRIDGE] INFO: Monitoring file: /var/log/suricata/eve.json
```

### 2.6 Test Generate Alert Suricata

```bash
# Trigger test alert Suricata (dari VM)
curl http://testmynids.org/uid/index.html
curl -A "Nikto" http://localhost/
```

Lihat apakah ada output di terminal bridge script.

---

## LANGKAH 3 — Setup Systemd Service (Auto-Start)

### 3.1 Install Service Files

```bash
# Copy service files ke systemd
sudo cp /opt/threathunt/suricata-bridge.service /etc/systemd/system/
sudo cp /opt/threathunt/wazuh-bridge.service /etc/systemd/system/

# Reload daemon
sudo systemctl daemon-reload

# Enable (auto-start saat boot)
sudo systemctl enable suricata-bridge
sudo systemctl enable wazuh-bridge

# Mulai sekarang
sudo systemctl start suricata-bridge
sudo systemctl start wazuh-bridge
```

### 3.2 Cek Status

```bash
sudo systemctl status suricata-bridge
sudo systemctl status wazuh-bridge

# Lihat log live
sudo journalctl -u suricata-bridge -f
sudo journalctl -u wazuh-bridge -f
```

---

## LANGKAH 4 — Verifikasi di Web

### 4.1 Cek Data Masuk ke Supabase

1. Buka Supabase Dashboard → **Table Editor**
2. Klik tabel **alerts**
3. Seharusnya ada baris baru (dari Suricata/Wazuh)

### 4.2 Cek Web App

1. Buka http://localhost:3000 di browser Windows
2. Login atau klik "Try Demo"
3. Di Dashboard, lihat badge kanan atas:
   - 🟢 "Real-time data dari Suricata & Wazuh" = **berhasil!**
   - ⚪ "Demo mode" = data belum masuk

---

## LANGKAH 5 — Network Suricata (penting untuk VM!)

Suricata perlu memantau interface yang benar di VM:

```bash
# Lihat interface network
ip addr show

# Edit konfigurasi Suricata
sudo nano /etc/suricata/suricata.yaml
```

Pastikan bagian `af-packet` mengarah ke interface yang benar:
```yaml
af-packet:
  - interface: enp0s3   # sesuaikan dengan interface Anda
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
```

Restart Suricata:
```bash
sudo systemctl restart suricata
sudo systemctl status suricata
```

---

## Troubleshooting

### Bridge tidak bisa konek ke Supabase
```bash
# Test koneksi internet dari VM
curl -s https://pyglgmtzvnraqiilxbgc.supabase.co/rest/v1/ \
  -H "apikey: ANON_KEY_ANDA"
# Harusnya return JSON response
```

### Eve.json tidak ada
```bash
# Cek Suricata berjalan
sudo systemctl status suricata

# Restart Suricata
sudo systemctl restart suricata

# Cek log Suricata
sudo tail -f /var/log/suricata/suricata.log
```

### Wazuh alerts.json tidak ada
```bash
# Aktifkan JSON output di Wazuh
sudo nano /var/ossec/etc/ossec.conf
# Di bagian <alerts>, pastikan ada:
# <log_format>json</log_format>

sudo systemctl restart wazuh-manager
sudo ls -la /var/ossec/logs/alerts/
```

### Data duplikat di Supabase
Script sudah menangani ini dengan `dedup_hash`. Jika masih terjadi, cek kolom `dedup_hash` di tabel alerts.

---

## Ringkasan Arsitektur

```
Ubuntu VM (VirtualBox)
├── Suricata IDS
│   └── /var/log/suricata/eve.json ──────────────┐
├── Wazuh SIEM                                    │
│   └── /var/ossec/logs/alerts/alerts.json ──────┤
│                                                  ▼
│   Python Bridge Scripts (background service)    Supabase Cloud
│   ├── suricata_bridge.py ──────────────────────▶ table: alerts
│   └── wazuh_bridge.py ─────────────────────────▶ table: agents
│                                                  │
│                                                  │ Supabase Realtime
Windows Host                                       │
└── Next.js Web App (localhost:3000) ◀─────────────┘
    └── Dashboard, Threats, Network, Detection
        (semua auto-update saat ada alert baru!)
```
