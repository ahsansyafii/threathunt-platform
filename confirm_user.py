#!/usr/bin/env python3
"""
Confirm Supabase user email manually.
Usage: python confirm_user.py <email>
"""
import sys
import urllib.request
import json

SUPABASE_URL = 'https://qonnvllumuhhvqpfooyk.supabase.co'
SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbm52bGx1bXVoaHZxcGZvb3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk2MjkyMCwiZXhwIjoyMDk1NTM4OTIwfQ.5SxZVfgCU5UNo39V_WoONBvfouIh2gG7wc4D5n32-18'

def confirm_user(target_email):
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json'
    }

    # Get all users
    req = urllib.request.Request(
        SUPABASE_URL + '/auth/v1/admin/users',
        headers=headers
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    users = data.get('users', [])
    user_id = None

    print(f"\nMencari user: {target_email}")
    for u in users:
        email     = u.get('email', '')
        uid       = u.get('id', '')
        confirmed = u.get('email_confirmed_at')
        status    = 'CONFIRMED' if confirmed else 'NOT CONFIRMED'
        print(f"  - {email} [{status}]")
        if email == target_email:
            user_id = uid
            if confirmed:
                print(f"\n✅ User '{target_email}' sudah confirmed sebelumnya!")
                return

    if not user_id:
        print(f"\n❌ User '{target_email}' tidak ditemukan.")
        print("   Pastikan user sudah Sign Up di web dulu.")
        return

    # Confirm via admin API
    payload = json.dumps({'email_confirm': True}).encode()
    req2 = urllib.request.Request(
        SUPABASE_URL + '/auth/v1/admin/users/' + user_id,
        data=payload,
        headers=headers,
        method='PUT'
    )
    with urllib.request.urlopen(req2) as r:
        if r.status == 200:
            print(f"\n✅ Email '{target_email}' berhasil dikonfirmasi!")
            print("   User sekarang bisa login di http://localhost:3001")
        else:
            print(f"\n❌ Gagal konfirmasi. Status: {r.status}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python confirm_user.py <email>")
        print("Contoh: python confirm_user.py anisa@gmail.com")
        sys.exit(1)
    confirm_user(sys.argv[1])
