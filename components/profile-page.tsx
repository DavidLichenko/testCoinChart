"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { useI18n } from "@/components/i18n-provider"
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
    address?: string
    city?: string
    postalCode?: string
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
    return <Badge variant="secondary" className={'w-48 my-1'}>Not Submitted</Badge>;
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
    <Badge className={`flex items-center w-48 my-1 ${statusConfig.className}`}>
      {statusConfig.icon}
      <span>{statusConfig.text}</span>
    </Badge>
  );
};

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { balance, liveProfit } = useBalance();
  const { toast } = useToast()
  const { t, lang, setLang } = useI18n()
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>(lang)

  // Upload states
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(null);
  const [backIdPreview, setBackIdPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification form states
  const [verificationAddress, setVerificationAddress] = useState("");
  const [verificationCity, setVerificationCity] = useState("");
  const [verificationPostalCode, setVerificationPostalCode] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    setSelectedLanguage(lang)
  }, [lang])

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
            setVerificationAddress(profileData.verification.address || "");
            setVerificationCity(profileData.verification.city || "");
            setVerificationPostalCode(profileData.verification.postalCode || "");
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
        if (selectedLanguage) setLang(selectedLanguage)
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({ title: "❌ Error", description: "Could not update your profile.", variant: "destructive" })
    }
  }

  const handleChangePassword = async () => {
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast({ title: "✅ Success", description: "Password updated." })
        setCurrentPassword("")
        setNewPassword("")
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: "❌ Error", description: err.error || "Failed to update password.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "❌ Error", description: "Network error.", variant: "destructive" })
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

    if (!verificationAddress || !verificationCity || !verificationPostalCode) {
      toast({ title: "Missing Information", description: "Please fill in your address, city, and postal code.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("frontId", frontIdFile);
    formData.append("backId", backIdFile);
    formData.append("address", verificationAddress);
    formData.append("city", verificationCity);
    formData.append("postalCode", verificationPostalCode);
    
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
            <TabsList className="grid w-full grid-cols-2 h-full gap-2 lg:grid-cols-4 bg-gray-800">
                <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />{t("profile")}</TabsTrigger>
                <TabsTrigger value="verification"><Shield className="w-4 h-4 mr-2" />{t("verification")}</TabsTrigger>
                <TabsTrigger value="withdraw"><CreditCard className="w-4 h-4 mr-2" />{t("withdraw")}</TabsTrigger>
                <TabsTrigger value="history"><FileText className="w-4 h-4 mr-2" />{t("history")}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
                <Card className={'bg-gray-800'}>
                    <CardHeader>
                        <CardTitle>{t("accountDetails")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-start justify-start lg:flex-row gap-6 lg:items-center lg:justify-normal">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{userProfile?.name || "User"}</h3>
                                <p className="text-gray-400">{userProfile?.email}</p>
                                <div className="mt-2"><VerificationStatusBadge status={userProfile?.verification?.status} /></div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("name")}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">{t("language")}</Label>
                                <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">{t("english")}</SelectItem>
                                        <SelectItem value="es">{t("spanish")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleUpdateProfile}>{t("updateProfile")}</Button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> {t("changePassword")}</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">{t("currentPassword")}</Label>
                                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">{t("newPassword")}</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="mt-3">
                                <Button variant="secondary" onClick={handleChangePassword}>{t("savePassword")}</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="verification" className="mt-6">
                <Card  className={'bg-gray-800'}>
                    <CardHeader>
                        <CardTitle>{t("identityVerification")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-400 flex flex-col gap-2">{t("uploadGovId")} <VerificationStatusBadge status={userProfile?.verification?.status} /></p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Front ID */}
                            <div className="space-y-2">
                                <Label>{t("frontId")}</Label>
                                <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-900 relative">
                                    {frontIdPreview ? (
                                        <img src={frontIdPreview} alt="Front ID Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 mx-auto text-gray-500" />
                                            <p className="text-sm text-gray-500 mt-2">{t("clickToUpload")}</p>
                                        </div>
                                    )}
                                    <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
                                </div>
                            </div>
                            {/* Back ID */}
                            <div className="space-y-2">
                                <Label>{t("backId")}</Label>
                                <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-900 relative">
                                    {backIdPreview ? (
                                        <img src={backIdPreview} alt="Back ID Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 mx-auto text-gray-500" />
                                            <p className="text-sm text-gray-500 mt-2">{t("clickToUpload")}</p>
                                        </div>
                                    )}
                                    <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="verification-address">{t("address")}</Label>
                                <Input 
                                    id="verification-address" 
                                    value={verificationAddress} 
                                    onChange={(e) => setVerificationAddress(e.target.value)}
                                    placeholder="Enter your full address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="verification-city">{t("city")}</Label>
                                <Input 
                                    id="verification-city" 
                                    value={verificationCity} 
                                    onChange={(e) => setVerificationCity(e.target.value)}
                                    placeholder="Enter your city"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="verification-postal">{t("postalCode")}</Label>
                                <Input 
                                    id="verification-postal" 
                                    value={verificationPostalCode} 
                                    onChange={(e) => setVerificationPostalCode(e.target.value)}
                                    placeholder="Enter postal code"
                                />
                            </div>
                        </div>

                        <Button onClick={handleSubmitVerification} disabled={isSubmitting || userProfile?.verification?.status === 'APPROVED'}>
                            {isSubmitting ? "Submitting..." : (userProfile?.verification?.status === 'APPROVED' ? t("verified") : t("submitForReview"))}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6">
                <Card  className={'bg-gray-800'}>
                    <CardHeader>
                        <CardTitle>{t("withdraw")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-gray-400">{t("availableForWithdrawal")}</p>
                            <p className="text-2xl font-bold">${(balance + liveProfit).toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="withdraw-amount">{t("amountUsd")}</Label>
                            <Input id="withdraw-amount" type="number" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("method")}</Label>
                           <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="crypto">{t("crypto")}</SelectItem>
                                    <SelectItem value="bank">{t("bankTransfer")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {withdrawMethod === 'crypto' && (
                            <div className="space-y-2">
                                <Label htmlFor="crypto-address">{t("cryptoAddressLabel")}</Label>
                                <Input id="crypto-address" placeholder="0x..." value={cryptoAddress} onChange={e => setCryptoAddress(e.target.value)} />
                            </div>
                        )}
                        {withdrawMethod === 'bank' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank-name">{t("bankName")}</Label>
                                    <Input id="bank-name" placeholder="e.g., Chase" value={bankName} onChange={e => setBankName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="card-number">{t("accountNumber")}</Label>
                                    <Input id="card-number" placeholder="**** **** **** 1234" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                                </div>
                            </div>
                        )}
                        
                        <Button onClick={handleWithdraw} disabled={userProfile?.isVerif !== True}>
                            {userProfile?.isVerif !== True ? t("verificationRequired") : t("submitWithdrawal")}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
                <Card className={'bg-gray-800'}>
                    <CardHeader>
                        <CardTitle>{t("transactionHistory")}</CardTitle>
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
                            <p className="text-center text-gray-500 py-4">{t("noTransactions")}</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
