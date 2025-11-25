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

export default function VerificationManagement() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [imageToView, setImageToView] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  
  // Add access control check
  useEffect(() => {
    if (!hasAdminAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])
  
  // If access is denied, show an error message
  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
        Access denied. You don't have permission to view this page.
      </div>
    )
  }
  
  useEffect(() => {
    fetchVerifications()
  }, [])

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
      status: "APPROVED" | "REJECTED"
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
      toast.error("Unexpected error")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "REJECTED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30"
      default:
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    }
  }

  const filtered = verifications.filter((v) => {
    const matchSearch =
        v.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.user.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus =
        statusFilter === "all" || v.status.toLowerCase() === statusFilter

    return matchSearch && matchStatus
  })

  return (
      <div className="space-y-6 px-2 sm:px-0">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
              Verification Management
            </h2>
            <p className="text-sm text-slate-400">
              Review, approve or reject user identity verification.
            </p>
          </div>

          <Badge className="rounded-full bg-slate-900/70 text-slate-300 text-xs px-4 py-2">
            {filtered.length} of {verifications.length}
          </Badge>
        </div>

        {/* FILTERS */}
        <Card className="bg-slate-950/80 border-slate-900/80">
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-800 text-slate-100"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-900 border-slate-800 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
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
            <div className="text-center py-10 text-slate-400">Loading...</div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
            <Card className="bg-slate-950/70 border-slate-900/70">
              <CardContent className="py-10 text-center">
                <FileImage className="mx-auto mb-3 w-10 h-10 text-slate-600" />
                <p className="text-slate-400">No verifications found.</p>
              </CardContent>
            </Card>
        )}

        {/* VERIFICATION LIST */}
        <div className="space-y-4">
          {filtered.map((v) => (
              <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl bg-slate-950/90 border-slate-900 shadow-[0_18px_45px_rgba(10,15,25,0.7)]">
                  <CardContent className="p-4 space-y-4">
                    {/* TOP ROW */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/80">
                          <User2 className="h-6 w-6 text-slate-400" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-100">
                            {v.user.name || "No name"}
                          </p>
                          <p className="text-xs text-slate-400">{v.user.email}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge
                            className={`border ${getStatusColor(
                                v.status
                            )} text-xs px-3 py-1`}
                        >
                          {v.status}
                        </Badge>
                      </div>
                    </div>

                    {/* ADDRESS */}
                    {(v.address || v.city || v.postalCode) && (
                        <div className="rounded-xl bg-slate-900/60 p-3 text-sm text-slate-300 space-y-1">
                          <p className="font-medium text-slate-200 mb-1">Address:</p>
                          {v.address && <p>{v.address}</p>}
                          {v.city && <p>{v.city}</p>}
                          {v.postalCode && <p>{v.postalCode}</p>}
                        </div>
                    )}

                    {/* DOCUMENT BUTTONS + HOVER PREVIEW */}
                    <div className="flex flex-wrap gap-3">
                      {/* FRONT ID */}
                      <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Button
                              variant="outline"
                              className="rounded-xl text-xs sm:text-sm"
                              onClick={() => setImageToView(v.frontIdUrl)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View Front ID
                          </Button>
                        </HoverCardTrigger>
                        {v.frontIdUrl && (
                            <HoverCardContent className="w-auto max-w-xs bg-slate-950 border-slate-800 p-2">
                              <img
                                  src={v.frontIdUrl}
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
                              className="rounded-xl text-xs sm:text-sm"
                              onClick={() => setImageToView(v.backIdUrl)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View Back ID
                          </Button>
                        </HoverCardTrigger>
                        {v.backIdUrl && (
                            <HoverCardContent className="w-auto max-w-xs bg-slate-950 border-slate-800 p-2">
                              <img
                                  src={v.backIdUrl}
                                  alt="Back ID preview"
                                  className="max-h-60 w-auto rounded-lg object-contain"
                              />
                            </HoverCardContent>
                        )}
                      </HoverCard>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                      <Button
                          disabled={v.status === "APPROVED"}
                          onClick={() => handleUpdateStatus(v.id, "APPROVED")}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>

                      <Button
                          variant="destructive"
                          disabled={v.status === "REJECTED"}
                          onClick={() => handleUpdateStatus(v.id, "REJECTED")}
                          className="rounded-xl flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
          ))}
        </div>

        {/* IMAGE VIEWER (по клику) */}
        <Dialog open={!!imageToView} onOpenChange={() => setImageToView(null)}>
          <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Document</DialogTitle>
            </DialogHeader>
            {imageToView && (
                <img
                    src={imageToView}
                    className="rounded-xl w-full h-auto"
                    alt="Verification document"
                />
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}
