import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6">
      {/* Header */}
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

      {/* Main Content */}
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

export function ReferralSkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
      {/* Hero Banner */}
      <Card className="border-[#252537] bg-gradient-to-br from-purple-600/20 to-pink-600/20">
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-8 w-64 bg-slate-700" />
          <Skeleton className="mb-6 h-4 w-full max-w-lg bg-slate-700" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-12 flex-1 bg-slate-700" />
            <Skeleton className="h-12 w-32 bg-slate-700" />
          </div>
        </CardContent>
      </Card>

      {/* Terms Card */}
      <Card className="border-[#252537] bg-[#0b0b14]">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-800" />
          ))}
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card className="border-[#252537] bg-[#0b0b14]">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-4 px-4 py-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-80 bg-slate-800" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40 bg-slate-800" />
        <Skeleton className="h-10 w-32 bg-slate-800" />
        <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>

      {/* Table */}
      <Card className="border-[#252537] bg-[#0b0b14]">
        <CardContent className="p-0">
          <div className="space-y-px">
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-4 border-b border-[#252537] p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 bg-slate-800" />
              ))}
            </div>
            {/* Data Rows */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 border-b border-[#191927] p-4">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-4 bg-slate-800" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-80 bg-slate-800" />
      </div>

      {/* Settings Card */}
      <Card className="border-[#252537] bg-[#0b0b14]">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 bg-purple-600/30" />
        </CardContent>
      </Card>
    </div>
  );
}

export function VerificationSkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 bg-slate-800" />
        <Skeleton className="h-4 w-96 bg-slate-800" />
      </div>

      {/* Verification Card */}
      <Card className="border-[#252537] bg-[#0b0b14]">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Areas */}
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24 bg-slate-800" />
                <Skeleton className="h-48 w-full rounded-lg bg-slate-800" />
              </div>
            ))}
          </div>

          {/* Form Fields */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>
          ))}

          <Skeleton className="h-10 w-full bg-purple-600/30" />
        </CardContent>
      </Card>
    </div>
  );
}
