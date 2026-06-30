import { describe, expect, it, vi } from "vitest";
import { executeRestart } from "./restart";

describe("executeRestart", () => {
  it("kills existing process then starts a new one", async () => {
    const mockManager = {
      resolve: vi.fn().mockReturnValue({
        ok: true,
        info: { id: "proc_1", name: "server" },
      }),
      kill: vi.fn().mockResolvedValue({
        ok: true,
        info: { id: "proc_1", name: "server", status: "killed" },
      }),
      start: vi.fn().mockReturnValue({
        id: "proc_2",
        name: "server",
        pid: 1234,
        startTime: Date.now(),
        stdoutFile: "/tmp/proc_2-stdout.log",
        stderrFile: "/tmp/proc_2-stderr.log",
      }),
    } as const;

    const result = await executeRestart(
      { name: "server", command: "pnpm dev" },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(result.details.success).toBe(true);
    expect(result.details.message).toContain("Restarted");
    expect(mockManager.kill).toHaveBeenCalledWith("proc_1", {
      signal: "SIGTERM",
      timeoutMs: 3000,
    });
    expect(mockManager.start).toHaveBeenCalledWith(
      "server",
      "pnpm dev",
      process.cwd(),
    );
  });

  it("returns error when no process is running", async () => {
    const mockManager = {
      resolve: vi.fn().mockReturnValue({
        ok: false,
        reason: "not_found",
      }),
      kill: vi.fn(),
      start: vi.fn(),
    } as const;

    const result = await executeRestart(
      { name: "server", command: "pnpm dev" },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(result.details.success).toBe(false);
    expect(result.details.message).toContain(
      'No process named "server" is running',
    );
    expect(mockManager.kill).not.toHaveBeenCalled();
    expect(mockManager.start).not.toHaveBeenCalled();
  });

  it("returns error when kill fails", async () => {
    const mockManager = {
      resolve: vi.fn().mockReturnValue({
        ok: true,
        info: { id: "proc_1", name: "server" },
      }),
      kill: vi.fn().mockResolvedValue({
        ok: false,
        info: { id: "proc_1", name: "server", status: "terminate_timeout" },
        reason: "timeout",
      }),
      start: vi.fn(),
    } as const;

    const result = await executeRestart(
      { name: "server", command: "pnpm dev" },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(result.details.success).toBe(false);
    expect(result.details.message).toContain("Failed to kill");
    expect(mockManager.start).not.toHaveBeenCalled();
  });

  it("rejects missing name", async () => {
    const mockManager = {
      resolve: vi.fn(),
      kill: vi.fn(),
      start: vi.fn(),
    } as const;

    const result = await executeRestart(
      { command: "pnpm dev" },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(result.details.success).toBe(false);
    expect(result.details.message).toContain("Missing required parameter: name");
    expect(mockManager.resolve).not.toHaveBeenCalled();
  });

  it("rejects missing command", async () => {
    const mockManager = {
      resolve: vi.fn(),
      kill: vi.fn(),
      start: vi.fn(),
    } as const;

    const result = await executeRestart(
      { name: "server" },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(result.details.success).toBe(false);
    expect(result.details.message).toContain(
      "Missing required parameter: command",
    );
    expect(mockManager.resolve).not.toHaveBeenCalled();
  });

  it("passes force=true to kill", async () => {
    const mockManager = {
      resolve: vi.fn().mockReturnValue({
        ok: true,
        info: { id: "proc_1", name: "server" },
      }),
      kill: vi.fn().mockResolvedValue({
        ok: true,
        info: { id: "proc_1", name: "server", status: "killed" },
      }),
      start: vi.fn().mockReturnValue({
        id: "proc_2",
        name: "server",
        pid: 1234,
        startTime: Date.now(),
        stdoutFile: "/tmp/proc_2-stdout.log",
        stderrFile: "/tmp/proc_2-stderr.log",
      }),
    } as const;

    await executeRestart(
      { name: "server", command: "pnpm dev", force: true },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(mockManager.kill).toHaveBeenCalledWith("proc_1", {
      signal: "SIGKILL",
      timeoutMs: 200,
    });
  });

  it("uses provided cwd instead of session cwd", async () => {
    const mockManager = {
      resolve: vi.fn().mockReturnValue({
        ok: true,
        info: { id: "proc_1", name: "server" },
      }),
      kill: vi.fn().mockResolvedValue({
        ok: true,
        info: { id: "proc_1", name: "server", status: "killed" },
      }),
      start: vi.fn().mockReturnValue({
        id: "proc_2",
        name: "server",
        pid: 1234,
        startTime: Date.now(),
        stdoutFile: "/tmp/proc_2-stdout.log",
        stderrFile: "/tmp/proc_2-stderr.log",
      }),
    } as const;

    await executeRestart(
      { name: "server", command: "pnpm dev", cwd: "/custom/path" },
      mockManager as never,
      { cwd: process.cwd() } as never,
    );

    expect(mockManager.start).toHaveBeenCalledWith(
      "server",
      "pnpm dev",
      "/custom/path",
    );
  });
});
