import { beforeEach, describe, expect, it, vi } from "vitest";

const sendText = vi.fn();
const execFile = vi.fn();

vi.mock("child_process", async (importOriginal) => ({
  ...(await importOriginal<typeof import("child_process")>()),
  execFile: (cmd: string, args: string[], opts: unknown, cb?: unknown) =>
    execFile(cmd, args, typeof opts === "function" ? opts : cb),
}));
vi.mock("@/lib/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/config")>()),
  loadConfig: vi.fn().mockResolvedValue({ editor: "vscode" }),
}));
vi.mock("@/lib/shell-env", () => ({ getShellEnv: vi.fn().mockResolvedValue({}) }));

vi.mock("@/lib/terminal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/terminal")>()),
  buildProcessTree: vi.fn().mockResolvedValue(new Map()),
  detectAllTmuxPanes: vi.fn().mockResolvedValue(new Map()),
  detectTerminal: vi.fn().mockResolvedValue({ app: "jetbrains", appName: "GoLand", pid: 1, inTmux: false, tty: "" }),
  sendText: (...args: unknown[]) => sendText(...args),
}));

const { POST } = await import("./route");
const { UnsupportedTerminalError } = await import("@/lib/terminal");

function post(body: unknown) {
  return POST(new Request("http://localhost/api/actions/open", { method: "POST", body: JSON.stringify(body) }));
}

describe("POST /api/actions/open", () => {
  beforeEach(() => {
    sendText.mockReset();
  });

  it("returns 422 with the hint when the terminal can't receive input", async () => {
    sendText.mockImplementation(async () => {
      throw new UnsupportedTerminalError("GoLand");
    });

    const res = await post({ action: "send-message", pid: 1, message: "/create-pr" });

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.code).toBe("unsupported-terminal");
    expect(data.error).toContain("GoLand");
    expect(data.error).toContain("tmux");
  });

  it("returns ok when sending succeeds", async () => {
    sendText.mockResolvedValue(undefined);

    const res = await post({ action: "send-message", pid: 1, message: "/create-pr" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("keeps 500 for other failures", async () => {
    sendText.mockImplementation(async () => {
      throw new Error("boom");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await post({ action: "send-message", pid: 1, message: "hi" });

    expect(res.status).toBe(500);
  });

  it("opens the editor app bundle, falling back to its CLI when the bundle is missing", async () => {
    execFile.mockImplementation((cmd, _args, cb) => cb(cmd === "open" ? new Error("no app") : null, "", ""));

    const res = await post({ action: "editor", path: "/tmp" });

    expect(res.status).toBe(200);
    expect(execFile.mock.calls.map((c) => [c[0], c[1]])).toEqual([
      ["open", ["-a", "Visual Studio Code", "/tmp"]],
      ["code", ["/tmp"]],
    ]);
  });
});
