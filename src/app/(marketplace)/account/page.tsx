import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getCustomerOrders } from "@/lib/customer-orders";
import { getCustomerFavoriteCount } from "@/lib/favorites";
import { getCustomerMoodBoardCount, getPublicMoodBoards } from "@/lib/mood-boards";
import { getCustomerMessageConversations } from "@/lib/messages";
import { getCustomerCustomOrderCount } from "@/lib/custom-orders";
import { getCustomerReviewCenterData } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [{ customer, orders }, favoriteCount, moodBoardCount, publicMoodBoards, messageData, customOrderCount, reviewData] = await Promise.all([
    getCustomerOrders(),
    getCustomerFavoriteCount(),
    getCustomerMoodBoardCount(),
    getPublicMoodBoards(),
    getCustomerMessageConversations(),
    getCustomerCustomOrderCount(),
    getCustomerReviewCenterData()
  ]);

  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID").length;
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.shippingStatus)).length;
  const needsReview = reviewData.reviewableItems.filter((item) => !item.existingReview).length;

  const cards = [
    {
      title: "Orders",
      href: "/account/orders",
      description: `${orders.length} order${orders.length === 1 ? "" : "s"} saved in your account history.`,
      meta: `${paidOrders} paid · ${activeOrders} active`
    },
    {
      title: "Favorites",
      href: "/account/favorites",
      description: "Products saved from search, category, room, style, and product pages.",
      meta: `${favoriteCount} saved`
    },
    {
      title: "Mood Boards",
      href: "/account/mood-boards",
      description: "Create private or opt-in public boards for rooms, styles, and project planning.",
      meta: `${moodBoardCount} boards`
    },
    {
      title: "Public Boards",
      href: "/boards",
      description: "Browse customer mood boards that were intentionally shared publicly.",
      meta: `${publicMoodBoards.length} public`
    },
    {
      title: "Custom Requests",
      href: "/account/custom-orders",
      description: "Track custom size, color, quantity, deadline, and project quote requests.",
      meta: `${customOrderCount} request${customOrderCount === 1 ? "" : "s"}`
    },
    {
      title: "Messages",
      href: "/account/messages",
      description: "Ask sellers about products, shipping, custom sizes, and order questions.",
      meta: `${messageData.conversations.length} conversation${messageData.conversations.length === 1 ? "" : "s"}`
    },
    {
      title: "Reviews",
      href: "/account/reviews",
      description: "Review paid purchases and read seller responses.",
      meta: needsReview > 0 ? `${needsReview} needed` : `${reviewData.submittedReviews.length} submitted`
    },
    {
      title: "Addresses",
      href: "#",
      description: "Saved shipping addresses will appear here after authentication.",
      meta: "Planned"
    }
  ];

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Customer account</p>
            <h1 className="mt-2 text-4xl font-bold">Your Betsy Home account</h1>
            <p className="mt-2 max-w-2xl text-charcoal/70">Signed in as {customer.email}. This account stores orders, reviews, favorites, mood boards, and messages in Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/account/mood-boards" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Mood boards</Link>
            <Link href="/account/custom-orders" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Custom requests</Link>
            <Link href="/account/reviews" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Reviews</Link>
            <Link href="/account/messages" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Messages</Link>
            <Link href="/account/favorites" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View favorites</Link>
            <Link href="/account/orders" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">View order history</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-3xl border border-sand bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xl font-bold">{item.title}</p>
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{item.meta}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-charcoal/60">{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
