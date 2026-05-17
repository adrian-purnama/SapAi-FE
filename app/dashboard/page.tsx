"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Copy } from "lucide-react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { getAuthSession } from "@/lib/auth-client";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

/** Read JWT from storage so requests work on first paint after reload (context token hydrates one tick later). */
function bearerAuthHeaders(): HeadersInit | undefined {
  const t = getAuthSession()?.token;
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}

type ApiKeyJobStats = {
  totalJobs: number;
  completed: number;
  failed: number;
  cancelled: number;
  inFlight: number;
  totalTokens: number;
  lastJobAt: string | null;
};

type ApiKeyListItem = {
  id: string;
  label: string;
  prefix: string;
  ipAllowlist?: string[];
  ipAllowlistCount: number;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
  primaryKey: boolean;
  isDisabled: boolean;
  stats: ApiKeyJobStats;
};

export default function DashboardPage() {
  const { user } = useSapAi();

  const [keysLoading, setKeysLoading] = useState(true);
  const [keysLoadFailed, setKeysLoadFailed] = useState(false);
  const [keys, setKeys] = useState<ApiKeyListItem[]>([]);

  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyAllowlist, setNewKeyAllowlist] = useState("");
  const [createKeyLoading, setCreateKeyLoading] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [ipMode, setIpMode] = useState<"allow_all" | "my_ip">("allow_all");
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    setKeysLoading(true);
    setKeysLoadFailed(false);
    try {
      const auth = bearerAuthHeaders();
      if (!auth) {
        setKeys([]);
        return;
      }
      const response = await fetch(joinServerApiPath("/api/v1/api-keys"), {
        method: "GET",
        headers: auth,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load API keys.");
      }
      const raw = (payload?.data?.keys ?? []) as ApiKeyListItem[];
      const emptyStats: ApiKeyJobStats = {
        totalJobs: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        inFlight: 0,
        totalTokens: 0,
        lastJobAt: null,
      };
      const nextKeys = raw.map((k) => ({
        ...k,
        primaryKey: Boolean(k.primaryKey),
        isDisabled: Boolean(k.isDisabled),
        stats: k.stats ?? emptyStats,
      }));
      setKeys(nextKeys);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load API keys.";
      setKeysLoadFailed(true);
      toastError(message, { id: "dashboard-keys" });
    } finally {
      setKeysLoading(false);
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadKeys();
    }, 0);
    return () => {
      window.clearTimeout(t);
    };
  }, []);

  const activeKeys = useMemo(
    () => keys.filter((k) => !k.revokedAt && !k.isDisabled),
    [keys],
  );

  async function loadMyIpIntoAllowlist() {
    try {
      const response = await fetch(joinServerApiPath("/api/v1/client-ip"), {
        method: "GET",
        headers: bearerAuthHeaders(),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) return;
      const ip = String(payload?.data?.ip ?? "").trim();
      if (ip) setNewKeyAllowlist(ip);
    } catch {
      // ignore
    }
  }

  async function onCreateApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatedApiKey("");

    const label = newKeyLabel.trim();
    if (!label) {
      toastError("Label is required.", { id: "dashboard-create-key" });
      return;
    }

    setCreateKeyLoading(true);
    try {
      const response = await fetch(joinServerApiPath("/api/v1/api-keys"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...bearerAuthHeaders(),
        },
        body: JSON.stringify({
          label,
          ipAllowlist:
            ipMode === "allow_all"
              ? "0.0.0.0"
              : newKeyAllowlist.trim()
                ? newKeyAllowlist
                : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to create API key.");
      }

      const apiKey = String(payload?.data?.apiKey ?? "");
      setCreatedApiKey(apiKey);
      setModalOpen(true);
      toastSuccess("Project key created. Copy it now — it is only shown once.", { id: "dashboard-create-key" });
      await loadKeys();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create API key.";
      toastError(message, { id: "dashboard-create-key" });
    } finally {
      setCreateKeyLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-10">
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Each <strong className="font-medium text-zinc-800">API key</strong> is a project. Open a
          project for chat job history, token usage, and status breakdown.
        </p>
        {/* <p className="mt-2 max-w-2xl text-zinc-600">
          Signed in as{" "}
          <span className="font-medium text-zinc-800">{user?.email ?? "—"}</span>
          {user?.isAdmin ? (
            <span className="ml-2 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
              Admin
            </span>
          ) : null}
          . This page is protected by middleware; use it as the hub for post-login flows.
        </p> */}
      </div>

      {/* <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Projects", value: "—", hint: "Wire to your API" },
          { label: "Tasks", value: "—", hint: "Placeholder metric" },
          { label: "Activity", value: "—", hint: "Placeholder metric" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{card.hint}</p>
          </div>
        ))}
      </div> */}

      <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Projects</h2>
            <p className="mt-2 text-sm text-zinc-600">
              One API key per project. Create keys for server-to-server access; you only see the secret
              once when it is created.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-600">
              Active: <span className="font-semibold text-zinc-900">{activeKeys.length}</span>
            </div>
            <button
              type="button"
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={() => {
                setCreatedApiKey("");
                setCopied(false);
                setNewKeyLabel("");
                setNewKeyAllowlist("0.0.0.0");
                setIpMode("allow_all");
                setModalOpen(true);
              }}
            >
              New project key
            </button>
          </div>
        </div>

        <div className="mt-6">
          {keysLoading ? (
            <p className="text-zinc-600">Loading…</p>
          ) : keysLoadFailed ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-zinc-600">Could not load projects.</p>
              <button
                type="button"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                onClick={() => void loadKeys()}
              >
                Retry
              </button>
            </div>
          ) : keys.length === 0 ? (
            <p className="text-zinc-600">No API keys yet.</p>
          ) : (
            <div className="grid gap-2">
              {keys.map((k) => {
                const canOpen = !k.revokedAt && !k.isDisabled;
                return (
                <div
                  key={k.id}
                  className={[
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
                    k.isDisabled && !k.revokedAt
                      ? "border-zinc-200 bg-zinc-50/80 opacity-80"
                      : "border-zinc-200 bg-white",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {canOpen ? (
                        <Link
                          href={`/dashboard/projects/${encodeURIComponent(k.id)}`}
                          className="truncate font-semibold text-zinc-900 hover:text-zinc-600 hover:underline"
                        >
                          {k.label}
                        </Link>
                      ) : (
                        <span className="truncate font-semibold text-zinc-600">{k.label}</span>
                      )}
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                        {k.prefix}…
                      </span>
                      {k.primaryKey && !k.revokedAt ? (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
                          Primary
                        </span>
                      ) : null}
                      {k.isDisabled && !k.revokedAt ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          Disabled
                        </span>
                      ) : null}
                      {k.revokedAt ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Revoked
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Allowlist: {k.ipAllowlistCount || 0} IP(s) · Key last used:{" "}
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </div>
                    <div className="mt-1 text-xs tabular-nums text-zinc-600">
                      <span className="font-medium text-zinc-800">{k.stats.totalJobs}</span> chat jobs
                      {k.stats.totalJobs > 0 ? (
                        <>
                          {" "}
                          · <span className="text-emerald-700">{k.stats.completed}</span> done ·{" "}
                          <span className="text-red-700">{k.stats.failed}</span> failed
                          {k.stats.inFlight > 0 ? (
                            <>
                              {" "}
                              · <span className="text-amber-700">{k.stats.inFlight}</span> in flight
                            </>
                          ) : null}
                          {" "}
                          · {k.stats.totalTokens.toLocaleString()} tokens · last job{" "}
                          {k.stats.lastJobAt
                            ? new Date(k.stats.lastJobAt).toLocaleString()
                            : "—"}
                        </>
                      ) : null}
                    </div>
                  </div>

                  {canOpen ? (
                    <Link
                      href={`/dashboard/projects/${encodeURIComponent(k.id)}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      aria-label={`Open project: ${k.label}`}
                      title="Open project"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </Link>
                  ) : (
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-300"
                      aria-hidden
                    >
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/30"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Generate API key</h3>
                <p className="mt-1 text-sm text-zinc-600">Create a key and copy it once.</p>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>

            {createdApiKey ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Copy your API key now.</p>
                <p className="mt-1 text-sm text-amber-900/80">
                  This is the only time you will be able to view it. Store it securely.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-zinc-900">
                    {createdApiKey}
                  </code>
                  <button
                    type="button"
                    className={[
                      "inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-zinc-800 active:scale-[0.98] sm:w-auto",
                      copied ? "scale-[1.04] ring-2 ring-zinc-900/10 shadow-md" : "ring-0 shadow-none",
                    ].join(" ")}
                    onClick={() => void copyToClipboard(createdApiKey)}
                  >
                    {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-5 grid gap-3" onSubmit={onCreateApiKey}>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-zinc-800">Label</span>
                  <input
                    className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder="e.g. Production server"
                    required
                  />
                </label>

                <div className="grid gap-2">
                  <div className="text-sm font-medium text-zinc-800">IP access</div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="ipMode"
                        checked={ipMode === "allow_all"}
                        onChange={() => {
                          setIpMode("allow_all");
                          setNewKeyAllowlist("0.0.0.0");
                        }}
                      />
                      Allow all (0.0.0.0)
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="ipMode"
                        checked={ipMode === "my_ip"}
                        onChange={() => {
                          setIpMode("my_ip");
                          void loadMyIpIntoAllowlist();
                        }}
                      />
                      Only my current IP
                    </label>
                  </div>

                  {ipMode === "allow_all" ? (
                    <label className="grid gap-1.5 text-sm">
                      <span className="text-zinc-600">Allowlist (sent as allow-all)</span>
                      <textarea
                        readOnly
                        aria-readonly="true"
                        className="min-h-[70px] cursor-default rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-800"
                        value="0.0.0.0"
                      />
                    </label>
                  ) : (
                    <label className="grid gap-1.5 text-sm">
                      <span className="text-zinc-600">Allowlist (exact IPs, one per line)</span>
                      <textarea
                        className="min-h-[70px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                        value={newKeyAllowlist}
                        onChange={(e) => setNewKeyAllowlist(e.target.value)}
                        placeholder="203.0.113.10"
                      />
                    </label>
                  )}
                </div>

                <button
                  className="mt-1 h-[42px] cursor-pointer rounded-lg bg-zinc-900 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={createKeyLoading}
                >
                  {createKeyLoading ? "Generating..." : "Generate"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-10 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Quick links</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Link
              href="/account"
              className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Account
            </Link>
          </li>
          <li>
            <Link
              href="/docs/api"
              className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              API preview
            </Link>
          </li>
          {user?.isAdmin ? (
            <li>
              <Link
                href="/admin"
                className="inline-flex rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
              >
                Admin settings
              </Link>
            </li>
          ) : null}
          <li>
            <Link
              href="/"
              className="inline-flex rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Landing
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
