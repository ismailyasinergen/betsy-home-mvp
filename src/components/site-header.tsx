import Link from "next/link";
import { UserRole } from "@prisma/client";
import { marketplaceRoutes } from "@/lib/routes";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { getCustomerUnreadMessageCount } from "@/lib/messages";

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const unreadMessages = currentUser?.role === UserRole.CUSTOMER ? await getCustomerUnreadMessageCount() : 0;

  return (
    <header className="border-b border-sand/70 bg-cream/95 backdrop-blur">
      <div className="container-page flex min-h-20 items-center gap-6 py-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-clay">
          Betsy Home
        </Link>
        <form className="hidden flex-1 md:block" action="/search">
          <input
            name="q"
            className="w-full rounded-full border border-sand bg-white px-5 py-3 shadow-sm outline-none transition focus:border-clay"
            placeholder="Search handmade home goods, rooms, styles..."
          />
        </form>
        <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
          {marketplaceRoutes.map((route) => (
            <Link key={route.href} href={route.href} className="hover:text-clay">
              {route.label}
            </Link>
          ))}
          <Link href="/business" className="hover:text-clay">
            Business
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm font-semibold">
          {currentUser ? (
            <>
              {currentUser.role === UserRole.CUSTOMER ? (
                <>
                  <Link href="/account/favorites" className="hidden hover:text-clay sm:inline">Favorites</Link>
                  <Link href="/account/messages" className="relative hidden hover:text-clay sm:inline-flex sm:items-center sm:gap-2">
                    <span>Messages</span>
                    {unreadMessages > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    ) : null}
                  </Link>
                  <Link href="/account" className="hidden hover:text-clay sm:inline">Account</Link>
                </>
              ) : null}

              {currentUser.role === UserRole.SELLER ? (
                <Link href="/seller/dashboard" className="hidden hover:text-clay sm:inline">Seller Studio</Link>
              ) : null}

              {currentUser.role === UserRole.ADMIN ? (
                <Link href="/admin/dashboard" className="hidden hover:text-clay sm:inline">Admin</Link>
              ) : null}

              <span className="hidden max-w-36 truncate text-charcoal/55 xl:inline">{currentUser.email}</span>
              <form action={signOut}>
                <button className="hidden hover:text-clay sm:inline">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden hover:text-clay sm:inline">Sign in</Link>
              <Link href="/register" className="hidden hover:text-clay sm:inline">Register</Link>
            </>
          )}
          <Link href="/cart" className="rounded-full bg-charcoal px-4 py-2 text-white">Cart</Link>
        </div>
      </div>
    </header>
  );
}
