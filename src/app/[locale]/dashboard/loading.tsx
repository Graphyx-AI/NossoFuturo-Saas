export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 rounded-lg bg-secondary" />
      <div className="h-4 w-64 rounded bg-secondary" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl shadow-card p-6 h-28"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-secondary" />
        <div className="h-80 rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}
