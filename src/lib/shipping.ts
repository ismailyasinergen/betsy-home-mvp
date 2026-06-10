export type ShippingProfileCheck = {
  excludedCountries: string[];
  customerCountryCode: string;
};

export function canShipToCountry({ excludedCountries, customerCountryCode }: ShippingProfileCheck) {
  return !excludedCountries.map((code) => code.toUpperCase()).includes(customerCountryCode.toUpperCase());
}

export function getShippingRestrictionMessage(canShip: boolean) {
  return canShip
    ? "Ships to your country."
    : "This seller does not currently ship to your country.";
}
