import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-sand bg-white/60">
      <div className="container-page grid gap-8 py-10 md:grid-cols-4">
        <div>
          <p className="text-xl font-bold text-clay">Betsy Home</p>
          <p className="mt-3 text-sm text-charcoal/70">Handmade pieces for a meaningful home.</p>
        </div>
        <div>
          <p className="font-semibold">Shop</p>
          <div className="mt-3 grid gap-2 text-sm text-charcoal/70">
            <Link href="/category/wall-art">Wall Art</Link>
            <Link href="/room/living-room">Living Room</Link>
            <Link href="/style/boho">Boho Style</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Sell</p>
          <div className="mt-3 grid gap-2 text-sm text-charcoal/70">
            <Link href="/sell">Open a Shop</Link>
            <Link href="/seller/dashboard">Seller Studio</Link>
            <Link href="/seller/product-catalogue">Product Catalogue</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Trust</p>
          <p className="mt-3 text-sm text-charcoal/70">Secure checkout, seller verification, and buyer protection.</p>
        </div>
      </div>
    </footer>
  );
}
