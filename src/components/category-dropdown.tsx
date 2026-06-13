"use client";

import Link from "next/link";
import { useRef, useState } from "react";

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

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory =
    categories.find((category) => category.id === expandedId) ?? categories[0];

  function openMenu() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    setOpen(true);
  }

  function closeMenuSoon() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 220);
  }

  function closeMenuNow() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    if (switchTimer.current) {
      clearTimeout(switchTimer.current);
      switchTimer.current = null;
    }

    setOpen(false);
  }

  function previewCategory(categoryId: string) {
    if (switchTimer.current) {
      clearTimeout(switchTimer.current);
    }

    switchTimer.current = setTimeout(() => {
      setExpandedId(categoryId);
    }, 220);
  }

  function selectCategory(categoryId: string) {
    if (switchTimer.current) {
      clearTimeout(switchTimer.current);
      switchTimer.current = null;
    }

    setExpandedId(categoryId);
  }

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenuSoon}
      onFocus={openMenu}
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
        <div
          className="absolute left-0 top-full z-50 w-[min(96vw,1120px)] pt-2"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenuSoon}
        >
          <div className="max-h-[84vh] overflow-hidden rounded-[2rem] border border-sand bg-white p-4 shadow-2xl">
            <div className="grid max-h-[78vh] gap-4 md:grid-cols-[170px_minmax(0,1fr)]">
              <div className="grid content-start gap-1 overflow-y-auto border-b border-sand pb-3 pr-1 md:border-b-0 md:border-r md:pb-0 md:pr-3">
                {categories.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-charcoal/60">
                    No categories yet.
                  </p>
                ) : null}

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onMouseEnter={() => previewCategory(category.id)}
                    onFocus={() => selectCategory(category.id)}
                    onClick={() => selectCategory(category.id)}
                    className={
                      activeCategory?.id === category.id
                        ? "flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5 text-left text-sm font-extrabold text-clay"
                        : "flex items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-charcoal hover:bg-cream hover:text-clay"
                    }
                  >
                    <span className="leading-tight">{category.name}</span>
                    <span aria-hidden="true">›</span>
                  </button>
                ))}
              </div>

              <div className="min-h-64 overflow-y-auto pr-1">
                {activeCategory ? (
                  <div>
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white pb-4">
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
                        onClick={closeMenuNow}
                        className="shrink-0 rounded-full bg-charcoal px-4 py-2 text-xs font-bold text-white"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {activeCategory.children.map((child) => (
                        <div
                          key={child.id}
                          className="rounded-2xl border border-sand bg-cream/60 p-3"
                        >
                          <Link
                            href={`/category/${child.slug}`}
                            onClick={closeMenuNow}
                            className="text-sm font-extrabold text-charcoal hover:text-clay"
                          >
                            {child.name}
                          </Link>

                          {child.children.length > 0 ? (
                            <div className="mt-2 grid gap-1.5">
                              {child.children.map((grandchild) => (
                                <Link
                                  key={grandchild.id}
                                  href={`/category/${grandchild.slug}`}
                                  onClick={closeMenuNow}
                                  className="text-xs leading-5 text-charcoal/65 hover:text-clay"
                                >
                                  {grandchild.name}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-charcoal/50">
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
        </div>
      ) : null}
    </div>
  );
}
