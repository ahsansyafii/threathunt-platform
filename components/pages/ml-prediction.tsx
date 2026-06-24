"use client";

import { useEffect, useState } from "react";
import { generateMockPredictions, generatePredictiveMetrics, generateMockAlerts } from "@/lib/mock-data";
import { Prediction } from "@/lib/supabase-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
  LineChart,
  Line,
} from "recharts";
import {
  Brain,
  Zap,
  TrendingUp,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";

export default function MLPredictionPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const preds = generateMockPredictions(30);
    const m = generatePredictiveMetrics();
    setPredictions(preds);
    setMetrics(m);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading ML predictions...</div>
      </div>
    );
  }

  // Attack type confidence breakdown
  const attackConfidence = [
    { attack: "DDoS HTTP Flood", confidence: metrics.confidenceScores.ddos * 100, risk: metrics.ddosRisk, model: "Random Forest" },
    { attack: "Brute Force SSH", confidence: metrics.confidenceScores.bruteForce * 100, risk: metrics.bruteForceRisk, model: "SVM" },
    { attack: "Malware Beaconing", confidence: metrics.confidenceScores.malware * 100, risk: metrics.malwareRisk, model: "LSTM" },
    { attack: "Port Scanning", confidence: 72, risk: 18, model: "Random Forest" },
    { attack: "SQL Injection", confidence: 68, risk: 15, model: "XGBoost" },
  ];

  // Radar chart data for model performance
  const radarData = [
    { subject: "Precision", value: 87 },
    { subject: "Recall", value: 92 },
    { subject: "F1-Score", value: 89 },
    { subject: "Accuracy", value: 94 },
    { subject: "AUC-ROC", value: 96 },
    { subject: "MCC", value: 83 },
  ];

  // Hourly prediction trend
  const hourlyTrend = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    ddos: Math.floor(Math.random() * 40) + 20,
    bruteforce: Math.floor(Math.random() * 30) + 10,
    malware: Math.floor(Math.random() * 25) + 5,
    normal: Math.floor(Math.random() * 20) + 70,
  }));

  // Confusion matrix-like data
  const modelStats = [
    { name: "Random Forest", tp: 892, fp: 43, fn: 67, accuracy: "94.2%", status: "active" },
    { name: "LSTM Network", tp: 856, fp: 61, fn: 89, accuracy: "91.8%", status: "active" },
    { name: "SVM Classifier", tp: 801, fp: 78, fn: 112, accuracy: "89.3%", status: "active" },
    { name: "XGBoost", tp: 874, fp: 52, fn: 78, accuracy: "92.7%", status: "standby" },
  ];

  // Feature importance
  const featureImportance = [
    { feature: "Packet Rate", importance: 0.287, source: "Suricata" },
    { feature: "Connection Duration", importance: 0.234, source: "Suricata" },
    { feature: "Failed Auth Count", importance: 0.198, source: "Wazuh" },
    { feature: "Unique Dest IPs", importance: 0.156, source: "Suricata" },
    { feature: "Log Anomaly Score", importance: 0.125, source: "Wazuh" },
  ];

  const avgConfidence = predictions.reduce((s, p) => s + p.confidence_score, 0) / predictions.length;
  const highConfPreds = predictions.filter((p) => p.confidence_score > 0.85).length;

  return (
    <div className="p-6 bg-slate-950 min-h-screen space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-violet-900/40 via-slate-900 to-blue-900/40 border border-violet-700/40 p-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-violet-600/20 border border-violet-500/30 rounded-xl">
            <Brain className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">ML Predictive Engine</h2>
            <p className="text-slate-400">
              Machine Learning model powered by{" "}
              <span className="text-blue-400 font-semibold">Suricata</span> network telemetry &{" "}
              <span className="text-orange-400 font-semibold">Wazuh</span> SIEM logs
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-300 font-medium">
            🔵 Suricata IDS Rules
          </span>
          <span className="px-3 py-1 bg-orange-600/20 border border-orange-500/30 rounded-full text-xs text-orange-300 font-medium">
            🟠 Wazuh HIDS Alerts
          </span>
          <span className="px-3 py-1 bg-violet-600/20 border border-violet-500/30 rounded-full text-xs text-violet-300 font-medium">
            🟣 Random Forest v2.1
          </span>
          <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-xs text-green-300 font-medium">
            🟢 LSTM Network v1.4
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700 p-6 hover:border-violet-700/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Avg Confidence</p>
              <p className="text-3xl font-bold text-violet-400 mt-2">
                {(avgConfidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">All active models</p>
            </div>
            <Target className="w-12 h-12 text-violet-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6 hover:border-green-700/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">High Confidence</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{highConfPreds}</p>
              <p className="text-xs text-slate-500 mt-1">Score &gt; 85%</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6 hover:border-red-700/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">DDoS Risk Score</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{metrics.ddosRisk}%</p>
              <p className="text-xs text-slate-500 mt-1">Via Suricata telemetry</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6 hover:border-blue-700/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Model Accuracy</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">94.2%</p>
              <p className="text-xs text-slate-500 mt-1">Random Forest (best)</p>
            </div>
            <Brain className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance Radar */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="text-white font-bold mb-1">Model Performance Metrics</h3>
          <p className="text-xs text-slate-500 mb-4">Random Forest v2.1 — trained on Suricata + Wazuh dataset</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                formatter={(v: any) => [`${v}%`, "Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Feature Importance */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="text-white font-bold mb-1">Feature Importance</h3>
          <p className="text-xs text-slate-500 mb-4">Input features from Suricata & Wazuh used by the ML model</p>
          <div className="space-y-4 mt-2">
            {featureImportance.map((f, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        f.source === "Suricata"
                          ? "bg-blue-900/50 text-blue-300 border border-blue-700/50"
                          : "bg-orange-900/50 text-orange-300 border border-orange-700/50"
                      }`}
                    >
                      {f.source}
                    </span>
                    <span className="text-slate-300 text-sm">{f.feature}</span>
                  </div>
                  <span className="text-white text-sm font-mono font-semibold">
                    {(f.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      f.source === "Suricata"
                        ? "bg-gradient-to-r from-blue-600 to-blue-400"
                        : "bg-gradient-to-r from-orange-600 to-orange-400"
                    }`}
                    style={{ width: `${f.importance * 100 / 0.3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly Prediction Trend */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-1">Predicted Threat Probability (24h)</h3>
        <p className="text-xs text-slate-500 mb-4">Real-time ML inference on Suricata network traffic & Wazuh security events</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyTrend}>
            <defs>
              <linearGradient id="gradDdos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBrute" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMalware" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
            <Legend />
            <Area type="monotone" dataKey="ddos" name="DDoS" stroke="#ef4444" fill="url(#gradDdos)" />
            <Area type="monotone" dataKey="bruteforce" name="Brute Force" stroke="#f97316" fill="url(#gradBrute)" />
            <Area type="monotone" dataKey="malware" name="Malware" stroke="#eab308" fill="url(#gradMalware)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ML Model Comparison */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-1">Active ML Models</h3>
        <p className="text-xs text-slate-500 mb-4">Ensemble of models trained on Suricata pcap + Wazuh HIDS alert dataset</p>
        <div className="space-y-3">
          {modelStats.map((m, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200"
            >
              <div className="lg:col-span-2 flex items-center gap-3">
                <div className="p-2 bg-violet-900/30 rounded-lg">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{m.name}</p>
                  <Badge
                    className={
                      m.status === "active"
                        ? "bg-green-900/50 text-green-300 border-green-700 mt-1"
                        : "bg-slate-700 text-slate-300 border-slate-600 mt-1"
                    }
                  >
                    {m.status === "active" ? "● Active" : "◉ Standby"}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-center">
                <p className="text-slate-400">True Positive</p>
                <p className="text-green-400 font-bold text-lg">{m.tp}</p>
              </div>

              <div className="text-sm text-center">
                <p className="text-slate-400">False Positive</p>
                <p className="text-orange-400 font-bold text-lg">{m.fp}</p>
              </div>

              <div className="text-sm text-center">
                <p className="text-slate-400">False Negative</p>
                <p className="text-red-400 font-bold text-lg">{m.fn}</p>
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm">Accuracy</p>
                <p className="text-white font-bold text-xl">{m.accuracy}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Attack Confidence Table */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-1">Attack-Specific Predictions</h3>
        <p className="text-xs text-slate-500 mb-4">Per-attack-type confidence scores from the ensemble model</p>
        <div className="space-y-3">
          {attackConfidence.map((a, idx) => (
            <div
              key={idx}
              className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700"
            >
              <div className="lg:w-52">
                <p className="font-semibold text-white">{a.attack}</p>
                <p className="text-xs text-slate-500 mt-0.5">Model: {a.model}</p>
              </div>

              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Confidence Score</span>
                  <span className="font-mono text-white">{a.confidence.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                    style={{ width: `${a.confidence}%` }}
                  />
                </div>
              </div>

              <div className="lg:w-32">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Risk Level</span>
                  <span className="font-mono text-white">{a.risk}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      a.risk > 35
                        ? "bg-red-500"
                        : a.risk > 20
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${(a.risk / 60) * 100}%` }}
                  />
                </div>
              </div>

              <Badge
                className={`flex-shrink-0 ${
                  a.risk > 35
                    ? "bg-red-900 text-red-200 border-red-700"
                    : a.risk > 20
                    ? "bg-orange-900 text-orange-200 border-orange-700"
                    : "bg-yellow-900 text-yellow-200 border-yellow-700"
                }`}
              >
                {a.risk > 35 ? "HIGH RISK" : a.risk > 20 ? "MEDIUM" : "LOW"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Predictions Feed */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-1">Recent ML Predictions Feed</h3>
        <p className="text-xs text-slate-500 mb-4">Live inference results from the predictive engine</p>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {predictions.slice(0, 15).map((pred, idx) => (
            <div
              key={pred.id}
              className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    pred.confidence_score > 0.85
                      ? "bg-red-500 animate-pulse"
                      : pred.confidence_score > 0.70
                      ? "bg-orange-500"
                      : "bg-yellow-500"
                  }`}
                />
                <div>
                  <p className="text-white text-sm font-medium">{pred.attack_type}</p>
                  <p className="text-xs text-slate-500">{pred.model_version}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Confidence</p>
                  <p
                    className={`font-mono font-bold text-sm ${
                      pred.confidence_score > 0.85
                        ? "text-red-400"
                        : pred.confidence_score > 0.70
                        ? "text-orange-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {(pred.confidence_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-slate-500">{new Date(pred.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
