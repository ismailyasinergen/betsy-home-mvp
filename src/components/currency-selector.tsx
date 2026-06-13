"use client";

import { useEffect, useState } from "react";
import {
  getPreferredCurrency,
  savePreferredCurrency,
  type SupportedCurrency
} from "@/lib/currency";

export function CurrencySelector() {
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");

  useEffect(() => {
    setCurrency(getPreferredCurrency());
  }, []);

  function updateCurrency(value: any) {
    const nextCurrency: SupportedCurrency = value === "EUR" ? "EUR" : "USD";
    setCurrency(nextCurrency);
    savePreferredCurrency(nextCurrency);

    // Refresh so server-rendered admin/order/cart pages also show the chosen currency.
    window.location.reload();
  }

  return (
    <label className="hidden items-center gap-2 rounded-full border border-sand bg-white px-3 py-2 text-xs font-bold text-charcoal shadow-sm lg:flex">
      <span>Currency</span>
      <select
        value={currency}
        onChange={(event) => updateCurrency(event.target.value)}
        className="bg-transparent text-xs font-extrabold text-clay outline-none"
        aria-label="Select currency"
      >
        <option value="USD">USD $</option>
        <option value="EUR">EUR €</option>
      </select>
    </label>
  );
}
