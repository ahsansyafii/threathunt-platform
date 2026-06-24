import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  username: string;
  role: "admin" | "analyst" | "viewer";
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Alert = {
  id: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  alert_type: "rule_based" | "ml_predicted";
  attack_type: string;
  source_ip: string;
  dest_ip: string;
  source_port?: number;
  dest_port?: number;
  protocol?: string;
  description: string;
  detection_source: "suricata" | "wazuh" | "ml_engine";
  status: "open" | "investigating" | "resolved" | "false_positive";
  created_at: string;
};

export type Prediction = {
  id: string;
  timestamp: string;
  attack_type: string;
  confidence_score: number;
  model_version: string;
  created_at: string;
};

export type Agent = {
  id: string;
  name: string;
  agent_type: "suricata" | "wazuh_agent" | "wazuh_manager";
  host_ip: string;
  status: "active" | "inactive" | "disconnected";
  last_seen: string;
};
