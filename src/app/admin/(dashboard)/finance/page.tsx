"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAdminActionErrorMessage,
  getAdminFinanceData,
} from "@/lib/admin-backend";
import { useResolveNames } from "@/lib/use-resolve-names";

type EkyashTx = {
  id: string;
  contract_id: string;
  payer_id: string;
  payee_id: string;
  order_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  donation_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

type EmailReceipt = {
  id: string;
  user_id: string;
  contract_id: string | null;
  booking_id: string | null;
  email_to: string;
  type: string;
  status: string;
  error: string | null;
  sent_at: string;
};

type CompletedBooking = {
  id: string;
  post_id: string;
  booking_id: string;
  parties: string[];
  origin_address: string | null;
  dest_address: string | null;
  agreed_price_cents: number;
  status: string;
  created_at: string;
  completed_at: string | null;
};

type DonationTotal = {
  total_cents: number;
  updated_at: string;
};

type Tab = "transactions" | "receipts" | "donations";

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("transactions");
  const [txns, setTxns] = useState<EkyashTx[]>([]);
  const [receipts, setReceipts] = useState<EmailReceipt[]>([]);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [donationTotals, setDonationTotals] = useState<DonationTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<EkyashTx | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<EmailReceipt | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminFinanceData<EkyashTx, EmailReceipt, DonationTotal, CompletedBooking>();
      setTxns(data.transactions);
      setReceipts(data.receipts);
      setCompletedBookings(data.completedBookings);
      setDonationTotals(data.donationTotals);
    } catch (error) {
      setLoadError(getAdminActionErrorMessage(error));
      setTxns([]);
      setReceipts([]);
      setCompletedBookings([]);
      setDonationTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allUserIds = useMemo(() => [
    ...txns.map((t) => t.payer_id),
    ...txns.map((t) => t.payee_id),
    ...receipts.map((r) => r.user_id),
    ...completedBookings.flatMap((b) => b.parties),
  ], [txns, receipts, completedBookings]);
  const { userName } = useResolveNames(allUserIds);

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
      refunded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  // Aggregations from loaded data
  const totalPaymentVolume = txns.reduce((s, t) => s + t.amount_cents, 0);
  const totalBookingVolume = completedBookings.reduce((s, b) => s + b.agreed_price_cents, 0);
  const totalVolume = totalPaymentVolume + totalBookingVolume;
  const totalFees = txns.reduce((s, t) => s + t.platform_fee_cents, 0);
  const totalDonations = txns.reduce((s, t) => s + t.donation_cents, 0);

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Volume</p>
          <p className="text-lg font-semibold">{fmt(totalVolume)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Booking Volume</p>
          <p className="text-lg font-semibold">{fmt(totalBookingVolume)}</p>
          <p className="text-[10px] text-muted-foreground">{completedBookings.length} completed</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Payment Volume</p>
          <p className="text-lg font-semibold">{fmt(totalPaymentVolume)}</p>
          <p className="text-[10px] text-muted-foreground">{txns.length} transactions</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Platform Fees</p>
          <p className="text-lg font-semibold">{fmt(totalFees)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Donations</p>
          <p className="text-lg font-semibold">{fmt(totalDonations)}</p>
          {donationTotals && (
            <p className="text-[10px] text-muted-foreground">
              Lifetime: {fmt(donationTotals.total_cents)}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        {(["transactions", "receipts", "donations"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedTxn(null); setSelectedReceipt(null); setSelectedBooking(null); }}
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
          {tab === "transactions" && (
            <div className="space-y-4">
              {/* Selected ekyash transaction detail */}
              {selectedTxn && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Transaction Details</h3>
                    <button onClick={() => setSelectedTxn(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Transaction ID: </span><span className="font-mono text-xs">{selectedTxn.id}</span></div>
                    <div><span className="text-muted-foreground">Contract: </span><span className="font-mono text-xs">{selectedTxn.contract_id}</span></div>
                    <div><span className="text-muted-foreground">Order ID: </span><span className="font-mono text-xs">{selectedTxn.order_id ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Currency: </span>{selectedTxn.currency}</div>
                    <div><span className="text-muted-foreground">Payer: </span>{userName(selectedTxn.payer_id)}</div>
                    <div><span className="text-muted-foreground">Payee: </span>{userName(selectedTxn.payee_id)}</div>
                    <div><span className="text-muted-foreground">Amount: </span><span className="font-semibold">{fmt(selectedTxn.amount_cents)}</span></div>
                    <div><span className="text-muted-foreground">Platform Fee: </span>{fmt(selectedTxn.platform_fee_cents)}</div>
                    <div><span className="text-muted-foreground">Donation: </span>{fmt(selectedTxn.donation_cents)}</div>
                    <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedTxn.status)}`}>{selectedTxn.status}</span></div>
                    <div><span className="text-muted-foreground">Created: </span>{new Date(selectedTxn.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Selected completed booking detail */}
              {selectedBooking && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Completed Booking Details</h3>
                    <button onClick={() => setSelectedBooking(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Contract ID: </span><span className="font-mono text-xs">{selectedBooking.id}</span></div>
                    <div><span className="text-muted-foreground">Booking ID: </span><span className="font-mono text-xs">{selectedBooking.booking_id}</span></div>
                    <div><span className="text-muted-foreground">Origin: </span>{selectedBooking.origin_address ?? "—"}</div>
                    <div><span className="text-muted-foreground">Destination: </span>{selectedBooking.dest_address ?? "—"}</div>
                    <div><span className="text-muted-foreground">Agreed Price: </span><span className="font-semibold">{fmt(selectedBooking.agreed_price_cents)}</span></div>
                    <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></div>
                    <div><span className="text-muted-foreground">Parties: </span>{selectedBooking.parties.map((p) => userName(p)).join(", ")}</div>
                    <div><span className="text-muted-foreground">Completed: </span>{selectedBooking.completed_at ? new Date(selectedBooking.completed_at).toLocaleString() : "—"}</div>
                  </div>
                </div>
              )}

              {/* Completed Bookings table */}
              {completedBookings.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-muted-foreground">Completed Bookings</h3>
                  <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium">Parties</th>
                        <th className="px-3 py-2 text-left font-medium">Route</th>
                        <th className="px-3 py-2 text-right font-medium">Price</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedBookings.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => setSelectedBooking(selectedBooking?.id === b.id ? null : b)}
                          className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedBooking?.id === b.id ? "bg-muted/40" : ""}`}
                        >
                          <td className="px-3 py-2">
                            {b.parties.map((p) => userName(p)).join(" & ")}
                          </td>
                          <td className="px-3 py-2 max-w-[200px] truncate text-muted-foreground">
                            {b.origin_address && b.dest_address
                              ? `${b.origin_address} → ${b.dest_address}`
                              : b.origin_address ?? b.dest_address ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {fmt(b.agreed_price_cents)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(b.status)}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {b.completed_at ? new Date(b.completed_at).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}

              {/* eKyash Transactions table */}
              <h3 className="text-sm font-medium text-muted-foreground">Payment Transactions</h3>
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Payer</th>
                    <th className="px-3 py-2 text-left font-medium">Payee</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-right font-medium">Fee</th>
                    <th className="px-3 py-2 text-right font-medium">Donation</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTxn(selectedTxn?.id === t.id ? null : t)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedTxn?.id === t.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {userName(t.payer_id)}
                      </td>
                      <td className="px-3 py-2">
                        {userName(t.payee_id)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fmt(t.amount_cents)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {fmt(t.platform_fee_cents)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {fmt(t.donation_cents)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(t.status)}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {txns.length === 0 && completedBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {tab === "receipts" && (
            <div className="space-y-4">
              {selectedReceipt && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Receipt Details</h3>
                    <button onClick={() => setSelectedReceipt(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Receipt ID: </span><span className="font-mono text-xs">{selectedReceipt.id}</span></div>
                    <div><span className="text-muted-foreground">User: </span>{userName(selectedReceipt.user_id)}</div>
                    <div><span className="text-muted-foreground">Contract: </span><span className="font-mono text-xs">{selectedReceipt.contract_id ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Booking: </span><span className="font-mono text-xs">{selectedReceipt.booking_id ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Email To: </span>{selectedReceipt.email_to}</div>
                    <div><span className="text-muted-foreground">Type: </span>{selectedReceipt.type}</div>
                    <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(selectedReceipt.status)}`}>{selectedReceipt.status}</span></div>
                    <div><span className="text-muted-foreground">Sent: </span>{new Date(selectedReceipt.sent_at).toLocaleString()}</div>
                  </div>
                  {selectedReceipt.error && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Error</p>
                      <p className="text-sm mt-1 text-red-600 dark:text-red-400">{selectedReceipt.error}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">To</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Booking</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Error</th>
                    <th className="px-3 py-2 text-left font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReceipt(selectedReceipt?.id === r.id ? null : r)}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/30 ${selectedReceipt?.id === r.id ? "bg-muted/40" : ""}`}
                    >
                      <td className="px-3 py-2 max-w-[200px] truncate">
                        {r.email_to}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {r.booking_id ? r.booking_id.slice(0, 8) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[200px] truncate text-muted-foreground">
                        {r.error ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(r.sent_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {receipts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No email receipts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {tab === "donations" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Lifetime Donation Total
                </h3>
                <p className="mt-1 text-3xl font-bold">
                  {donationTotals ? fmt(donationTotals.total_cents) : "$0.00"}
                </p>
                {donationTotals && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(donationTotals.updated_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium">
                  Recent Transactions with Donations
                </h3>
                <div className="space-y-2">
                  {txns
                    .filter((t) => t.donation_cents > 0)
                    .slice(0, 20)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <span className="font-mono text-xs">
                            {t.payer_id.slice(0, 8)}
                          </span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="font-medium">
                            {fmt(t.donation_cents)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  {txns.filter((t) => t.donation_cents > 0).length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      No donation transactions yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
