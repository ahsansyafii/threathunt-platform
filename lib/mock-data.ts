import { Alert, Prediction, Agent } from "./supabase-client";

const ATTACK_TYPES = [
  "DDoS HTTP Flood",
  "DDoS SYN Flood",
  "Brute Force SSH",
  "Brute Force FTP",
  "Port Scan (Nmap)",
  "SQL Injection",
  "Malware Beaconing",
  "Port Scanning",
];

const SOURCE_IPS = [
  "10.0.0.55",
  "192.168.1.105",
  "172.16.0.12",
  "10.0.0.88",
  "203.0.113.45",
  "198.51.100.22",
  "192.0.2.33",
];

const DEST_IPS = [
  "192.168.1.100",
  "10.0.0.1",
  "172.16.0.1",
  "8.8.8.8",
];

export function generateMockAlerts(count: number = 50): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 86400000);
    const severities = ["low", "medium", "high", "critical"] as const;
    const detectionSources = ["suricata", "wazuh", "ml_engine"] as const;
    const statuses = ["open", "investigating", "resolved", "false_positive"] as const;

    alerts.push({
      id: `alert-${i}`,
      timestamp: timestamp.toISOString(),
      severity: severities[Math.floor(Math.random() * severities.length)],
      alert_type: Math.random() > 0.6 ? "ml_predicted" : "rule_based",
      attack_type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
      source_ip: SOURCE_IPS[Math.floor(Math.random() * SOURCE_IPS.length)],
      dest_ip: DEST_IPS[Math.floor(Math.random() * DEST_IPS.length)],
      source_port: Math.floor(Math.random() * 65535) + 1024,
      dest_port: [22, 21, 80, 443, 3306, 5432][Math.floor(Math.random() * 6)],
      protocol: ["TCP", "UDP", "ICMP"][Math.floor(Math.random() * 3)],
      description: `Detected ${ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)]} attempt from ${SOURCE_IPS[0]}`,
      detection_source: detectionSources[Math.floor(Math.random() * detectionSources.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      created_at: timestamp.toISOString(),
    });
  }

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMockPredictions(count: number = 20): Prediction[] {
  const predictions: Prediction[] = [];
  const now = new Date();
  const attackTypes = ["DDoS", "Brute Force", "Port Scan", "Malware", "Normal"];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 86400000);

    predictions.push({
      id: `pred-${i}`,
      timestamp: timestamp.toISOString(),
      attack_type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      confidence_score: 0.6 + Math.random() * 0.4,
      model_version: "v2.1 (Random Forest)",
      created_at: timestamp.toISOString(),
    });
  }

  return predictions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMockAgents(): Agent[] {
  return [
    {
      id: "agent-1",
      name: "wazuh-manager",
      agent_type: "wazuh_manager",
      host_ip: "192.168.56.10",
      status: "active",
      last_seen: new Date().toISOString(),
    },
    {
      id: "agent-2",
      name: "web-server-vm",
      agent_type: "wazuh_agent",
      host_ip: "192.168.56.20",
      status: "active",
      last_seen: new Date().toISOString(),
    },
    {
      id: "agent-3",
      name: "suricata-node",
      agent_type: "suricata",
      host_ip: "192.168.56.30",
      status: "active",
      last_seen: new Date().toISOString(),
    },
    {
      id: "agent-4",
      name: "db-server",
      agent_type: "wazuh_agent",
      host_ip: "192.168.56.40",
      status: "active",
      last_seen: new Date().toISOString(),
    },
  ];
}

export function getAlertStats(alerts: Alert[]) {
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
    byType: ATTACK_TYPES.map((type) => ({
      type,
      count: alerts.filter((a) => a.attack_type === type).length,
    })),
    bySource: Array.from(new Set(alerts.map((a) => a.source_ip))).slice(0, 5).map((ip) => ({
      ip,
      count: alerts.filter((a) => a.source_ip === ip).length,
    })),
  };
}

export function generateNetworkTraffic() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return {
    labels: hours.map((h) => `${h}:00`),
    incoming: hours.map(() => Math.floor(Math.random() * 5000) + 1000),
    outgoing: hours.map(() => Math.floor(Math.random() * 4000) + 800),
    anomalies: hours.map(() => Math.floor(Math.random() * 200)),
  };
}

export function generatePredictiveMetrics() {
  return {
    ddosRisk: Math.floor(Math.random() * 40) + 20,
    bruteForceRisk: Math.floor(Math.random() * 30) + 10,
    malwareRisk: Math.floor(Math.random() * 25) + 5,
    networkAnomalyScore: Math.floor(Math.random() * 35) + 15,
    confidenceScores: {
      ddos: 0.7 + Math.random() * 0.3,
      bruteForce: 0.6 + Math.random() * 0.4,
      malware: 0.5 + Math.random() * 0.5,
    },
  };
}
