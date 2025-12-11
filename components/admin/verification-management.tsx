"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  User2,
  FileImage,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

import { toast } from "react-hot-toast"
import { hasAdminAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"

interface Verification {
  id: string
  userId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  frontIdUrl: string
  backIdUrl: string
  address?: string
  city?: string
  postalCode?: string
  createdAt: string
  user: {
    email: string
    name: string | null
    isVerified: boolean
  }
}

type StatusFilter = "all" | "pending" | "approved" | "rejected"

const VERIFICATIONS_PER_PAGE = 8

/**
 * Преобразуем Cloudinary URL к виду с авто-конвертацией:
 * .../upload/... → .../upload/f_auto,q_auto/...
 */
const toCloudinaryPreviewUrl = (url: string | null | undefined) => {
  if (!url) return ""
  if (url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_auto,q_auto/")
  }
  return url
}

const statusBadgeClasses = (status: Verification["status"]) => {
  switch (status) {
    case "APPROVED":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    case "REJECTED":
      return "border-rose-500/40 bg-rose-500/10 text-rose-300"
    case "PENDING":
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-200"
  }
}

export default function VerificationManagement() {
  const { user } = useAuth()

  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [imageToView, setImageToView] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)

  // --- access control ---
  useEffect(() => {
    if (!hasAdminAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])

  // --- fetch data ---
  useEffect(() => {
    if (accessDenied) return
    fetchVerifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessDenied])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/verifications")
      if (response.ok) {
        setVerifications(await response.json())
      } else {
        toast.error("Failed to fetch verifications")
      }
    } catch (error) {
      console.error(error)
      toast.error("Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (
      id: string,
      status: "APPROVED" | "REJECTED",
  ) => {
    try {
      const response = await fetch(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(`Status changed to ${status}`)
        fetchVerifications()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Update failed")
      }
    } catch (error) {
      console.error(error)
      toast.error("Unexpected error")
    }
  }

  const filtered = (() => {
    return verifications.filter((v) => {
      const search = searchTerm.toLowerCase()
      const matchSearch =
        v.user.email.toLowerCase().includes(search) ||
        (v.user.name || "").toLowerCase().includes(search)

      const matchStatus =
        statusFilter === "all" ||
        v.status.toLowerCase() === statusFilter

      return matchSearch && matchStatus
    })
  })()

  const totalPages =
      filtered.length === 0
          ? 1
          : Math.ceil(filtered.length / VERIFICATIONS_PER_PAGE)

  const currentItems = (() =>
      filtered.slice(
          (currentPage - 1) * VERIFICATIONS_PER_PAGE,
          currentPage * VERIFICATIONS_PER_PAGE,
      ))()

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // сбрасываем страницу при смене фильтров
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // --- early return after всех хуков ---
  if (accessDenied) {
    return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
          Access denied. You don&apos;t have permission to view this page.
        </div>
    )
  }

  return (
      <div className="space-y-6 px-2 sm:px-0">
        {/* HEADER */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-50 sm:text-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-blue-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
              Verification Management
            </h2>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
              Review, approve or reject user identity verification.
            </p>
          </div>

          <Badge className="rounded-full bg-zinc-900/80 px-4 py-1.5 text-xs text-zinc-200">
            {filtered.length} of {verifications.length} requests
          </Badge>
        </div>

        {/* FILTERS */}
        <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/80 shadow-[0_18px_45px_rgba(0,0,0,0.7)]">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 rounded-xl border-zinc-800 bg-zinc-900 pl-9 text-sm text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-zinc-800 bg-zinc-900 text-sm text-zinc-100 sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 text-sm text-zinc-100">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* LOADING */}
        {loading && (
            <div className="py-10 text-center text-sm text-zinc-400">
              Loading verifications...
            </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
            <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/80">
              <CardContent className="py-10 text-center">
                <FileImage className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
                <p className="text-sm text-zinc-400">No verifications found.</p>
              </CardContent>
            </Card>
        )}

        {/* LIST */}
        <div className="space-y-4">
          {currentItems.map((v) => (
              <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
              >
                <Card className="rounded-3xl border-zinc-800 bg-zinc-950/90 shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    {/* TOP ROW */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/90">
                          <User2 className="h-6 w-6 text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
                            {v.user.name || "No name"}
                          </p>
                          <p className="truncate text-xs text-zinc-400 sm:text-[13px]">
                            {v.user.email}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Submitted:{" "}
                            {new Date(v.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <Badge
                            variant="outline"
                            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide ${statusBadgeClasses(
                                v.status,
                            )}`}
                        >
                          {v.status}
                        </Badge>
                        {v.user.isVerified && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                        <CheckCircle className="h-3 w-3" />
                        Account verified
                      </span>
                        )}
                      </div>
                    </div>

                    {/* ADDRESS */}
                    {(v.address || v.city || v.postalCode) && (
                        <div className="space-y-1 rounded-2xl bg-zinc-900/80 p-3 text-xs text-zinc-200 sm:text-sm">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Address
                          </p>
                          {v.address && <p>{v.address}</p>}
                          {v.city && <p>{v.city}</p>}
                          {v.postalCode && <p>{v.postalCode}</p>}
                        </div>
                    )}

                    {/* DOCUMENT BUTTONS + HOVER PREVIEW */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* FRONT ID */}
                      <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Button
                              variant="outline"
                              className="rounded-xl border-zinc-700 bg-zinc-900 text-xs text-zinc-100 hover:bg-zinc-800 sm:text-sm"
                              onClick={() => setImageToView(v.frontIdUrl)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Front ID
                          </Button>
                        </HoverCardTrigger>
                        {v.frontIdUrl && (
                            <HoverCardContent className="w-auto max-w-xs border-zinc-800 bg-zinc-950 p-2">
                              <img
                                  src={toCloudinaryPreviewUrl(v.frontIdUrl)}
                                  alt="Front ID preview"
                                  className="max-h-60 w-auto rounded-lg object-contain"
                              />
                            </HoverCardContent>
                        )}
                      </HoverCard>

                      {/* BACK ID */}
                      <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Button
                              variant="outline"
                              className="rounded-xl border-zinc-700 bg-zinc-900 text-xs text-zinc-100 hover:bg-zinc-800 sm:text-sm"
                              onClick={() => setImageToView(v.backIdUrl)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Back ID
                          </Button>
                        </HoverCardTrigger>
                        {v.backIdUrl && (
                            <HoverCardContent className="w-auto max-w-xs border-zinc-800 bg-zinc-950 p-2">
                              <img
                                  src={toCloudinaryPreviewUrl(v.backIdUrl)}
                                  alt="Back ID preview"
                                  className="max-h-60 w-auto rounded-lg object-contain"
                              />
                            </HoverCardContent>
                        )}
                      </HoverCard>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button
                          disabled={v.status === "APPROVED"}
                          onClick={() => handleUpdateStatus(v.id, "APPROVED")}
                          className="flex-1 rounded-xl bg-emerald-600 text-xs font-medium hover:bg-emerald-700 sm:flex-none sm:px-4 sm:text-sm"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>

                      <Button
                          variant="destructive"
                          disabled={v.status === "REJECTED"}
                          onClick={() => handleUpdateStatus(v.id, "REJECTED")}
                          className="flex-1 rounded-xl text-xs font-medium sm:flex-none sm:px-4 sm:text-sm"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
          ))}
        </div>

        {/* PAGINATION */}
        {filtered.length > VERIFICATIONS_PER_PAGE && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1 sm:mt-4 sm:gap-2">
              <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-xl px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                  variant="outline"
              >
                Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                      (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 2 && p <= currentPage + 2),
                  )
                  .map((p, idx, arr) => (
                      <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs text-zinc-500">…</span>
                )}
                        <Button
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(p)}
                            className="h-8 w-8 rounded-xl text-xs sm:h-9 sm:w-9 sm:text-sm"
                        >
                  {p}
                </Button>
              </span>
                  ))}

              <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-xl px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                  variant="outline"
              >
                Next
              </Button>
            </div>
        )}

        {/* IMAGE VIEWER (по клику) */}
        <Dialog open={!!imageToView} onOpenChange={() => setImageToView(null)}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-zinc-800 bg-zinc-950">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Document</DialogTitle>
            </DialogHeader>
            {imageToView && (
                <img
                    src={toCloudinaryPreviewUrl(imageToView)}
                    className="h-auto w-full rounded-xl"
                    alt="Verification document"
                />
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}
