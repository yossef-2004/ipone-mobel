import { ProductGridSkeleton, Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6">
      <Skeleton className="mb-8 h-10 w-56" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-96" />
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
