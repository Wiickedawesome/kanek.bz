"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAdminActionErrorMessage,
  getAdminBookingsData,
  getAdminContractEvents,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";

type Booking = {
  id: string;
  post_id: string;
  user_id: string;
  role: string;
  status: string;
  seats_booked: number;
  payment_method: string | null;
  created_at: string;
};

type Contract = {
  id: string;
  post_id: string;
  booking_id: string | null;
  origin_address: string | null;
  dest_address: string | null;
  agreed_price_cents: number | null;
  status: string;
  created_at: string;
};

type ContractEvent = {
  id: string;
  contract_id: string;
  actor_id: string;
  event_type: string;
  note: string | null;
  created_at: string;
};

type Tab = "bookings" | "contracts";

export default function BookingsPage() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [bookingContracts, setBookingContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminBookingsData<Booking, Contract>();
      setBookings(data.bookings);
      setContracts(data.contracts);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setBookings([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadContractEvents = async (contractId: string) => {
    try {
      const data = await getAdminContractEvents<ContractEvent>(contractId);
      setContractEvents(data.events);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setContractEvents([]);
    }
  };

  const allUserIds = useMemo(() => [
    ...bookings.map((b) => b.user_id),
    ...contractEvents.map((e) => e.actor_id),
  ], [bookings, contractEvents]);
  const allPostIds = useMemo(() => [
    ...bookings.map((b) => b.post_id),
    ...contracts.map((c) => c.post_id),
  ], [bookings, contracts]);
  const { userName, postTitle } = useResolveNames(allUserIds, allPostIds);

  const formatCents = (cents: number | null) =>
    cents !== null ? `$${(cents / 100).toFixed(2)}` : "—";

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      no_show: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      disputed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <div className="flex gap-1 rounded-lg border p-1">
        {(["bookings", "contracts"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedContract(null);
              setSelectedBooking(null);
              setBookingContracts([]);
            }}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              tab === t
                ? "bg-accent-green text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
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
          {tab === "bookings" && (
            <div className="space-y-4">
              {selectedBooking && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Booking {selectedBooking.id.slice(0, 8)}</h3>
                    <button onClick={() => { setSelectedBooking(null); setBookingContracts([]); }} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><span className="text-muted-foreground">Booking ID: </span><span className="font-mono text-xs">{selectedBooking.id.slice(0, 8)}</span></div>
                    <div><span className="text-muted-foreground">Post: </span>{postTitle(selectedBooking.post_id)}</div>
                    <div><span className="text-muted-foreground">User: </span>{userName(selectedBooking.user_id)}</div>
                    <div><span className="text-muted-foreground">Role: </span><span className="capitalize">{selectedBooking.role}</span></div>
                    <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedBooking.status)}`}>{selectedBooking.status.replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Seats: </span>{selectedBooking.seats_booked}</div>
                    <div><span className="text-muted-foreground">Payment: </span>{selectedBooking.payment_method ?? "—"}</div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedBooking.created_at).toLocaleString()}</div>
                  </div>
                  {bookingContracts.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Related Contracts</h4>
                      <div className="space-y-2">
                        {bookingContracts.map((c) => (
                          <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                            <div className="space-x-3">
                              <span className="font-mono text-xs">{c.id.slice(0, 8)}</span>
                              <span className="text-muted-foreground">{c.origin_address ?? "?"} → {c.dest_address ?? "?"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums">{formatCents(c.agreed_price_cents)}</span>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-2 text-left font-medium">ID</th>
                      <th className="px-3 py-2 text-left font-medium">Post</th>
                      <th className="px-3 py-2 text-left font-medium">Role</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Seats</th>
                      <th className="px-3 py-2 text-left font-medium">Payment</th>
                      <th className="px-3 py-2 text-left font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => {
                          if (selectedBooking?.id === b.id) { setSelectedBooking(null); setBookingContracts([]); return; }
                          setSelectedBooking(b);
                          setBookingContracts(contracts.filter((c) => c.booking_id === b.id || c.post_id === b.post_id));
                        }}
                        className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedBooking?.id === b.id ? "bg-muted/40" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono text-xs">{b.id.slice(0, 8)}</td>
                        <td className="px-3 py-2">{postTitle(b.post_id)}</td>
                        <td className="px-3 py-2 capitalize">{b.role}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status.replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{b.seats_booked}</td>
                        <td className="px-3 py-2">{b.payment_method ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No bookings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "contracts" && (
            <div className="space-y-4">
              {selectedContract && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Contract {selectedContract.id.slice(0, 8)}
                    </h3>
                    <button
                      onClick={() => setSelectedContract(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">From: </span>
                      {selectedContract.origin_address ?? "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">To: </span>
                      {selectedContract.dest_address ?? "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price: </span>
                      {formatCents(selectedContract.agreed_price_cents)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedContract.status)}`}
                      >
                        {selectedContract.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-medium pt-2">Events</h4>
                  {contractEvents.length > 0 ? (
                    <div className="space-y-1">
                      {contractEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex gap-2 text-xs text-muted-foreground"
                        >
                          <span className="tabular-nums">
                            {new Date(ev.created_at).toLocaleString()}
                          </span>
                          <span className="font-medium text-foreground">
                            {ev.event_type}
                          </span>
                          <span className="text-muted-foreground">by {userName(ev.actor_id)}</span>
                          {ev.note && <span>— {ev.note}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No events.</p>
                  )}
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-2 text-left font-medium">ID</th>
                      <th className="px-3 py-2 text-left font-medium">Route</th>
                      <th className="px-3 py-2 text-left font-medium">Price</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedContract(c);
                          loadContractEvents(c.id);
                        }}
                        className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedContract?.id === c.id ? "bg-muted/40" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono text-xs">
                          {c.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-2 max-w-[200px] truncate">
                          {c.origin_address ?? "?"} → {c.dest_address ?? "?"}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {formatCents(c.agreed_price_cents)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {contracts.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-muted-foreground"
                        >
                          No contracts found.
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
