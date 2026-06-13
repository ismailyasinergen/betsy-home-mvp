"use client";

import { useEffect, useState } from "react";
import {
  convertMoney,
  formatMoney,
  getPreferredCurrency,
  type SupportedCurrency
} from "@/lib/currency";

export function CurrencyPrice({
  amount,
  sourceCurrency = "USD",
  className
}: {
  amount: number;
  sourceCurrency?: SupportedCurrency;
  className?: string;
}) {
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>("USD");

  useEffect(() => {
    const update = () => setDisplayCurrency(getPreferredCurrency());

    update();
    window.addEventListener("betsy-currency-change", update);

    return () => window.removeEventListener("betsy-currency-change", update);
  }, []);

  const convertedAmount = convertMoney(amount, sourceCurrency, displayCurrency);

  return (
    <span className={className}>
      {formatMoney(convertedAmount, displayCurrency)}
    </span>
  );
}
