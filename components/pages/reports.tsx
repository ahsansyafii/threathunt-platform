"use client";

import { useEffect, useState } from "react";
import { generateMockAlerts, getAlertStats } from "@/lib/mock-data";
import { Alert } from "@/lib/supabase-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Eye, Share2, Trash2, Plus } from "lucide-react";

export default function ReportsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("all");
  const [reportStatus, setReportStatus] = useState("all");

  useEffect(() => {
    const mockAlerts = generateMockAlerts(100);
    setAlerts(mockAlerts);
    setStats(getAlertStats(mockAlerts));
    setLoading(false);
  }, []);

  const exportPDF = () => {
    const now = new Date().toLocaleString();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ThreatHunt Security Report — ${now}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; }
    .header { border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 28px; font-weight: 800; color: #dc2626; }
    .brand-sub { font-size: 12px; color: #666; margin-top: 4px; }
    .meta { text-align: right; font-size: 12px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1e293b; border-left: 4px solid #dc2626; padding-left: 12px; margin-bottom: 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .kpi-label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
    .kpi-value { font-size: 28px; font-weight: 800; }
    .kpi-card.critical .kpi-value { color: #dc2626; }
    .kpi-card.high .kpi-value { color: #ea580c; }
    .kpi-card.medium .kpi-value { color: #ca8a04; }
    .kpi-card.total .kpi-value { color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1e293b; color: #fff; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge.critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge.high { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
    .badge.medium { background: #fefce8; color: #ca8a04; border: 1px solid #fde68a; }
    .badge.low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .source-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🛡️ ThreatHunt</div>
      <div class="brand-sub">Predictive Threat Hunting Platform · Wazuh + Suricata + ML Engine</div>
    </div>
    <div class="meta">
      <div><strong>Security Report</strong></div>
      <div>Generated: ${now}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="kpi-grid">
      <div class="kpi-card total"><div class="kpi-label">Total Alerts</div><div class="kpi-value">${stats.total}</div></div>
      <div class="kpi-card critical"><div class="kpi-label">Critical</div><div class="kpi-value">${stats.critical}</div></div>
      <div class="kpi-card high"><div class="kpi-label">High</div><div class="kpi-value">${stats.high}</div></div>
      <div class="kpi-card medium"><div class="kpi-label">Med + Low</div><div class="kpi-value">${stats.medium + stats.low}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detection Sources (Wazuh · Suricata · ML Engine)</div>
    <table>
      <thead><tr><th>Source</th><th>Detection Count</th><th>Share</th></tr></thead>
      <tbody>
        <tr><td>🔵 Suricata IDS</td><td>${Math.floor(stats.total * 0.4)}</td><td>~40%</td></tr>
        <tr><td>🟠 Wazuh HIDS</td><td>${Math.floor(stats.total * 0.35)}</td><td>~35%</td></tr>
        <tr><td>🟣 ML Engine</td><td>${Math.floor(stats.total * 0.25)}</td><td>~25%</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Top Attack Types</div>
    <table>
      <thead><tr><th>#</th><th>Attack Type</th><th>Count</th><th>Percentage</th></tr></thead>
      <tbody>
        ${stats.byType
          .slice(0, 10)
          .map(
            (t: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${t.type}</td><td>${t.count}</td><td>${((t.count / stats.total) * 100).toFixed(1)}%</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Top Source IPs</div>
    <table>
      <thead><tr><th>IP Address</th><th>Alert Count</th></tr></thead>
      <tbody>
        ${stats.bySource
          .map((s: any) => `<tr><td><code>${s.ip}</code></td><td>${s.count}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    ThreatHunt · Predictive Threat Hunting Platform · Powered by Wazuh SIEM, Suricata IDS, and ML Engine (Random Forest v2.1)
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  };

  const exportCSV = () => {
    const headers = [
      "Timestamp",
      "Attack Type",
      "Severity",
      "Source IP",
      "Dest IP",
      "Status",
      "Detection Source",
    ];
    const rows = alerts.slice(0, 50).map((alert) => [
      alert.timestamp,
      alert.attack_type,
      alert.severity,
      alert.source_ip,
      alert.dest_ip,
      alert.status,
      alert.detection_source,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", "alerts-export.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading reports...</div>
      </div>
    );
  }

  const recentReports = [
    {
      id: 1,
      name: "Security Report - January 2024",
      date: "2024-01-01 to 2024-01-31",
      threats: 145,
      detections: 2847,
      status: "Completed",
      type: "pdf",
    },
    {
      id: 2,
      name: "Weekly Threat Assessment",
      date: "2024-01-08 to 2024-01-15",
      threats: 34,
      detections: 512,
      status: "Completed",
      type: "pdf",
    },
    {
      id: 3,
      name: "Daily Security Briefing",
      date: "2024-01-15",
      threats: 12,
      detections: 156,
      status: "In Progress",
      type: "pdf",
    },
    {
      id: 4,
      name: "Network Analysis Report",
      date: "2024-01-10 to 2024-01-15",
      threats: 28,
      detections: 389,
      status: "Completed",
      type: "csv",
    },
  ];

  return (
    <div className="p-6 bg-slate-950 min-h-screen space-y-6">
      {/* Header with New Report Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
          <p className="text-slate-400">Generate and manage security reports</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700 p-4 hover:border-slate-600 transition-all duration-300 group cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-white mt-2">6</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500 opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-4 hover:border-slate-600 transition-all duration-300 group cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">This Month</p>
              <p className="text-3xl font-bold text-white mt-2">3</p>
            </div>
            <FileText className="w-8 h-8 text-green-500 opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-4 hover:border-slate-600 transition-all duration-300 group cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Threats</p>
              <p className="text-3xl font-bold text-red-500 mt-2">371</p>
            </div>
            <FileText className="w-8 h-8 text-red-500 opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-4 hover:border-slate-600 transition-all duration-300 group cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Detections</p>
              <p className="text-3xl font-bold text-blue-500 mt-2">6630</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500 opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="font-bold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Report Type
            </label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="security">Security Report</SelectItem>
                <SelectItem value="threat">Threat Assessment</SelectItem>
                <SelectItem value="network">Network Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <Select value={reportStatus} onValueChange={setReportStatus}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Recent Reports */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="font-bold text-white mb-4">Recent Reports (6)</h3>
        <div className="space-y-3">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-750 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 flex-1">
                <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {report.name}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    {report.date}
                  </p>
                  <div className="flex gap-4 text-xs text-slate-500 mt-2">
                    <span>{report.threats} threats</span>
                    <span>•</span>
                    <span>{report.detections} detections</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  className={`flex-shrink-0 ${
                    report.status === "Completed"
                      ? "bg-green-900 text-green-200"
                      : "bg-yellow-900 text-yellow-200"
                  }`}
                >
                  {report.status}
                </Badge>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Export */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="font-bold text-white mb-4">Quick Export</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={exportPDF}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 gap-2"
          >
            <Download className="w-4 h-4" />
            Export as PDF
          </Button>
          <Button
            onClick={exportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 gap-2"
          >
            <Download className="w-4 h-4" />
            Export as CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
