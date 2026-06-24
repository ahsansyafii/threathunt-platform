"use client";

import { useEffect, useState } from "react";
import { useRealtimeAlerts, useRealtimePredictions, useAlertStats } from "@/lib/use-realtime-data";
import { generateNetworkTraffic, generatePredictiveMetrics } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, TrendingUp, Zap, Wifi, WifiOff } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard() {
  const { alerts, loading: alertsLoading, isRealData } = useRealtimeAlerts(50);
  const { predictions, loading: predsLoading } = useRealtimePredictions(20);
  const [networkTraffic, setNetworkTraffic] = useState<any>(null);
  const [predictiveMetrics, setPredictiveMetrics] = useState<any>(null);

  const loading = alertsLoading || predsLoading;

  useEffect(() => {
    setNetworkTraffic(generateNetworkTraffic());
    setPredictiveMetrics(generatePredictiveMetrics());
  }, []);

  if (loading || !networkTraffic || !predictiveMetrics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  const alertStats = useAlertStats(alerts);
  const criticalAlerts = alertStats.critical;
  const totalAlerts = alertStats.total;
  const avgSeverity = totalAlerts > 0
    ? (alertStats.critical * 4 + alertStats.high * 3 + alertStats.medium * 2 + alertStats.low) / totalAlerts
    : 0;

  // Prepare data for charts
  const trafficData = networkTraffic.labels.map((label: string, idx: number) => ({
    time: label,
    incoming: networkTraffic.incoming[idx],
    outgoing: networkTraffic.outgoing[idx],
    anomalies: networkTraffic.anomalies[idx],
  }));

  const riskData = [
    { name: "DDoS Risk", value: predictiveMetrics.ddosRisk, color: "#ef4444" },
    { name: "Brute Force", value: predictiveMetrics.bruteForceRisk, color: "#f97316" },
    { name: "Malware", value: predictiveMetrics.malwareRisk, color: "#eab308" },
    { name: "Network Anomaly", value: predictiveMetrics.networkAnomalyScore, color: "#10b981" },
  ];

  const recentAlerts = alerts.slice(0, 5);

  const severityColors = {
    critical: "bg-red-900 text-red-200 border-red-700",
    high: "bg-orange-900 text-orange-200 border-orange-700",
    medium: "bg-yellow-900 text-yellow-200 border-yellow-700",
    low: "bg-green-900 text-green-200 border-green-700",
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* Data Source Indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border w-fit text-xs font-medium ${
        isRealData
          ? "bg-green-950/50 border-green-700/50 text-green-300"
          : "bg-slate-800 border-slate-600 text-slate-400"
      }`}>
        {isRealData ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        {isRealData
          ? "Real-time data dari Suricata & Wazuh"
          : "Demo mode — hubungkan Suricata & Wazuh untuk data real"}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Alerts</p>
              <p className="text-3xl font-bold text-white mt-2">{totalAlerts}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-500 mt-2">{criticalAlerts}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Threat Level</p>
              <p className="text-3xl font-bold text-white mt-2">
                {avgSeverity.toFixed(1)}/4
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">
                Threat Prediction Score
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {(predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length * 100).toFixed(0)}%
              </p>
            </div>
            <Zap className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Traffic */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="text-white font-bold mb-4">Network Traffic (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
              <Area
                type="monotone"
                dataKey="incoming"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorIncoming)"
              />
              <Area
                type="monotone"
                dataKey="outgoing"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorOutgoing)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Predictive Risk Levels */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="text-white font-bold mb-4">Predictive Risk Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
              <Bar dataKey="value" fill="#3b82f6">
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${severityColors[alert.severity as keyof typeof severityColors]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{alert.attack_type}</p>
                  <p className="text-sm opacity-80">{alert.description}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span>{alert.source_ip} → {alert.dest_ip}</span>
                    <span>•</span>
                    <span>{alert.detection_source}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`flex-shrink-0 ${severityColors[alert.severity as keyof typeof severityColors]}`}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
