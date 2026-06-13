export function StatCard({ label, value, helper }: { label: string; value: any; helper?: any }) {
  return (
    <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
      <p className="text-sm text-charcoal/60">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {helper ? <p className="mt-2 text-sm text-sage">{helper}</p> : null}
    </div>
  );
}
