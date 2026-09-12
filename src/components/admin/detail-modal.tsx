import React from "react";

/**
 * Fixed overlay detail modal — centered on the viewport so the parent
 * page/list keeps its scroll position when a row is opened or dismissed.
 * Backdrop click closes; the panel stops propagation.
 */
export function DetailModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md bg-muted px-3 py-1 text-sm hover:bg-muted/80"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
