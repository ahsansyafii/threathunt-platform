/*
  # Predictive Threat Hunting Platform Schema

  1. Core Tables:
     - users (authentication management)
     - alerts (security alerts from NIDS/HIDS)
     - predictions (ML threat predictions)
     - agents (Suricata/Wazuh agents)
     - rules (detection rules)
     - reports (security reports)

  2. Security:
     - Enable RLS on all tables
     - Role-based access control (Admin, Analyst, Viewer)
     - Authentication-based policies

  3. Data Organization:
     - Suricata alerts (Network NIDS)
     - Wazuh alerts (Host HIDS)
     - ML predictions for DDoS, Brute Force, Port Scan, Normal
*/

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'viewer', -- admin, analyst, viewer
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  agent_type text NOT NULL, -- suricata, wazuh_agent, wazuh_manager
  host_ip text NOT NULL,
  os text,
  status text DEFAULT 'active', -- active, inactive, disconnected
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read agents" ON agents
  FOR SELECT TO authenticated
  USING (true);

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL, -- suricata, wazuh, ml
  category text,
  severity text NOT NULL, -- low, medium, high, critical
  description text,
  signature text,
  source text, -- suricata, wazuh, ml_engine
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rules" ON rules
  FOR SELECT TO authenticated
  USING (true);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL, -- low, medium, high, critical
  alert_type text NOT NULL, -- rule_based, ml_predicted
  attack_type text, -- DDoS, Brute Force, Port Scan, Malware, Normal
  source_ip text NOT NULL,
  dest_ip text NOT NULL,
  source_port integer,
  dest_port integer,
  protocol text,
  description text,
  rule_id uuid REFERENCES rules(id),
  agent_id uuid REFERENCES agents(id),
  detection_source text, -- suricata, wazuh, ml_engine
  status text DEFAULT 'open', -- open, investigating, resolved, false_positive
  raw_log text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alerts" ON alerts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and analysts can update alerts" ON alerts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  attack_type text NOT NULL, -- DDoS, Brute Force, Port Scan, Normal
  confidence_score float NOT NULL, -- 0.0 to 1.0
  model_version text,
  alert_id uuid REFERENCES alerts(id),
  features jsonb, -- extracted features used for prediction
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read predictions" ON predictions
  FOR SELECT TO authenticated
  USING (true);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type text NOT NULL, -- daily, weekly, monthly, custom
  user_id uuid NOT NULL REFERENCES users(id),
  generated_at timestamptz DEFAULT now(),
  start_date timestamptz,
  end_date timestamptz,
  total_alerts integer DEFAULT 0,
  critical_count integer DEFAULT 0,
  high_count integer DEFAULT 0,
  medium_count integer DEFAULT 0,
  low_count integer DEFAULT 0,
  summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports" ON reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can read all reports" ON reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS alerts_timestamp_idx ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS alerts_severity_idx ON alerts(severity);
CREATE INDEX IF NOT EXISTS alerts_source_ip_idx ON alerts(source_ip);
CREATE INDEX IF NOT EXISTS alerts_status_idx ON alerts(status);
CREATE INDEX IF NOT EXISTS predictions_timestamp_idx ON predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS predictions_attack_type_idx ON predictions(attack_type);
