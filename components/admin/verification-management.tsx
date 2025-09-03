"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "react-hot-toast";
import { 
  ShieldCheck,
  Search, 
  CheckCircle,
  XCircle,
  Eye,
  User,
  AlertTriangle,
  FileImage
} from "lucide-react"

interface Verification {
  id: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
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
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [imageToView, setImageToView] = useState<string | null>(null)

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/verifications")
      if (response.ok) {
        const data = await response.json()
        setVerifications(data)
      } else {
        toast({ title: "Error", description: "Failed to fetch verifications.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
      console.error("Error fetching verifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Verification status updated to ${status}.`,
          variant: "default",
        })
        fetchVerifications() // Refresh data
      } else {
        const errorData = await response.json()
        toast({
          title: "Update Failed",
          description: errorData.error || "Could not update verification status.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating verification status:", error)
      toast({ title: "Error", description: "An unexpected error occurred during update.", variant: "destructive" })
    }
  }
  
  const getStatusVariant = (status: 'PENDING' | 'APPROVED' | 'REJECTED' | boolean) => {
    if (status === 'APPROVED' || status === true) return "default"
    if (status === 'REJECTED') return "destructive"
    if (status === 'PENDING') return "secondary"
    return "outline"
  }

  const filteredVerifications = verifications.filter((v) => {
    const user = v.user
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || v.status.toLowerCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Verification Management
          </h2>
          <p className="text-gray-400">Review and approve user identity verifications.</p>
        </div>
        <Badge variant="outline" className="text-sm p-2">
          {filteredVerifications.length} / {verifications.length} Verifications
        </Badge>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-900 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading verifications...</p>
        </div>
      ) : filteredVerifications.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 text-gray-500 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <FileImage className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-300">No Verifications Found</h3>
            <p className="text-sm text-gray-500 mt-1">
              There are no verifications matching your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVerifications.map((verification) => (
            <Card key={verification.id} className="bg-gray-800/50 border-gray-700 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{verification.user.name || 'N/A'}</p>
                      <p className="text-sm text-gray-400">{verification.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4">
                     <Badge variant={getStatusVariant(verification.status)} className="capitalize">
                       {verification.status}
                     </Badge>
                     <Badge variant={getStatusVariant(verification.user.isVerified)} >
                        User {verification.user.isVerified ? 'Verified' : 'Not Verified'}
                     </Badge>
                  </div>
                </div>
                <hr className="border-gray-700 my-4" />
                
                {/* Address Information */}
                {(verification.address || verification.city || verification.postalCode) && (
                  <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {verification.address && (
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <p className="text-white">{verification.address}</p>
                        </div>
                      )}
                      {verification.city && (
                        <div>
                          <span className="text-gray-400">City:</span>
                          <p className="text-white">{verification.city}</p>
                        </div>
                      )}
                      {verification.postalCode && (
                        <div>
                          <span className="text-gray-400">Postal Code:</span>
                          <p className="text-white">{verification.postalCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                     <Button variant="outline" size="sm" onClick={() => setImageToView(verification.frontIdUrl)}>
                        <Eye className="w-4 h-4 mr-2" /> Front ID
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => setImageToView(verification.backIdUrl)}>
                       <Eye className="w-4 h-4 mr-2" /> Back ID
                     </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700" 
                      onClick={() => handleUpdateStatus(verification.id, 'APPROVED')}
                      disabled={verification.status === 'APPROVED'}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleUpdateStatus(verification.id, 'REJECTED')}
                      disabled={verification.status === 'REJECTED'}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewing Dialog */}
      <Dialog open={!!imageToView} onOpenChange={(open) => !open && setImageToView(null)}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle>Verification Document</DialogTitle>
          </DialogHeader>
          {imageToView ? (
            <img src={imageToView} alt="Verification Document" className="w-full h-auto rounded-md" />
          ) : (
            <p>No image selected.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 