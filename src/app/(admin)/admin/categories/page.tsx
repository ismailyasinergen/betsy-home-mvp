import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory
} from "./actions";

export const dynamic = "force-dynamic";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  _count: {
    products: number;
    children: number;
  };
  treeChildren: CategoryNode[];
};

function buildTree(categories: Omit<CategoryNode, "treeChildren">[]) {
  const nodes = new Map<string, CategoryNode>();

  for (const category of categories) {
    nodes.set(category.id, {
      ...category,
      treeChildren: []
    });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.treeChildren.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: CategoryNode[]) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      sortNodes(item.treeChildren);
    }
  };

  sortNodes(roots);
  return roots;
}

function CategoryOptions({
  categories,
  currentId,
  selectedParentId
}: {
  categories: CategoryNode[];
  currentId?: string;
  selectedParentId?: string | null;
}) {
  const renderOptions = (items: CategoryNode[], depth = 0): React.ReactNode[] =>
    items.flatMap((category) => {
      const disabled = category.id === currentId;
      return [
        <option key={category.id} value={category.id} disabled={disabled}>
          {"— ".repeat(depth)}
          {category.name}
        </option>,
        ...renderOptions(category.treeChildren, depth + 1)
      ];
    });

  return (
    <select
      name="parentId"
      defaultValue={selectedParentId ?? ""}
      className="w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm"
    >
      <option value="">No parent / Top-level</option>
      {renderOptions(categories)}
    </select>
  );
}

function CategoryRow({
  category,
  roots,
  depth = 0
}: {
  category: CategoryNode;
  roots: CategoryNode[];
  depth?: number;
}) {
  const canDelete = category._count.products === 0 && category._count.children === 0;

  return (
    <div className="space-y-3">
      <div
        className="rounded-3xl border border-sand bg-white p-5 shadow-sm"
        style={{ marginLeft: depth ? `${Math.min(depth * 24, 72)}px` : undefined }}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-extrabold text-charcoal">{category.name}</p>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">
                /category/{category.slug}
              </span>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-charcoal/60">
                {category._count.products} product{category._count.products === 1 ? "" : "s"}
              </span>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-charcoal/60">
                {category._count.children} child{category._count.children === 1 ? "" : "ren"}
              </span>
            </div>

            {category.imageUrl ? (
              <p className="mt-2 truncate text-xs text-charcoal/50">{category.imageUrl}</p>
            ) : null}

            <Link
              href={`/category/${category.slug}`}
              className="mt-3 inline-flex text-sm font-bold text-clay"
            >
              View category page →
            </Link>
          </div>

          <div className="grid gap-3 xl:min-w-[520px]">
            <form action={updateCategory.bind(null, category.id)} className="grid gap-3 rounded-2xl bg-cream p-4">
              <p className="text-sm font-extrabold text-charcoal">Edit category</p>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-charcoal/60">Name</span>
                  <input
                    name="name"
                    defaultValue={category.name}
                    className="mt-1 w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-charcoal/60">Slug</span>
                  <input
                    name="slug"
                    defaultValue={category.slug}
                    className="mt-1 w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-charcoal/60">Image URL</span>
                <input
                  name="imageUrl"
                  defaultValue={category.imageUrl ?? ""}
                  className="mt-1 w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm"
                  placeholder="Optional category image"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-charcoal/60">Parent category</span>
                <div className="mt-1">
                  <CategoryOptions
                    categories={roots}
                    currentId={category.id}
                    selectedParentId={category.parentId}
                  />
                </div>
              </label>

              <button className="rounded-full bg-charcoal px-5 py-3 text-sm font-bold text-white">
                Save category
              </button>
            </form>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <form action={moveCategory.bind(null, category.id)} className="rounded-2xl border border-sand p-4">
                <p className="text-sm font-extrabold text-charcoal">Move category</p>
                <div className="mt-2">
                  <CategoryOptions
                    categories={roots}
                    currentId={category.id}
                    selectedParentId={category.parentId}
                  />
                </div>
                <button className="mt-3 rounded-full border border-clay px-5 py-2 text-sm font-bold text-clay">
                  Move
                </button>
              </form>

              <form action={deleteCategory.bind(null, category.id)} className="rounded-2xl border border-red-200 p-4">
                <p className="text-sm font-extrabold text-red-700">Delete</p>
                <p className="mt-2 max-w-44 text-xs leading-5 text-charcoal/60">
                  {canDelete
                    ? "This empty category can be deleted."
                    : "Delete disabled if category has products or children."}
                </p>
                <button
                  disabled={!canDelete}
                  className="mt-3 rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-red-200"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {category.treeChildren.map((child) => (
        <CategoryRow key={child.id} category={child} roots={roots} depth={depth + 1} />
      ))}
    </div>
  );
}

function messageFor(searchParams?: { [key: string]: string | string[] | undefined }) {
  if (!searchParams) return null;

  if (searchParams.created) return "Category created.";
  if (searchParams.updated) return "Category updated.";
  if (searchParams.moved) return "Category moved.";
  if (searchParams.deleted) return "Category deleted.";

  const error = searchParams.error;
  if (error === "missing-name") return "Category name is required.";
  if (error === "self-parent") return "A category cannot be its own parent.";
  if (error === "child-parent") return "A category cannot be moved under one of its children.";
  if (error === "has-products") return "This category has products. Move products first before deleting it.";
  if (error === "has-children") return "This category has subcategories. Move or delete children first.";
  if (error === "not-found") return "Category could not be found.";

  return null;
}

export default async function AdminCategoriesPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole([UserRole.ADMIN], "/admin/categories");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  const roots = buildTree(categories as any);
  const notice = messageFor(resolvedSearchParams);

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">
          Admin
        </p>
        <h1 className="mt-2 text-4xl font-bold text-charcoal">
          Categories & subcategories
        </h1>
        <p className="mt-2 max-w-3xl text-charcoal/70">
          Add, edit, move, and safely delete marketplace categories. Moving a
          category changes its parent but keeps existing products attached to it.
        </p>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-sand bg-white p-4 text-sm font-bold text-charcoal shadow-sm">
          {notice}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-charcoal">
          Add category or subcategory
        </h2>

        <form action={createCategory} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-bold text-charcoal/60">Name</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-2xl border border-sand px-4 py-3 text-sm"
              placeholder="Cabinet Hardware"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-charcoal/60">Slug</span>
            <input
              name="slug"
              className="mt-1 w-full rounded-2xl border border-sand px-4 py-3 text-sm"
              placeholder="Auto-generated if empty"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-charcoal/60">Parent</span>
            <div className="mt-1">
              <CategoryOptions categories={roots} />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-charcoal/60">Image URL</span>
            <input
              name="imageUrl"
              className="mt-1 w-full rounded-2xl border border-sand px-4 py-3 text-sm"
              placeholder="Optional"
            />
          </label>

          <button className="rounded-full bg-clay px-6 py-3 text-sm font-extrabold text-white lg:col-span-4">
            Add category
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {roots.length === 0 ? (
          <div className="rounded-3xl border border-sand bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-charcoal">No categories yet</h2>
            <p className="mt-2 text-charcoal/60">Add your first marketplace category above.</p>
          </div>
        ) : (
          roots.map((category) => (
            <CategoryRow key={category.id} category={category} roots={roots} />
          ))
        )}
      </section>
    </main>
  );
}
