import { formatBytes, getFormattedMetrics, getSystemMetrics } from "../monitoring-service";

describe("monitoring-service", () => {
  it("formatBytes formats common values", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("getSystemMetrics returns a stable shape with numeric values", () => {
    const m = getSystemMetrics();
    expect(typeof m.timestamp).toBe("number");
    expect(typeof m.cpu.usage).toBe("number");
    expect(Array.isArray(m.cpu.loadAverage)).toBe(true);
    expect(typeof m.cpu.cores).toBe("number");
    expect(typeof m.memory.total).toBe("number");
    expect(typeof m.memory.usage).toBe("number");
    expect(typeof m.uptime.process).toBe("number");
  });

  it("getFormattedMetrics returns formatted strings", () => {
    const m = getFormattedMetrics();
    expect(typeof m.timestamp).toBe("string");
    expect(m.cpu.usage).toMatch(/%$/);
    expect(m.memory.total).toMatch(/(Bytes|KB|MB|GB|TB)$/);
    expect(typeof m.uptime.process).toBe("string");
  });
});

