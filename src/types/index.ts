export type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

export type ShippingRestrictionResult = {
  productId: string;
  canShip: boolean;
  message: string;
};
