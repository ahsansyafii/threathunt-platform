"use client";

import { useRealtimeAlerts } from "@/lib/use-realtime-data";
import { Alert } from "@/lib/supabase-client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function ThreatsPage() {
  const { alerts, loading, isRealData } = useRealtimeAlerts(100);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(
        (alert) =>
          alert.attack_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.source_ip.includes(searchTerm) ||
          alert.dest_ip.includes(searchTerm)
      );
    }

    if (severityFilter && severityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.severity === severityFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((alert) => alert.status === statusFilter);
    }

    setFilteredAlerts(filtered);
  }, [searchTerm, severityFilter, statusFilter, alerts]);

  const severityColors = {
    critical: "bg-red-900 text-red-200 border-red-700",
    high: "bg-orange-900 text-orange-200 border-orange-700",
    medium: "bg-yellow-900 text-yellow-200 border-yellow-700",
    low: "bg-green-900 text-green-200 border-green-700",
  };

  const statusColors = {
    open: "bg-blue-900 text-blue-200",
    investigating: "bg-purple-900 text-purple-200",
    resolved: "bg-green-900 text-green-200",
    false_positive: "bg-slate-700 text-slate-200",
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading threats...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <Card className="bg-slate-900 border-slate-700 p-6 mb-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by attack type, IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-slate-400">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Card
            key={alert.id}
            className={`bg-slate-900 border-l-4 p-4 cursor-pointer hover:bg-slate-800 transition-colors ${
              alert.severity === "critical"
                ? "border-l-red-500"
                : alert.severity === "high"
                ? "border-l-orange-500"
                : alert.severity === "medium"
                ? "border-l-yellow-500"
                : "border-l-green-500"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-white">{alert.attack_type}</h3>
                <p className="text-sm text-slate-400 mt-1">{alert.description}</p>
              </div>

              <div className="text-sm">
                <p className="text-slate-400">Source</p>
                <p className="text-white font-mono">{alert.source_ip}:{alert.source_port}</p>
              </div>

              <div className="text-sm">
                <p className="text-slate-400">Destination</p>
                <p className="text-white font-mono">{alert.dest_ip}:{alert.dest_port}</p>
              </div>

              <div className="flex gap-2">
                <Badge className={`${severityColors[alert.severity as keyof typeof severityColors]}`}>
                  {alert.severity.toUpperCase()}
                </Badge>
                <Badge className={`${statusColors[alert.status as keyof typeof statusColors]}`}>
                  {alert.status === "false_positive" ? "False +" : alert.status.toUpperCase()}
                </Badge>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
