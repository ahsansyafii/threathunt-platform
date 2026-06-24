"use client";

import { useEffect, useState } from "react";
import { useRealtimeAgents } from "@/lib/use-realtime-data";
import { generateNetworkTraffic } from "@/lib/mock-data";
import { Agent } from "@/lib/supabase-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity, Signal, Zap } from "lucide-react";

export default function NetworkPage() {
  const { agents, loading: agentsLoading, isRealData } = useRealtimeAgents();
  const [networkTraffic, setNetworkTraffic] = useState<any>(null);

  const loading = agentsLoading || !networkTraffic;

  useEffect(() => {
    setNetworkTraffic(generateNetworkTraffic());
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading network data...</div>
      </div>
    );
  }

  const trafficData = networkTraffic.labels.map((label: string, idx: number) => ({
    time: label,
    incoming: networkTraffic.incoming[idx],
    outgoing: networkTraffic.outgoing[idx],
    anomalies: networkTraffic.anomalies[idx],
  }));

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalBytes =
    networkTraffic.incoming.reduce((a: number, b: number) => a + b, 0) +
    networkTraffic.outgoing.reduce((a: number, b: number) => a + b, 0);
  const totalAnomalies = networkTraffic.anomalies.reduce(
    (a: number, b: number) => a + b,
    0
  );

  const statusColors = {
    active: "bg-green-900 text-green-200",
    inactive: "bg-yellow-900 text-yellow-200",
    disconnected: "bg-red-900 text-red-200",
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Agents</p>
              <p className="text-3xl font-bold text-green-500 mt-2">
                {activeAgents}/{agents.length}
              </p>
            </div>
            <Activity className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Traffic</p>
              <p className="text-3xl font-bold text-blue-500 mt-2">
                {(totalBytes / 1000).toFixed(1)} MB
              </p>
            </div>
            <Zap className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Anomalies</p>
              <p className="text-3xl font-bold text-orange-500 mt-2">
                {totalAnomalies}
              </p>
            </div>
            <Signal className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-4">Network Traffic & Anomalies</h3>
        <ResponsiveContainer width="100%" height={350}>
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
              <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
            <Legend />
            <Area
              type="monotone"
              dataKey="incoming"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorIncoming)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorOutgoing)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="anomalies"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorAnomalies)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Agents Status */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-white font-bold mb-4">Detection Agents</h3>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-white">{agent.name}</h4>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="font-mono">{agent.host_ip}</span>
                  {" • "}
                  <span className="capitalize">{agent.agent_type}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <p className="text-slate-400">Last Seen</p>
                  <p className="text-white">
                    {new Date(agent.last_seen).toLocaleTimeString()}
                  </p>
                </div>

                <Badge
                  className={`flex-shrink-0 ${statusColors[agent.status as keyof typeof statusColors]}`}
                >
                  {agent.status.charAt(0).toUpperCase() +
                    agent.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
