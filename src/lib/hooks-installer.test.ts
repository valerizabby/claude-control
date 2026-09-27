import { mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

let home: string;
let settingsPath: string;

async function install() {
  vi.resetModules();
  vi.doMock("os", async (importOriginal) => ({
    ...(await importOriginal<typeof import("os")>()),
    homedir: () => home,
  }));
  const { ensureHooksInstalled } = await import("./hooks-installer");
  return ensureHooksInstalled();
}

describe("ensureHooksInstalled", () => {
  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "cc-hooks-"));
    mkdirSync(join(home, ".claude"));
    settingsPath = join(home, ".claude", "settings.json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("leaves an unparseable settings.json untouched and returns false", async () => {
    writeFileSync(settingsPath, '{ "model": "opus", broken');

    expect(await install()).toBe(false);
    expect(readFileSync(settingsPath, "utf-8")).toBe('{ "model": "opus", broken');
    expect(readdirSync(join(home, ".claude"))).toEqual(["settings.json"]);
  });

  it("backs up, keeps existing keys and writes atomically", async () => {
    const original = JSON.stringify({ model: "opus", hooks: { Stop: [{ matcher: "", hooks: [] }] } });
    writeFileSync(settingsPath, original);

    expect(await install()).toBe(true);
    const written = JSON.parse(readFileSync(settingsPath, "utf-8"));
    expect(written.model).toBe("opus");
    expect(written.hooks.Stop).toHaveLength(2);
    expect(written.hooks.SessionStart).toHaveLength(1);
    expect(readFileSync(`${settingsPath}.bak`, "utf-8")).toBe(original);
    expect(readdirSync(join(home, ".claude")).sort()).toEqual(["settings.json", "settings.json.bak"]);
  });

  it("writes through a symlinked settings.json instead of replacing the link", async () => {
    const real = join(home, "dotfiles-settings.json");
    writeFileSync(real, "{}");
    symlinkSync(real, settingsPath);

    expect(await install()).toBe(true);
    expect(JSON.parse(readFileSync(real, "utf-8")).hooks.Stop).toHaveLength(1);
    expect(readFileSync(settingsPath, "utf-8")).toBe(readFileSync(real, "utf-8"));
  });
});
