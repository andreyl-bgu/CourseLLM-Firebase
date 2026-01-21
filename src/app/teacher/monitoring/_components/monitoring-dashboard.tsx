"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Cpu, MemoryStick, Activity, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SystemMetrics {
  timestamp: number;
  cpu: { usage: number; loadAverage: number[]; cores: number };
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
    processMemory: { heapUsed: number; heapTotal: number; external: number; rss: number };
  };
  uptime: { system: number; process: number };
}

interface FormattedMetrics {
  timestamp: string;
  cpu: { usage: string; loadAverage: string; cores: number };
  memory: {
    total: string;
    free: string;
    used: string;
    usage: string;
    processMemory: { heapUsed: string; heapTotal: string; external: string; rss: string };
  };
  uptime: { system: string; process: string };
}

type HealthResponse = { ok: boolean; timestamp: string; node: string };

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [formattedMetrics, setFormattedMetrics] = useState<FormattedMetrics | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; cpu: number; memory: number }>>(
    []
  );
  const [autoRefresh, setAutoRefresh] = useState(true);

  const pollIntervalMs = 5000;
  const historyLimit = 20;

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rawResponse, formattedResponse, healthResponse] = await Promise.all([
        fetch("/api/monitoring?format=raw"),
        fetch("/api/monitoring?format=formatted"),
        fetch("/api/health"),
      ]);

      if (!rawResponse.ok || !formattedResponse.ok) {
        throw new Error("Failed to fetch monitoring metrics");
      }

      const rawData = await rawResponse.json();
      const formattedData = await formattedResponse.json();

      if (healthResponse.ok) {
        const healthJson = (await healthResponse.json()) as HealthResponse;
        setHealth(healthJson);
      } else {
        setHealth(null);
      }

      if (rawData.success && formattedData.success) {
        setMetrics(rawData.data);
        setFormattedMetrics(formattedData.data);

        const now = new Date().toLocaleTimeString();
        setHistory((prev) => {
          const next = [...prev, { time: now, cpu: rawData.data.cpu.usage, memory: rawData.data.memory.usage }];
          return next.slice(-historyLimit);
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(fetchMetrics, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [autoRefresh]);

  const healthBadge = useMemo(() => {
    if (!health?.ok) return { label: "Unhealthy", className: "bg-red-100 text-red-800" };
    return { label: "Healthy", className: "bg-green-100 text-green-800" };
  }, [health]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchMetrics}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time CPU and RAM usage metrics (this instance)</p>
          <div className="text-sm text-muted-foreground">
            Health:{" "}
            <span className={`inline-flex items-center rounded px-2 py-0.5 ${healthBadge.className}`}>
              {healthBadge.label}
            </span>
            {health?.node ? <span className="ml-2">Node: {health.node}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? "Pause" : "Resume"} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {metrics && formattedMetrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedMetrics.cpu.usage}</div>
                <Progress value={metrics.cpu.usage} className="mt-2" />
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <div>Load Average: {formattedMetrics.cpu.loadAverage}</div>
                  <div>CPU Cores: {metrics.cpu.cores}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedMetrics.memory.usage}</div>
                <Progress value={metrics.memory.usage} className="mt-2" />
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <div>
                    Used: {formattedMetrics.memory.used} / {formattedMetrics.memory.total}
                  </div>
                  <div>Free: {formattedMetrics.memory.free}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Process Memory Details</CardTitle>
              <CardDescription>Node.js process memory usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Heap Used</div>
                  <div className="text-lg font-semibold">{formattedMetrics.memory.processMemory.heapUsed}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Heap Total</div>
                  <div className="text-lg font-semibold">{formattedMetrics.memory.processMemory.heapTotal}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">External</div>
                  <div className="text-lg font-semibold">{formattedMetrics.memory.processMemory.external}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">RSS</div>
                  <div className="text-lg font-semibold">{formattedMetrics.memory.processMemory.rss}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedMetrics.uptime.system}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Process Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedMetrics.uptime.process}</div>
              </CardContent>
            </Card>
          </div>

          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
                <CardDescription>CPU and Memory usage over time (last {historyLimit} measurements)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" name="CPU Usage %" strokeWidth={2} />
                      <Line type="monotone" dataKey="memory" stroke="hsl(var(--accent))" name="Memory Usage %" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground text-center">
            Last updated: {formattedMetrics.timestamp}
          </div>
        </>
      )}
    </div>
  );
}

