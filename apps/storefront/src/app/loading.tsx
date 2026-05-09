export default function Loading() {
  return (
    <main className="urbanix-container urbanix-section pb-24">
      <div className="grid gap-5">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
