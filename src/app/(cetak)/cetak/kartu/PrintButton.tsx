"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="toolbar-btn toolbar-btn-primary no-print"
      onClick={() => window.print()}
    >
      Cetak
    </button>
  );
}
