-- ============================================================
-- ThreatHunt Platform - Supabase Database Schema
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: users (profile dari Supabase Auth)
-- ============================================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  username text,
  role text not null default 'viewer' check (role in ('admin', 'analyst', 'viewer')),
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create user profile saat user baru register
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLE: agents (Suricata & Wazuh sensors)
-- ============================================================
create table if not exists public.agents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  agent_type text not null check (agent_type in ('suricata', 'wazuh_agent', 'wazuh_manager')),
  host_ip text,
  os_name text,
  os_version text,
  status text not null default 'active' check (status in ('active', 'inactive', 'disconnected')),
  last_seen timestamptz default now(),
  version text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLE: alerts (dari Suricata + Wazuh)
-- ============================================================
create table if not exists public.alerts (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamptz not null default now(),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  alert_type text not null default 'rule_based' check (alert_type in ('rule_based', 'ml_predicted')),
  attack_type text not null,
  source_ip text not null,
  dest_ip text,
  source_port integer,
  dest_port integer,
  protocol text,
  description text,
  detection_source text not null check (detection_source in ('suricata', 'wazuh', 'ml_engine')),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'false_positive')),
  -- Raw log data
  raw_log jsonb,
  -- Suricata-specific
  suricata_sid integer,          -- Signature ID
  suricata_gid integer,          -- Group ID
  suricata_rev integer,          -- Revision
  suricata_category text,        -- ET category
  -- Wazuh-specific
  wazuh_rule_id integer,         -- Wazuh rule ID
  wazuh_rule_level integer,      -- Wazuh severity level (1-15)
  wazuh_agent_id text,           -- Wazuh agent ID
  wazuh_agent_name text,         -- Wazuh agent name
  -- Dedup key
  dedup_hash text unique,        -- MD5 hash untuk avoid duplicate
  created_at timestamptz default now()
);

-- Index untuk query performa
create index if not exists idx_alerts_timestamp on public.alerts(timestamp desc);
create index if not exists idx_alerts_severity on public.alerts(severity);
create index if not exists idx_alerts_detection_source on public.alerts(detection_source);
create index if not exists idx_alerts_source_ip on public.alerts(source_ip);
create index if not exists idx_alerts_status on public.alerts(status);
create index if not exists idx_alerts_created_at on public.alerts(created_at desc);

-- ============================================================
-- TABLE: predictions (hasil ML Engine)
-- ============================================================
create table if not exists public.predictions (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamptz not null default now(),
  attack_type text not null,
  confidence_score float not null check (confidence_score between 0 and 1),
  model_version text default 'v2.1 (Random Forest)',
  source_alert_id uuid references public.alerts(id) on delete set null,
  feature_vector jsonb,   -- input features untuk ML
  created_at timestamptz default now()
);

create index if not exists idx_predictions_timestamp on public.predictions(timestamp desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.users enable row level security;
alter table public.alerts enable row level security;
alter table public.agents enable row level security;
alter table public.predictions enable row level security;

-- Users: hanya bisa lihat data diri sendiri
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Alerts: semua user login bisa baca
create policy "alerts_select_authenticated" on public.alerts
  for select using (auth.role() = 'authenticated');

-- Alerts: hanya service role (bridge script) yang bisa insert
create policy "alerts_insert_service" on public.alerts
  for insert with check (true);

-- Alerts: hanya service role yang bisa update
create policy "alerts_update_service" on public.alerts
  for update using (true);

-- Agents: semua user login bisa baca
create policy "agents_select_authenticated" on public.agents
  for select using (auth.role() = 'authenticated');

create policy "agents_insert_service" on public.agents
  for insert with check (true);

create policy "agents_update_service" on public.agents
  for update using (true);

-- Predictions: semua user login bisa baca
create policy "predictions_select_authenticated" on public.predictions
  for select using (auth.role() = 'authenticated');

create policy "predictions_insert_service" on public.predictions
  for insert with check (true);

-- ============================================================
-- REALTIME: enable untuk tabel alerts dan agents
-- ============================================================
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.agents;
alter publication supabase_realtime add table public.predictions;

-- ============================================================
-- SEED: Insert default agents (Suricata + Wazuh dari VM)
-- ============================================================
insert into public.agents (name, agent_type, host_ip, status, version) values
  ('wazuh-manager',    'wazuh_manager', '192.168.56.10', 'active', '4.7.0'),
  ('suricata-sensor',  'suricata',      '192.168.56.10', 'active', '7.0.3'),
  ('web-server-agent', 'wazuh_agent',   '192.168.56.20', 'active', '4.7.0')
on conflict do nothing;
