/**
 * useRealtimeAlerts — React hook untuk fetch alert dari Supabase
 * dengan Realtime subscription dan fallback ke mock data.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase-client";
import { Alert, Agent, Prediction } from "./supabase-client";
import {
  generateMockAlerts,
  generateMockPredictions,
  generateMockAgents,
} from "./mock-data";

// ============================================================
// ALERTS HOOK
// ============================================================
export function useRealtimeAlerts(limit = 100) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("alerts")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setAlerts(data as Alert[]);
        setIsRealData(true);
      } else {
        // Kosong → pakai mock
        setAlerts(generateMockAlerts(limit));
        setIsRealData(false);
      }
    } catch (err) {
      console.warn("Supabase fetch failed, using mock data:", err);
      setAlerts(generateMockAlerts(limit));
      setIsRealData(false);
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAlerts();

    // Supabase Realtime subscription
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts((prev) => {
            // Hindari duplikat
            if (prev.find((a) => a.id === newAlert.id)) return prev;
            return [newAlert, ...prev].slice(0, limit);
          });
          setIsRealData(true);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alerts" },
        (payload) => {
          const updated = payload.new as Alert;
          setAlerts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  return { alerts, loading, isRealData, error, refetch: fetchAlerts };
}

// ============================================================
// AGENTS HOOK
// ============================================================
export function useRealtimeAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .order("last_seen", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setAgents(data as Agent[]);
          setIsRealData(true);
        } else {
          setAgents(generateMockAgents());
          setIsRealData(false);
        }
      } catch (err) {
        console.warn("Agents fetch failed, using mock:", err);
        setAgents(generateMockAgents());
        setIsRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();

    // Realtime untuk agents
    const channel = supabase
      .channel("agents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAgents((prev) => [payload.new as Agent, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Agent;
            setAgents((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
          }
          setIsRealData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { agents, loading, isRealData };
}

// ============================================================
// PREDICTIONS HOOK
// ============================================================
export function useRealtimePredictions(limit = 30) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (error) throw error;

        if (data && data.length > 0) {
          setPredictions(data as Prediction[]);
          setIsRealData(true);
        } else {
          setPredictions(generateMockPredictions(limit));
          setIsRealData(false);
        }
      } catch (err) {
        console.warn("Predictions fetch failed, using mock:", err);
        setPredictions(generateMockPredictions(limit));
        setIsRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();

    const channel = supabase
      .channel("predictions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "predictions" },
        (payload) => {
          setPredictions((prev) => [payload.new as Prediction, ...prev].slice(0, limit));
          setIsRealData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { predictions, loading, isRealData };
}

// ============================================================
// STATS HOOK (aggregasi dari alerts)
// ============================================================
export function useAlertStats(alerts: Alert[]) {
  const ATTACK_TYPES = [
    "DDoS HTTP Flood", "DDoS SYN Flood", "Brute Force SSH",
    "Brute Force FTP", "Port Scan (Nmap)", "SQL Injection",
    "Malware Beaconing", "Port Scanning", "XSS Attack",
    "Exploit Attempt", "Privilege Escalation",
  ];

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
    bySource: {
      suricata: alerts.filter((a) => a.detection_source === "suricata").length,
      wazuh: alerts.filter((a) => a.detection_source === "wazuh").length,
      ml_engine: alerts.filter((a) => a.detection_source === "ml_engine").length,
    },
    byType: ATTACK_TYPES.map((type) => ({
      type,
      count: alerts.filter((a) => a.attack_type === type).length,
    })).sort((a, b) => b.count - a.count),
    bySourceIP: Array.from(new Set(alerts.map((a) => a.source_ip)))
      .slice(0, 10)
      .map((ip) => ({
        ip,
        count: alerts.filter((a) => a.source_ip === ip).length,
      }))
      .sort((a, b) => b.count - a.count),
  };

  return stats;
}
