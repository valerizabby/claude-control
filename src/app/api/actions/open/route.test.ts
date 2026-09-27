import { beforeEach, describe, expect, it, vi } from "vitest";

const sendText = vi.fn();

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
});
