"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import {User, Shield, CreditCard, FileText, Settings, Camera, LogOut, Upload, Check, BadgeCheck, XCircle, Clock} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useBalance } from "@/hooks/useBalance"

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  isVerif: boolean
  verification: {
    status: string // PENDING, APPROVED, REJECTED
  } | null
}

interface Order {
  id: string
  type: "DEPOSIT" | "WITHDRAW"
  status: string
  amount: number
  createdAt: string
}

const VerificationStatusBadge = ({ status }: { status: string | undefined }) => {
  if (!status) {
    return <Badge variant="secondary">Not Submitted</Badge>;
  }

  const statusConfig = {
    PENDING: {
      icon: <Clock className="w-4 h-4 mr-2" />,
      text: "Pending Review",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    APPROVED: {
      icon: <BadgeCheck className="w-4 h-4 mr-2" />,
      text: "Verified",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    REJECTED: {
      icon: <XCircle className="w-4 h-4 mr-2" />,
      text: "Rejected",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  }[status] || {
    icon: null,
    text: "Unknown",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <Badge className={`flex items-center ${statusConfig.className}`}>
      {statusConfig.icon}
      <span>{statusConfig.text}</span>
    </Badge>
  );
};

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { balance, liveProfit } = useBalance();
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  
  // Withdraw form states
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState("crypto")
  const [cryptoAddress, setCryptoAddress] = useState("")
  const [bankName, setBankName] = useState("")
  const [cardNumber, setCardNumber] = useState("")

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  // Upload states
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(null);
  const [backIdPreview, setBackIdPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true)
      try {
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserProfile(profileData)
          setName(profileData.name || "")
          setEmail(profileData.email || "")
          // Pre-fill previews if documents were already uploaded
          if (profileData.verification) {
            setFrontIdPreview(profileData.verification.frontIdUrl);
            setBackIdPreview(profileData.verification.backIdUrl);
          }
        }
        const ordersResponse = await fetch("/api/orders")
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setTransactions(ordersData.slice(0, 10))
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
        toast({ title: "Error", description: "Could not load profile data.", variant: "destructive"})
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [toast])

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        toast({ title: "✅ Success", description: "Your profile has been updated." })
        const updatedProfile = await response.json()
        setUserProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null))
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({ title: "❌ Error", description: "Could not update your profile.", variant: "destructive" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (type === 'front') {
      setFrontIdFile(file);
      setFrontIdPreview(URL.createObjectURL(file));
    } else {
      setBackIdFile(file);
      setBackIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitVerification = async () => {
    if (!frontIdFile || !backIdFile) {
      toast({ title: "Missing Documents", description: "Please upload both front and back ID images.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("frontId", frontIdFile);
    formData.append("backId", backIdFile);
    
    try {
      const response = await fetch("/api/user/verification", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "✅ Verification Submitted",
          description: "Your documents are now under review. This may take up to 24 hours.",
        });
        const updatedData = await response.json();
         setUserProfile((prev) => prev ? { ...prev, verification: updatedData.verification, isVerif: updatedData.isVerif } : null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ title: "❌ Submission Failed", description: errorData.error || "Could not submit documents.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "❌ Network Error", description: "An unexpected network error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount to withdraw.", variant: "destructive"});
      return;
    }
    if (amount > (balance + liveProfit)) {
       toast({ title: "Insufficient Funds", description: "You cannot withdraw more than your total equity.", variant: "destructive"});
      return;
    }

    const withdrawData = {
      type: "WITHDRAW",
      amount,
      withdrawMethod,
      cryptoAddress: withdrawMethod === 'crypto' ? cryptoAddress : undefined,
      bankName: withdrawMethod === 'bank' ? bankName : undefined,
      cardNumber: withdrawMethod === 'bank' ? cardNumber : undefined,
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawData)
      });

      if(res.ok) {
        toast({ title: '✅ Withdrawal Requested', description: 'Your withdrawal request has been submitted for processing.'});
        setWithdrawAmount("");
        // Optionally, refresh transactions list
      } else {
        const error = await res.json();
        toast({ title: '❌ Withdrawal Failed', description: error.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    } catch(err) {
      toast({ title: '❌ Network Error', description: 'Could not submit withdrawal request.', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
                <TabsTrigger value="verification"><Shield className="w-4 h-4 mr-2" />Verification</TabsTrigger>
                <TabsTrigger value="withdraw"><CreditCard className="w-4 h-4 mr-2" />Withdraw</TabsTrigger>
                <TabsTrigger value="history"><FileText className="w-4 h-4 mr-2" />History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{userProfile?.name || "User"}</h3>
                                <p className="text-gray-400">{userProfile?.email}</p>
                            </div>
                             <VerificationStatusBadge status={userProfile?.verification?.status} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <Button onClick={handleUpdateProfile}>Update Profile</Button>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="verification" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Identity Verification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-400">Upload a government-issued ID to verify your account. Your current status is: <VerificationStatusBadge status={userProfile?.verification?.status} /></p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Front ID */}
                            <div className="space-y-2">
                                <Label>Front of ID</Label>
                                <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-900 relative">
                                    {frontIdPreview ? (
                                        <img src={frontIdPreview} alt="Front ID Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 mx-auto text-gray-500" />
                                            <p className="text-sm text-gray-500 mt-2">Click to upload</p>
                                        </div>
                                    )}
                                    <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
                                </div>
                            </div>
                            {/* Back ID */}
                            <div className="space-y-2">
                                <Label>Back of ID</Label>
                                <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-900 relative">
                                    {backIdPreview ? (
                                        <img src={backIdPreview} alt="Back ID Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 mx-auto text-gray-500" />
                                            <p className="text-sm text-gray-500 mt-2">Click to upload</p>
                                        </div>
                                    )}
                                    <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleSubmitVerification} disabled={isSubmitting || userProfile?.verification?.status === 'APPROVED'}>
                            {isSubmitting ? "Submitting..." : (userProfile?.verification?.status === 'APPROVED' ? "Verified" : "Submit for Review")}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Request a Withdrawal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-gray-400">Available for withdrawal:</p>
                            <p className="text-2xl font-bold">${(balance + liveProfit).toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                            <Input id="withdraw-amount" type="number" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Method</Label>
                           <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="crypto">Crypto</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {withdrawMethod === 'crypto' && (
                            <div className="space-y-2">
                                <Label htmlFor="crypto-address">Your Crypto Address (USDT - ERC20)</Label>
                                <Input id="crypto-address" placeholder="0x..." value={cryptoAddress} onChange={e => setCryptoAddress(e.target.value)} />
                            </div>
                        )}
                        {withdrawMethod === 'bank' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank-name">Bank Name</Label>
                                    <Input id="bank-name" placeholder="e.g., Chase" value={bankName} onChange={e => setBankName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="card-number">Account/Card Number</Label>
                                    <Input id="card-number" placeholder="**** **** **** 1234" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                                </div>
                            </div>
                        )}
                        
                        <Button onClick={handleWithdraw} disabled={!userProfile?.isVerif}>
                            {!userProfile?.isVerif ? "Verification Required" : "Submit Withdrawal Request"}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length > 0 ? (
                            <ul className="space-y-3">
                                {transactions.map(tx => (
                                    <li key={tx.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                                        <div>
                                            <p className={`font-semibold ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-orange-400'}`}>{tx.type}</p>
                                            <p className="text-sm text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-lg">${tx.amount.toFixed(2)}</p>
                                            <Badge>{tx.status}</Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No transactions yet.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
