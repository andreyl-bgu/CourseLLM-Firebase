"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RefreshCw, Cpu, MemoryStick, Activity, Clock } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
    processMemory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
  uptime: {
    system: number;
    process: number;
  };
}

interface FormattedMetrics {
  timestamp: string;
  cpu: {
    usage: string;
    loadAverage: string;
    cores: number;
  };
  memory: {
    total: string;
    free: string;
    used: string;
    usage: string;
    processMemory: {
      heapUsed: string;
      heapTotal: string;
      external: string;
      rss: string;
    };
  };
  uptime: {
    system: string;
    process: string;
  };
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [formattedMetrics, setFormattedMetrics] = useState<FormattedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ time: string; cpu: number; memory: number }>>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch both raw and formatted metrics
      const [rawResponse, formattedResponse] = await Promise.all([
        fetch('/api/monitoring?format=raw'),
        fetch('/api/monitoring?format=formatted'),
      ])

      if (!rawResponse.ok || !formattedResponse.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const rawData = await rawResponse.json()
      const formattedData = await formattedResponse.json()

      if (rawData.success && formattedData.success) {
        setMetrics(rawData.data)
        setFormattedMetrics(formattedData.data)

        // Add to history
        const now = new Date().toLocaleTimeString()
        setHistory((prev) => {
          const newHistory = [
            ...prev,
            { time: now, cpu: rawData.data.cpu.usage, memory: rawData.data.memory.usage },
          ]
          // Keep only last 20 data points
          return newHistory.slice(-20)
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchMetrics()

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 5000) // Refresh every 5 seconds
      setRefreshInterval(interval)
      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [autoRefresh])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getUsageColor = (usage: number): string => {
    if (usage < 50) return "bg-green-500"
    if (usage < 75) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time CPU and RAM usage metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Pause" : "Resume"} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {metrics && formattedMetrics && (
        <>
          {/* CPU and Memory Overview Cards */}
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
                  <div>Used: {formattedMetrics.memory.used} / {formattedMetrics.memory.total}</div>
                  <div>Free: {formattedMetrics.memory.free}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Process Memory Details */}
          <Card>
            <CardHeader>
              <CardTitle>Process Memory Details</CardTitle>
              <CardDescription>
                Node.js process memory usage
              </CardDescription>
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

          {/* Uptime Information */}
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

          {/* Usage History Chart */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
                <CardDescription>
                  CPU and Memory usage over time (last 20 measurements)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cpu"
                        stroke="hsl(var(--primary))"
                        name="CPU Usage %"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="memory"
                        stroke="hsl(var(--accent))"
                        name="Memory Usage %"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Updated */}
          <div className="text-sm text-muted-foreground text-center">
            Last updated: {formattedMetrics.timestamp}
          </div>
        </>
      )}
    </div>
  )
}
