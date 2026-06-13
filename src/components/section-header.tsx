export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: any }) {
  return (
    <div className="mb-6 max-w-3xl">
      {eyebrow ? <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-clay">{eyebrow}</p> : null}
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-charcoal/70">{description}</p> : null}
    </div>
  );
}
