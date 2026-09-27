import { mutate } from "swr";

const REFRESH_DELAYS = [300, 700, 1200, 2000, 3000];

/** Burst SWR revalidations to catch backend state changes quickly after an action. */
export function refreshAfterAction() {
  for (const ms of REFRESH_DELAYS) {
    setTimeout(() => mutate("/api/sessions"), ms);
  }
}

/** POST to /api/actions/open. Throws with the server's error message (e.g. unsupported terminal) on failure. */
export async function postAction(body: Record<string, unknown>) {
  const response = await fetch("/api/actions/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Action failed: ${response.status}`);
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Send a keystroke to a Claude session via the API, then refresh. */
export async function sendKeystrokeAction(pid: number, keystroke: string) {
  await postAction({ action: "send-keystroke", pid, keystroke });
  refreshAfterAction();
}
