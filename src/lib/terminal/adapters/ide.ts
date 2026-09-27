import { basename } from "path";
import type { TerminalInfo } from "../types";
import { escapeForAppleScript, execFileAsync, OSASCRIPT_TIMEOUT_MS, UnsupportedTerminalError } from "./shared";
import type { TerminalAdapter } from "./types";

/**
 * IDE integrated terminals (VS Code, Cursor, Windsurf, JetBrains). There's no API to type into
 * the terminal panel, and System Events keystrokes would land in whatever has focus — often the
 * editor — so sending is refused. Sessions running in tmux never reach this adapter for input.
 */
export const ideAdapter: TerminalAdapter = {
  async focus(info: TerminalInfo): Promise<void> {
    await execFileAsync("open", ["-a", info.appName], { timeout: OSASCRIPT_TIMEOUT_MS });
    if (!info.cwd) return;

    // Raise the project window whose title contains the session's folder name. Not `code -r <cwd>` /
    // `idea <cwd>`: for a folder that isn't open (subdir, worktree) those open or replace a project.
    // ponytail: title substring match, "api" also matches "api-gateway"; fine until someone hits it
    const appName = escapeForAppleScript(info.appName);
    const folder = escapeForAppleScript(basename(info.cwd));
    const script = `set bid to id of application "${appName}"
tell application "System Events" to tell (first application process whose bundle identifier is bid)
  repeat with w in windows
    if name of w contains "${folder}" then
      perform action "AXRaise" of w
      exit repeat
    end if
  end repeat
end tell`;
    try {
      await execFileAsync("osascript", ["-e", script], { timeout: OSASCRIPT_TIMEOUT_MS });
    } catch {
      // Best-effort: without Accessibility permission the IDE is still brought to front
    }
  },

  async sendText(info: TerminalInfo): Promise<void> {
    throw new UnsupportedTerminalError(info.appName);
  },

  async sendKeystroke(info: TerminalInfo): Promise<void> {
    throw new UnsupportedTerminalError(info.appName);
  },

  async createSession(): Promise<void> {
    throw new UnsupportedTerminalError("IDE");
  },
};
