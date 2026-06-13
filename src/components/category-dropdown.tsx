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

  const activeCategory =
    categories.find((category) => category.id === expandedId) ?? categories[0];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-bold text-charcoal shadow-sm transition hover:border-clay hover:text-clay"
        aria-expanded={open}
      >
        Categories
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-3 w-[min(92vw,820px)] rounded-[2rem] border border-sand bg-white p-4 shadow-2xl">
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <div className="grid gap-2 border-b border-sand pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-3">
              {categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-charcoal/60">
                  No categories yet.
                </p>
              ) : null}

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  onMouseEnter={() => setExpandedId(category.id)}
                  onFocus={() => setExpandedId(category.id)}
                  onClick={() => setOpen(false)}
                  className={
                    activeCategory?.id === category.id
                      ? "flex items-center justify-between rounded-2xl bg-cream px-3 py-3 text-left text-sm font-extrabold text-clay"
                      : "flex items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-bold text-charcoal hover:bg-cream hover:text-clay"
                  }
                >
                  <span>{category.name}</span>
                  <span aria-hidden="true">›</span>
                </Link>
              ))}
            </div>

            <div className="min-h-64">
              {activeCategory ? (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">
                        Browse
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold text-charcoal">
                        {activeCategory.name}
                      </h3>
                    </div>

                    <Link
                      href={`/category/${activeCategory.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-charcoal px-4 py-2 text-xs font-bold text-white"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {activeCategory.children.map((child) => (
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

                    {activeCategory.children.length === 0 ? (
                      <p className="text-sm text-charcoal/60">
                        No subcategories yet.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
