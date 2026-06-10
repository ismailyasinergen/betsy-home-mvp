import Link from "next/link";
import { toggleProductFavoriteAction } from "@/app/(marketplace)/account/favorites/actions";
import { isProductFavorited } from "@/lib/favorites";
import type { ProductCardData } from "@/lib/marketplace-data";

export async function ProductCard({ product }: { product: ProductCardData }) {
  const isFavorited = await isProductFavorited(product.id, product.slug);

  return (
    <article className="group overflow-hidden rounded-3xl border border-sand bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/product/${product.slug}`} className="block aspect-[4/3] overflow-hidden bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-clay">{product.category}</span>
          <form action={toggleProductFavoriteAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="productSlug" value={product.slug} />
            <button
              className={`rounded-full px-2 text-xl font-bold transition ${isFavorited ? "bg-red-50 text-red-500 hover:bg-red-100" : "hover:bg-cream"}`}
              aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
              title={isFavorited ? "Remove from favorites" : "Save to favorites"}
            >
              {isFavorited ? "♥" : "♡"}
            </button>
          </form>
        </div>
        <Link href={`/product/${product.slug}`} className="font-semibold hover:text-clay">
          {product.title}
        </Link>
        <p className="mt-1 text-sm text-charcoal/65">by {product.shopName}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-bold">${product.price.toFixed(2)}</p>
          <p className="text-sm text-charcoal/65">★ {product.rating} ({product.reviewCount})</p>
        </div>
        <p className="mt-2 text-sm text-sage">{product.shippingNote}</p>
      </div>
    </article>
  );
}
