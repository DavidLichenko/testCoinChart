import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen  min-w-screen-2xl bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <p className="mt-4 text-slate-400">Loading profile...</p>
      </div>
    </div>
  );
}