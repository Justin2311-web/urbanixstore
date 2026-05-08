import { Skeleton } from "@/components/ui/skeleton";

export function LoadingProductGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="rounded-2xl border bg-card p-2" key={index}>
          <Skeleton className="aspect-square" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-2/5" />
        </div>
      ))}
    </div>
  );
}
