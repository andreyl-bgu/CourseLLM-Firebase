/**
 * Monitoring Service
 * Collects CPU and RAM usage metrics for the application runtime.
 *
 * Note: These are *process/host* metrics for the current Node.js instance.
 * For multi-instance production metrics (App Hosting/Cloud Run), use GCP Monitoring.
 */
import * as os from 'os';
import { performance } from 'perf_hooks';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number; // CPU usage percentage (0-100)
    loadAverage: number[]; // 1, 5, 15 minute load averages
    cores: number; // Number of CPU cores
  };
  memory: {
    total: number; // Total memory in bytes
    free: number; // Free memory in bytes
    used: number; // Used memory in bytes
    usage: number; // Memory usage percentage (0-100)
    processMemory: {
      heapUsed: number; // Node.js heap used in bytes
      heapTotal: number; // Node.js heap total in bytes
      external: number; // External memory in bytes
      rss: number; // Resident Set Size in bytes
    };
  };
  uptime: {
    system: number; // System uptime in seconds
    process: number; // Process uptime in seconds
  };
}

// Store previous CPU times for calculating usage
let previousCpuTimes: NodeJS.CpuUsage | null = null;
let previousTimestamp: number | null = null;

/**
 * Calculate CPU usage percentage based on previous measurement.
 * First call returns 0 because there is no baseline.
 */
function calculateCpuUsage(): number {
  const currentCpuUsage = process.cpuUsage();
  const currentTimestamp = performance.now();

  if (previousCpuTimes === null || previousTimestamp === null) {
    previousCpuTimes = currentCpuUsage;
    previousTimestamp = currentTimestamp;
    return 0;
  }

  const userDiff = currentCpuUsage.user - previousCpuTimes.user;
  const systemDiff = currentCpuUsage.system - previousCpuTimes.system;
  const timeDiff = (currentTimestamp - previousTimestamp) * 1000; // Convert to microseconds

  const totalCpuTime = userDiff + systemDiff;
  const cores = Math.max(1, os.cpus().length);
  // Normalize CPU time by wall time * core count so result stays in 0-100%.
  const cpuUsagePercent = (totalCpuTime / (timeDiff * cores)) * 100;

  // Update previous values
  previousCpuTimes = currentCpuUsage;
  previousTimestamp = currentTimestamp;

  // Clamp to 0-100
  return Math.min(100, Math.max(0, cpuUsagePercent));
}

/**
 * Get current system metrics
 */
export function getSystemMetrics(): SystemMetrics {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = (usedMem / totalMem) * 100;

  const processMemory = process.memoryUsage();

  return {
    timestamp: Date.now(),
    cpu: {
      usage: calculateCpuUsage(),
      loadAverage: os.loadavg(),
      cores: os.cpus().length,
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usage: memUsagePercent,
      processMemory: {
        heapUsed: processMemory.heapUsed,
        heapTotal: processMemory.heapTotal,
        external: processMemory.external,
        rss: processMemory.rss,
      },
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime(),
    },
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export type FormattedMetrics = {
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
};

/**
 * Get formatted metrics for display
 */
export function getFormattedMetrics(): FormattedMetrics {
  const metrics = getSystemMetrics();

  return {
    timestamp: new Date(metrics.timestamp).toISOString(),
    cpu: {
      usage: `${metrics.cpu.usage.toFixed(2)}%`,
      loadAverage: metrics.cpu.loadAverage.map((avg) => avg.toFixed(2)).join(', '),
      cores: metrics.cpu.cores,
    },
    memory: {
      total: formatBytes(metrics.memory.total),
      free: formatBytes(metrics.memory.free),
      used: formatBytes(metrics.memory.used),
      usage: `${metrics.memory.usage.toFixed(2)}%`,
      processMemory: {
        heapUsed: formatBytes(metrics.memory.processMemory.heapUsed),
        heapTotal: formatBytes(metrics.memory.processMemory.heapTotal),
        external: formatBytes(metrics.memory.processMemory.external),
        rss: formatBytes(metrics.memory.processMemory.rss),
      },
    },
    uptime: {
      system: formatUptime(metrics.uptime.system),
      process: formatUptime(metrics.uptime.process),
    },
  };
}

/**
 * Format uptime in seconds to human-readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Initialize monitoring (call this once to start tracking CPU usage)
 */
export function initializeMonitoring(): void {
  // Initialize CPU tracking by getting first measurement
  getSystemMetrics();
  console.log('[Monitoring] System monitoring initialized');
}

