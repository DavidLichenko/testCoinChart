import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-4 w-96 bg-slate-800" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-[#252537] bg-[#0b0b14]">
            <CardContent className="p-6">
              <Skeleton className="mb-2 h-4 w-20 bg-slate-800" />
              <Skeleton className="h-8 w-32 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#252537] bg-[#0b0b14]">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-slate-800" />
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#252537] bg-[#0b0b14]">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-slate-800" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}