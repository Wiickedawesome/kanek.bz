"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAdminActionErrorMessage,
  getAdminCommunityData,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";

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

const fmtGas = (cents: number | null) =>
  cents != null ? `$${(cents / 100).toFixed(2)}` : "—";

export default function CommunityPage() {
  const [gas, setGas] = useState<GasPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGas, setSelectedGas] = useState<GasPrice | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminCommunityData<GasPrice>();
      setGas(data.gas);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setGas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allUserIds = useMemo(() => gas.map((g) => g.reporter_id), [gas]);
  const { userName } = useResolveNames(allUserIds, []);

  const regularCount = gas.filter((g) => g.regular_cents != null).length;
  const dieselCount = gas.filter((g) => g.diesel_cents != null).length;
  const verifiedStations = gas.filter((g) => g.verified_count > 0).length;

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Gas Stations</p>
          <p className="text-lg font-semibold">{gas.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Regular Priced</p>
          <p className="text-lg font-semibold">{regularCount}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Diesel Priced</p>
          <p className="text-lg font-semibold">{dieselCount}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Verified Stations</p>
          <p className="text-lg font-semibold">{verifiedStations}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {selectedGas && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{selectedGas.station_name}</h3>
                <button
                  onClick={() => setSelectedGas(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Station ID: </span>
                  <span className="font-mono text-xs">{selectedGas.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reporter: </span>
                  {userName(selectedGas.reporter_id)}
                </div>
                <div>
                  <span className="text-muted-foreground">Location: </span>
                  <span className="font-mono text-xs">
                    {selectedGas.station_lat.toFixed(6)}, {selectedGas.station_lng.toFixed(6)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Regular: </span>
                  {fmtGas(selectedGas.regular_cents)}
                </div>
                <div>
                  <span className="text-muted-foreground">Premium: </span>
                  {fmtGas(selectedGas.premium_cents)}
                </div>
                <div>
                  <span className="text-muted-foreground">Diesel: </span>
                  {fmtGas(selectedGas.diesel_cents)}
                </div>
                <div>
                  <span className="text-muted-foreground">Verified: </span>
                  {selectedGas.verified_count} time(s)
                </div>
                <div>
                  <span className="text-muted-foreground">Reported: </span>
                  {new Date(selectedGas.created_at).toLocaleString()}
                </div>
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
                    className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${
                      selectedGas?.id === g.id ? "bg-muted/40" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-medium">{g.station_name}</td>
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
                    <td className="px-3 py-2 text-right">{g.verified_count}</td>
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
    </div>
  );
}
