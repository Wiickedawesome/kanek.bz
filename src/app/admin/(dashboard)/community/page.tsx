"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAdminActionErrorMessage,
  getAdminCommunityData,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";

type RoadReport = {
  id: string;
  reporter_id: string;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  upvotes: number;
  expires_at: string;
  created_at: string;
};

type GasPrice = {
  id: string;
  reporter_id: string;
  station_name: string;
  station_lat: number;
  station_lng: number;
  regular_cents: number | null;
  premium_cents: number | null;
  diesel_cents: number | null;
  verified_count: number;
  created_at: string;
};

type WaitlistEntry = {
  id: string;
  post_id: string;
  user_id: string;
  notified: boolean;
  created_at: string;
};

type Tab = "road_reports" | "gas_prices" | "waitlist";

const fmtGas = (cents: number | null) =>
  cents != null ? `$${(cents / 100).toFixed(2)}` : "—";

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("road_reports");
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [gas, setGas] = useState<GasPrice[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<RoadReport | null>(null);
  const [selectedGas, setSelectedGas] = useState<GasPrice | null>(null);
  const [selectedWaitlist, setSelectedWaitlist] = useState<WaitlistEntry | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminCommunityData<RoadReport, GasPrice, WaitlistEntry>();
      setReports(data.reports);
      setGas(data.gas);
      setWaitlist(data.waitlist);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setReports([]);
      setGas([]);
      setWaitlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allUserIds = useMemo(() => [
    ...reports.map((r) => r.reporter_id),
    ...gas.map((g) => g.reporter_id),
    ...waitlist.map((w) => w.user_id),
  ], [reports, gas, waitlist]);
  const allPostIds = useMemo(() => waitlist.map((w) => w.post_id), [waitlist]);
  const { userName, postTitle } = useResolveNames(allUserIds, allPostIds);

  const reportTypeColor = (type: string) => {
    const map: Record<string, string> = {
      accident: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      checkpoint: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      traffic: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      flooding: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      construction: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      road_damage: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return map[type] ?? "bg-muted text-muted-foreground";
  };

  const activeReports = reports.filter(
    (r) => new Date(r.expires_at) > new Date()
  );
  const expiredReports = reports.filter(
    (r) => new Date(r.expires_at) <= new Date()
  );

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Active Reports</p>
          <p className="text-lg font-semibold">{activeReports.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Gas Stations</p>
          <p className="text-lg font-semibold">{gas.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Waitlist Entries</p>
          <p className="text-lg font-semibold">{waitlist.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Expired Reports</p>
          <p className="text-lg font-semibold">{expiredReports.length}</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        {(["road_reports", "gas_prices", "waitlist"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedReport(null); setSelectedGas(null); setSelectedWaitlist(null); }}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === t
                ? "bg-accent-green text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {tab === "road_reports" && (
            <div className="space-y-4">
              {selectedReport && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Road Report</h3>
                    <button onClick={() => setSelectedReport(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Report ID: </span><span className="font-mono text-xs">{selectedReport.id}</span></div>
                    <div><span className="text-muted-foreground">Reporter: </span>{userName(selectedReport.reporter_id)}</div>
                    <div><span className="text-muted-foreground">Type: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${reportTypeColor(selectedReport.type)}`}>{selectedReport.type.replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Location: </span><span className="font-mono text-xs">{selectedReport.lat.toFixed(6)}, {selectedReport.lng.toFixed(6)}</span></div>
                    <div><span className="text-muted-foreground">Upvotes: </span>{selectedReport.upvotes}</div>
                    <div><span className="text-muted-foreground">Expires: </span>{new Date(selectedReport.expires_at).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedReport.created_at).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Status: </span>{new Date(selectedReport.expires_at) > new Date() ? "Active" : "Expired"}</div>
                  </div>
                  {selectedReport.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm mt-1">{selectedReport.description}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Location</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium">Upvotes</th>
                    <th className="px-3 py-2 text-left font-medium">Expires</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const expired = new Date(r.expires_at) <= new Date();
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReport(selectedReport?.id === r.id ? null : r)}
                        className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${expired ? "opacity-50" : ""} ${selectedReport?.id === r.id ? "bg-muted/40" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${reportTypeColor(r.type)}`}
                          >
                            {r.type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                        </td>
                        <td className="px-3 py-2 max-w-[200px] truncate">
                          {r.description ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right">{r.upvotes}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(r.expires_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          {expired ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              expired
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No road reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {tab === "gas_prices" && (
            <div className="space-y-4">
              {selectedGas && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{selectedGas.station_name}</h3>
                    <button onClick={() => setSelectedGas(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Station ID: </span><span className="font-mono text-xs">{selectedGas.id}</span></div>
                    <div><span className="text-muted-foreground">Reporter: </span>{userName(selectedGas.reporter_id)}</div>
                    <div><span className="text-muted-foreground">Location: </span><span className="font-mono text-xs">{selectedGas.station_lat.toFixed(6)}, {selectedGas.station_lng.toFixed(6)}</span></div>
                    <div><span className="text-muted-foreground">Regular: </span>{fmtGas(selectedGas.regular_cents)}</div>
                    <div><span className="text-muted-foreground">Premium: </span>{fmtGas(selectedGas.premium_cents)}</div>
                    <div><span className="text-muted-foreground">Diesel: </span>{fmtGas(selectedGas.diesel_cents)}</div>
                    <div><span className="text-muted-foreground">Verified: </span>{selectedGas.verified_count} time(s)</div>
                    <div><span className="text-muted-foreground">Reported: </span>{new Date(selectedGas.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Station</th>
                    <th className="px-3 py-2 text-left font-medium">Location</th>
                    <th className="px-3 py-2 text-right font-medium">Regular</th>
                    <th className="px-3 py-2 text-right font-medium">Premium</th>
                    <th className="px-3 py-2 text-right font-medium">Diesel</th>
                    <th className="px-3 py-2 text-right font-medium">Verified</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gas.map((g) => (
                    <tr
                      key={g.id}
                      onClick={() => setSelectedGas(selectedGas?.id === g.id ? null : g)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedGas?.id === g.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        {g.station_name}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {g.station_lat.toFixed(4)}, {g.station_lng.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fmtGas(g.regular_cents)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fmtGas(g.premium_cents)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fmtGas(g.diesel_cents)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {g.verified_count}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(g.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {gas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        No gas prices reported yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {tab === "waitlist" && (
            <div className="space-y-4">
              {selectedWaitlist && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Waitlist Entry</h3>
                    <button onClick={() => setSelectedWaitlist(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Entry ID: </span><span className="font-mono text-xs">{selectedWaitlist.id}</span></div>
                    <div><span className="text-muted-foreground">Post: </span>{postTitle(selectedWaitlist.post_id)}</div>
                    <div><span className="text-muted-foreground">User: </span>{userName(selectedWaitlist.user_id)}</div>
                    <div><span className="text-muted-foreground">Notified: </span>{selectedWaitlist.notified ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedWaitlist.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Post</th>
                    <th className="px-3 py-2 text-left font-medium">User</th>
                    <th className="px-3 py-2 text-left font-medium">Notified</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWaitlist(selectedWaitlist?.id === w.id ? null : w)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedWaitlist?.id === w.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {postTitle(w.post_id)}
                      </td>
                      <td className="px-3 py-2">
                        {userName(w.user_id)}
                      </td>
                      <td className="px-3 py-2">
                        {w.notified ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Yes
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {waitlist.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        No waitlist entries found.
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
