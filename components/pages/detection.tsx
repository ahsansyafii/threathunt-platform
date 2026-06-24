"use client";

import { useEffect, useState } from "react";
import { generateMockAlerts, getAlertStats } from "@/lib/mock-data";
import { Alert } from "@/lib/supabase-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Shield, TrendingUp } from "lucide-react";

export default function DetectionPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockAlerts = generateMockAlerts(80);
    setAlerts(mockAlerts);
    setStats(getAlertStats(mockAlerts));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading detection data...</div>
      </div>
    );
  }

  const severityData = [
    { name: "Critical", value: stats.critical, fill: "#ef4444" },
    { name: "High", value: stats.high, fill: "#f97316" },
    { name: "Medium", value: stats.medium, fill: "#eab308" },
    { name: "Low", value: stats.low, fill: "#10b981" },
  ];

  const detectionSources = [
    { name: "Suricata", count: Math.floor(stats.total * 0.4) },
    { name: "Wazuh", count: Math.floor(stats.total * 0.35) },
    { name: "ML Engine", count: Math.floor(stats.total * 0.25) },
  ];

  const topAttackTypes = stats.byType.slice(0, 8);

  return (
    <div className="p-6 bg-slate-950 min-h-screen space-y-6">
      {/* Detection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Detections</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <Shield className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div>
            <p className="text-slate-400 text-sm font-medium">Critical</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{stats.critical}</p>
            <p className="text-xs text-slate-400 mt-1">
              {((stats.critical / stats.total) * 100).toFixed(1)}% of total
            </p>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div>
            <p className="text-slate-400 text-sm font-medium">High</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">{stats.high}</p>
            <p className="text-xs text-slate-400 mt-1">
              {((stats.high / stats.total) * 100).toFixed(1)}% of total
            </p>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div>
            <p className="text-slate-400 text-sm font-medium">Medium/Low</p>
            <p className="text-3xl font-bold text-yellow-500 mt-2">
              {stats.medium + stats.low}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {(((stats.medium + stats.low) / stats.total) * 100).toFixed(1)}% of total
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="text-white font-bold mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Detection Sources */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="text-white font-bold mb-4">Detections by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={detectionSources}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Attack Types */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-4">Most Common Attack Types</h3>
        <div className="space-y-2">
          {topAttackTypes.map((item: any, idx: number) => {
            const percentage = (item.count / stats.total) * 100;
            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-300">{item.type}</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Source IPs */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-4">Top Source IPs</h3>
        <div className="space-y-3">
          {stats.bySource.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
              <span className="font-mono text-white">{item.ip}</span>
              <Badge variant="outline" className="bg-red-900 text-red-200 border-red-700">
                {item.count} alerts
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
