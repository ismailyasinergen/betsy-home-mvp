import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { getCategoryProducts, getFiltersData } from "@/lib/marketplace-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ category, products }, filters, categoryTree] = await Promise.all([
    getCategoryProducts(slug),
    getFiltersData(),
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              orderBy: { name: "asc" }
            }
          },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    })
  ]);

  if (!category) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Category</p>
        <h1 className="mt-2 text-4xl font-bold">{category.name}</h1>
        <p className="mt-3 text-charcoal/70">{products.length} active product{products.length === 1 ? "" : "s"} in this category from your database.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-3xl border border-sand bg-white p-5 shadow-sm">
            <p className="font-bold">Browse categories</p>

            <div className="mt-4 grid gap-5">
              {categoryTree.map((parent) => (
                <div key={parent.id}>
                  <Link
                    href={`/category/${parent.slug}`}
                    className={parent.slug === slug ? "text-sm font-extrabold text-clay" : "text-sm font-extrabold text-charcoal hover:text-clay"}
                  >
                    {parent.name}
                  </Link>

                  {parent.children.length > 0 ? (
                    <div className="mt-2 grid gap-2 border-l border-sand pl-3">
                      {parent.children.map((child) => (
                        <div key={child.id}>
                          <Link
                            href={`/category/${child.slug}`}
                            className={child.slug === slug ? "text-sm font-bold text-clay" : "text-sm text-charcoal/70 hover:text-clay"}
                          >
                            {child.name}
                          </Link>

                          {child.children.length > 0 ? (
                            <div className="mt-1 grid gap-1 pl-3">
                              {child.children.map((grandchild) => (
                                <Link
                                  key={grandchild.id}
                                  href={`/category/${grandchild.slug}`}
                                  className={grandchild.slug === slug ? "text-xs font-bold text-clay" : "text-xs text-charcoal/55 hover:text-clay"}
                                >
                                  {grandchild.name}
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {categoryTree.length === 0 ? (
                filters.categories.map((item) => (
                  <Link key={item.slug} href={`/category/${item.slug}`} className={item.slug === slug ? "text-sm font-bold text-clay" : "text-sm hover:text-clay"}>
                    {item.name}
                  </Link>
                ))
              ) : null}
            </div>
          </aside>

          {products.length > 0 ? (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product as any} />)}
            </section>
          ) : (
            <section className="rounded-3xl border border-sand bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">No active products yet</h2>
              <p className="mt-3 text-charcoal/70">When sellers add active products to {category.name}, they will appear here automatically.</p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
