"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useResolveNames } from "@/lib/use-resolve-names";

type Flag = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  reviewed_by: string | null;
  created_at: string;
};

type Strike = {
  id: string;
  user_id: string;
  contract_id: string | null;
  type: string;
  reason: string;
  auto_generated: boolean;
  created_at: string;
};

type AdminAction = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  created_at: string;
};

type Tab = "flags" | "strikes" | "actions";

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>("flags");
  const [flags, setFlags] = useState<Flag[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null);
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [f, s, a] = await Promise.all([
      supabase
        .from("flags")
        .select("id, reporter_id, target_type, target_id, reason, status, reviewed_by, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("strikes")
        .select("id, user_id, contract_id, type, reason, auto_generated, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("admin_actions")
        .select("id, admin_id, action, target_type, target_id, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setFlags((f.data as Flag[]) ?? []);
    setStrikes((s.data as Strike[]) ?? []);
    setActions((a.data as AdminAction[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
     
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on mount
    load();
  }, [load]);

  const allUserIds = useMemo(() => [
    ...flags.map((f) => f.reporter_id),
    ...flags.map((f) => f.reviewed_by).filter(Boolean) as string[],
    ...strikes.map((s) => s.user_id),
    ...actions.map((a) => a.admin_id),
  ], [flags, strikes, actions]);
  const { userName } = useResolveNames(allUserIds);

  const reviewFlag = async (
    flagId: string,
    status: "action_taken" | "dismissed"
  ) => {
    if (!confirm(`Mark this flag as "${status === "dismissed" ? "Dismissed" : "Action Taken"}"?`)) return;
    setActionLoading(flagId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("flags")
      .update({ status, reviewed_by: user?.id ?? null })
      .eq("id", flagId);
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action: "dismiss_flag",
        target_type: "flag",
        target_id: flagId,
        reason: status === "dismissed" ? "Dismissed" : "Action taken",
      });
    }
    await load();
    setActionLoading(null);
  };

  const issueStrike = async () => {
    const userId = prompt("User ID (full UUID):");
    if (!userId) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      alert("Invalid UUID format. Must be a valid UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)");
      return;
    }
    const type = prompt("Strike type (soft or hard):");
    if (type !== "soft" && type !== "hard") {
      alert("Must be 'soft' or 'hard'");
      return;
    }
    const reason = prompt("Reason:");
    if (!reason) return;
    if (!confirm(`Issue ${type} strike to user ${userId}?\n\nReason: ${reason}`)) return;

    await supabase.from("strikes").insert({
      user_id: userId,
      type,
      reason,
      auto_generated: false,
    });

    // Update strike count on profile
    const field = type === "soft" ? "strikes_soft" : "strikes_hard";
    const { data: profile } = await supabase
      .from("profiles")
      .select(field)
      .eq("id", userId)
      .single();
    if (profile) {
      await supabase
        .from("profiles")
        .update({ [field]: ((profile as Record<string, number>)[field] ?? 0) + 1 })
        .eq("id", userId);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action: "issue_strike",
        target_type: "user",
        target_id: userId,
        reason,
        metadata: { strike_type: type },
      });
    }

    await load();
  };

  const pendingFlags = flags.filter((f) => f.status === "pending");

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      action_taken: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border p-1">
          {(["flags", "strikes", "actions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedFlag(null); setSelectedStrike(null); setSelectedAction(null); }}
              className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                tab === t
                  ? "bg-accent-green text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
              {t === "flags" && pendingFlags.length > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                  {pendingFlags.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "strikes" && (
          <button
            onClick={issueStrike}
            className="rounded-md bg-accent-green px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-green/90"
          >
            Issue Strike
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {tab === "flags" && (
            <div className="space-y-4">
              {selectedFlag && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Flag Details</h3>
                    <button onClick={() => setSelectedFlag(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Flag ID: </span><span className="font-mono text-xs">{selectedFlag.id}</span></div>
                    <div><span className="text-muted-foreground">Reporter: </span>{userName(selectedFlag.reporter_id)}</div>
                    <div><span className="text-muted-foreground">Target Type: </span>{selectedFlag.target_type}</div>
                    <div><span className="text-muted-foreground">Target ID: </span><span className="font-mono text-xs">{selectedFlag.target_id}</span></div>
                    <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedFlag.status)}`}>{selectedFlag.status.replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Reviewed By: </span>{userName(selectedFlag.reviewed_by)}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedFlag.created_at).toLocaleString()}</div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="text-sm mt-1">{selectedFlag.reason}</p>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Reporter</th>
                    <th className="px-3 py-2 text-left font-medium">Target</th>
                    <th className="px-3 py-2 text-left font-medium">Reason</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedFlag(selectedFlag?.id === f.id ? null : f)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedFlag?.id === f.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {userName(f.reporter_id)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs">
                          {f.target_type}:{f.target_id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {f.reason}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(f.status)}`}
                        >
                          {f.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        {f.status === "pending" && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); reviewFlag(f.id, "action_taken"); }}
                              disabled={actionLoading === f.id}
                              className="rounded-md bg-accent-green/10 px-2.5 py-1 text-xs font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:opacity-50"
                            >
                              {actionLoading === f.id ? "…" : "Act"}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); reviewFlag(f.id, "dismissed"); }}
                              disabled={actionLoading === f.id}
                              className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {flags.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No flags found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {tab === "strikes" && (
            <div className="space-y-4">
              {selectedStrike && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Strike Details</h3>
                    <button onClick={() => setSelectedStrike(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Strike ID: </span><span className="font-mono text-xs">{selectedStrike.id}</span></div>
                    <div><span className="text-muted-foreground">User: </span>{userName(selectedStrike.user_id)}</div>
                    <div><span className="text-muted-foreground">Contract: </span><span className="font-mono text-xs">{selectedStrike.contract_id ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Type: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${selectedStrike.type === "hard" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}`}>{selectedStrike.type}</span></div>
                    <div><span className="text-muted-foreground">Auto Generated: </span>{selectedStrike.auto_generated ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedStrike.created_at).toLocaleString()}</div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="text-sm mt-1">{selectedStrike.reason.replace(/_/g, " ")}</p>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">User</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Reason</th>
                    <th className="px-3 py-2 text-left font-medium">Auto</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {strikes.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStrike(selectedStrike?.id === s.id ? null : s)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedStrike?.id === s.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {userName(s.user_id)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.type === "hard"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {s.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {s.reason.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-2">
                        {s.auto_generated ? "Auto" : "Manual"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {strikes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        No strikes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {tab === "actions" && (
            <div className="space-y-4">
              {selectedAction && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Admin Action Details</h3>
                    <button onClick={() => setSelectedAction(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Action ID: </span><span className="font-mono text-xs">{selectedAction.id}</span></div>
                    <div><span className="text-muted-foreground">Admin: </span>{userName(selectedAction.admin_id)}</div>
                    <div><span className="text-muted-foreground">Action: </span>{selectedAction.action.replace(/_/g, " ")}</div>
                    <div><span className="text-muted-foreground">Target Type: </span>{selectedAction.target_type ?? "—"}</div>
                    <div><span className="text-muted-foreground">Target ID: </span><span className="font-mono text-xs">{selectedAction.target_id ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedAction.created_at).toLocaleString()}</div>
                  </div>
                  {selectedAction.reason && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="text-sm mt-1">{selectedAction.reason}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Admin</th>
                    <th className="px-3 py-2 text-left font-medium">Action</th>
                    <th className="px-3 py-2 text-left font-medium">Target</th>
                    <th className="px-3 py-2 text-left font-medium">Reason</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedAction(selectedAction?.id === a.id ? null : a)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedAction?.id === a.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {userName(a.admin_id)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {a.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {a.target_type && a.target_id
                          ? `${a.target_type}:${a.target_id.slice(0, 8)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 max-w-[200px] truncate">
                        {a.reason ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {actions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        No admin actions logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
