"use client";

export function PrintCatalogueButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
