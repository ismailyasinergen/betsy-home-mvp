"use client";

import Link from "next/link";
import { useState } from "react";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: {
    id: string;
    name: string;
    slug: string;
    children: {
      id: string;
      name: string;
      slug: string;
    }[];
  }[];
};

export function CategoryDropdown({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(
    categories[0]?.id ?? null
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-bold text-charcoal shadow-sm transition hover:border-clay hover:text-clay"
      >
        Categories
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-3 w-[min(92vw,760px)] rounded-[2rem] border border-sand bg-white p-4 shadow-2xl">
          <div className="grid gap-4 md:grid-cols-[230px_1fr]">
            <div className="grid gap-2 border-b border-sand pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-3">
              {categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-charcoal/60">
                  No categories yet.
                </p>
              ) : null}

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setExpandedId(category.id)}
                  className={
                    expandedId === category.id
                      ? "rounded-2xl bg-cream px-3 py-3 text-left text-sm font-extrabold text-clay"
                      : "rounded-2xl px-3 py-3 text-left text-sm font-bold text-charcoal hover:bg-cream hover:text-clay"
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="min-h-64">
              {categories.map((category) =>
                expandedId === category.id ? (
                  <div key={category.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">
                          Main category
                        </p>
                        <h3 className="mt-1 text-xl font-extrabold text-charcoal">
                          {category.name}
                        </h3>
                      </div>

                      <Link
                        href={`/category/${category.slug}`}
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-charcoal px-4 py-2 text-xs font-bold text-white"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="rounded-3xl border border-sand bg-cream/60 p-4"
                        >
                          <Link
                            href={`/category/${child.slug}`}
                            onClick={() => setOpen(false)}
                            className="font-extrabold text-charcoal hover:text-clay"
                          >
                            {child.name}
                          </Link>

                          {child.children.length > 0 ? (
                            <div className="mt-3 grid gap-2">
                              {child.children.map((grandchild) => (
                                <Link
                                  key={grandchild.id}
                                  href={`/category/${grandchild.slug}`}
                                  onClick={() => setOpen(false)}
                                  className="text-sm text-charcoal/65 hover:text-clay"
                                >
                                  {grandchild.name}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-charcoal/50">
                              No subcategories.
                            </p>
                          )}
                        </div>
                      ))}

                      {category.children.length === 0 ? (
                        <p className="text-sm text-charcoal/60">
                          No subcategories yet.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
