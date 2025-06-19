"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import {User, Shield, CreditCard, FileText, Settings, Camera, LogOut} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  canWithdraw: boolean
  isVerified: boolean
  totalBalance: number
  usdBalance: number
  blocked: boolean
  status: string
  createdAt: string
  verification: {
    id: number
    userId: string
    back_id_image: string | null
    back_id_verif: boolean | null
    front_id_image: string | null
    front_id_verif: boolean | null
    street_address: string | null
    city: string | null
    zip_code: string | null
  } | null
}

interface Order {
  id: string
  type: "DEPOSIT" | "WITHDRAW"
  status: string
  amount: number
  depositFrom?: string
  withdrawMethod?: string
  bankName?: string
  cardNumber?: string
  createdAt: string
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCryptoToken, setSelectedCryptoToken] = useState("btc")
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState("")

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [streetAddress, setStreetAddress] = useState("")
  const [city, setCity] = useState("")
  const [zipCode, setZipCode] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefBack = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleUploadBackClick = () => {
    fileInputRefBack.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload here
      console.log("Selected file:", file);
    }
  };
  const handleFileBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload here
      console.log("Selected file:", file);
    }
  };


  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)

        // Fetch user profile
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserProfile(profileData)
          setName(profileData.name || "")
          setEmail(profileData.email || "")
          setStreetAddress(profileData.verification?.street_address || "")
          setCity(profileData.verification?.city || "")
          setZipCode(profileData.verification?.zip_code || "")
        }

        // Fetch transactions
        const ordersResponse = await fetch("/api/orders")
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setTransactions(ordersData.slice(0, 10)) // Show last 10
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setUserProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null))
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const handleUpdateVerification = async () => {
    try {
      const response = await fetch("/api/user/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street_address: streetAddress,
          city,
          zip_code: zipCode,
        }),
      })

      if (response.ok) {
        // Refresh profile data
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserProfile(profileData)
        }
      }
    } catch (error) {
      console.error("Error updating verification:", error)
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
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-[100vh-100px] bg-gray-950 text-white"
      >

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row"
        >
          {/* Sidebar Navigation - More compact */}
          <div className="w-full lg:w-64 border-r border-gray-800 bg-gray-900">
            <div className="p-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                <TabsList className="grid w-full grid-cols-1 bg-gray-800 h-auto">
                  <TabsTrigger value="profile" className="justify-start h-8 text-sm">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="verification" className="justify-start h-8 text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Verification
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="justify-start h-8 text-sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Withdraw
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="justify-start h-8 text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Transactions
                  </TabsTrigger>
                  <Button onClick={logout} variant={'destructive'} className="justify-start mt-2 h-8 text-sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                  {/*<TabsTrigger value="settings" className="justify-start h-8 text-sm">*/}
                  {/*  <Settings className="w-4 h-4 mr-2" />*/}
                  {/*  Settings*/}
                  {/*</TabsTrigger>*/}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Main Content - More compact */}
          <div className="flex-1 p-4 lg:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Profile Image */}
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                          {userProfile?.image ? (
                              <img
                                  src={userProfile.image || "/placeholder.svg"}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                              />
                          ) : (
                              <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <label
                            htmlFor="profile-image"
                            className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1 cursor-pointer hover:bg-purple-700"
                        >
                          <Camera className="w-3 h-3" />
                        </label>
                        <input id="profile-image" type="file" accept="image/*" className="hidden" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Profile Photo</h3>
                        <p className="text-xs text-gray-400">Upload a profile picture</p>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-sm">
                        Full Name
                      </Label>
                      <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-gray-700 border-gray-600 h-9"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm">
                        Email Address
                      </Label>
                      <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-gray-700 border-gray-600 h-9"
                      />
                    </div>

                    {/* Account Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 flex flex-col">
                        <Label className="text-sm">Account Status</Label>
                        <Badge variant={userProfile?.blocked ? "destructive" : "default"} className="text-xs w-12">
                          {userProfile?.blocked ? "Blocked" : userProfile?.status || "Active"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Balance</Label>
                        <div className="text-lg font-semibold text-green-400">
                          ${userProfile?.totalBalance.toLocaleString() || "0"}
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleUpdateProfile} className="bg-purple-600 hover:bg-purple-700 h-9">
                      Update Profile
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Verification Tab */}
              <TabsContent value="verification" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Identity Verification</CardTitle>
                    <p className="text-sm text-gray-400">Complete verification to unlock all features</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Verification Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-sm">ID Front</h4>
                            <p className="text-xs text-gray-400">Upload front side of your ID</p>
                          </div>
                        </div>
                        <Badge
                            variant={userProfile?.verification?.front_id_verif ? "default" : "secondary"}
                            className="text-xs"
                        >
                          {userProfile?.verification?.front_id_verif ? "Verified" : (
                              <>
                                <button
                                    onClick={handleUploadClick}
                                    className="bg-accent text-white px-4 py-1 rounded-md text-sm"
                                >
                                  Upload
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                              </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-gray-400"/>
                          <div>
                            <h4 className="font-medium text-sm">ID Back</h4>
                            <p className="text-xs text-gray-400">Upload back side of your ID</p>
                          </div>
                        </div>
                        <Badge
                            variant={userProfile?.verification?.back_id_verif ? "default" : "secondary"}
                            className="text-xs"
                        >
                          {userProfile?.verification?.back_id_verif ? "Verified" : (
                              <>
                                <button
                                    onClick={handleUploadBackClick}
                                    className="bg-accent text-white px-4 py-1 rounded-md text-sm"
                                >
                                  Upload
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileBackChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                              </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Address Information</h4>

                      <div className="space-y-1">
                        <Label htmlFor="street-address" className="text-sm">
                          Street Address
                        </Label>
                        <Input
                            id="street-address"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            className="bg-gray-700 border-gray-600 h-9"
                            placeholder="Enter your street address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="city" className="text-sm">
                            City
                          </Label>
                          <Input
                              id="city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="bg-gray-700 border-gray-600 h-9"
                              placeholder="Enter your city"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="zip-code" className="text-sm">
                            ZIP Code
                          </Label>
                          <Input
                              id="zip-code"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              className="bg-gray-700 border-gray-600 h-9"
                              placeholder="Enter ZIP code"
                          />
                        </div>
                      </div>

                      <Button onClick={handleUpdateVerification} className="bg-purple-600 hover:bg-purple-700 h-9">
                        Update Verification
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Withdraw Tab */}
              <TabsContent value="withdraw" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Withdraw Funds</CardTitle>
                    {userProfile?.canWithdraw && (<p className="text-sm text-gray-400">
                          Available Balance: ${userProfile?.totalBalance.toLocaleString() || "0"}
                        </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!userProfile?.canWithdraw ? (
                        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                          <p className="text-red-400 text-sm">
                            Withdrawals are currently restricted for your account. Please complete verification or contact
                            support.
                          </p>
                        </div>
                    ) : (
                        <Tabs defaultValue="crypto" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-gray-700 h-9">
                            <TabsTrigger value="crypto" className="text-sm">
                              Crypto Withdrawal
                            </TabsTrigger>
                            <TabsTrigger value="bank" className="text-sm">
                              Bank Transfer
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="crypto" className="space-y-3 mt-4">
                            <div className="space-y-1">
                              <Label htmlFor="crypto-token" className="text-sm">
                                Select Token
                              </Label>
                              <Select value={selectedCryptoToken} onValueChange={setSelectedCryptoToken}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600">
                                  <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                                  <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                                  <SelectItem value="usdt">Tether (USDT)</SelectItem>
                                  <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="crypto-network" className="text-sm">
                                Network
                              </Label>
                              <Select value={selectedCryptoNetwork} onValueChange={setSelectedCryptoNetwork}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 h-9">
                                  <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600">
                                  {selectedCryptoToken === "btc" && <SelectItem value="bitcoin">Bitcoin</SelectItem>}
                                  {selectedCryptoToken === "eth" && (
                                      <>
                                        <SelectItem value="ethereum">Ethereum</SelectItem>
                                        <SelectItem value="polygon">Polygon</SelectItem>
                                      </>
                                  )}
                                  {selectedCryptoToken === "usdt" && (
                                      <>
                                        <SelectItem value="ethereum">Ethereum (ERC20)</SelectItem>
                                        <SelectItem value="tron">Tron (TRC20)</SelectItem>
                                      </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="crypto-address" className="text-sm">
                                Crypto Address
                              </Label>
                              <Input
                                  id="crypto-address"
                                  placeholder="Enter wallet address..."
                                  className="bg-gray-700 border-gray-600 h-9"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="crypto-amount" className="text-sm">
                                Amount (USD)
                              </Label>
                              <Input id="crypto-amount" placeholder="0.00" className="bg-gray-700 border-gray-600 h-9" />
                            </div>

                            <Button className="w-full bg-purple-600 hover:bg-purple-700 h-9">Withdraw Crypto</Button>
                          </TabsContent>

                          <TabsContent value="bank" className="space-y-3 mt-4">
                            <div className="space-y-1">
                              <Label htmlFor="bank-name" className="text-sm">
                                Bank Name
                              </Label>
                              <Input
                                  id="bank-name"
                                  placeholder="Enter bank name"
                                  className="bg-gray-700 border-gray-600 h-9"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="account-number" className="text-sm">
                                Account Number
                              </Label>
                              <Input
                                  id="account-number"
                                  placeholder="Enter account number"
                                  className="bg-gray-700 border-gray-600 h-9"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="bank-amount" className="text-sm">
                                Amount (USD)
                              </Label>
                              <Input id="bank-amount" placeholder="0.00" className="bg-gray-700 border-gray-600 h-9" />
                            </div>

                            <Button className="w-full bg-purple-600 hover:bg-purple-700 h-9">Withdraw to Bank</Button>
                          </TabsContent>
                        </Tabs>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.length > 0 ? (
                          transactions.map((transaction) => (
                              <div
                                  key={transaction.id}
                                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          transaction.type === "DEPOSIT" ? "bg-green-600" : "bg-red-600"
                                      }`}
                                  >
                                    {transaction.type === "DEPOSIT" ? "+" : "-"}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm">{transaction.type}</h4>
                                    <p className="text-xs text-gray-400">
                                      {transaction.depositFrom || transaction.withdrawMethod} •{" "}
                                      {new Date(transaction.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-sm">${transaction.amount.toLocaleString()}</div>
                                  <Badge
                                      variant={transaction.status === "SUCCESSFUL" ? "default" : "secondary"}
                                      className="text-xs"
                                  >
                                    {transaction.status}
                                  </Badge>
                                </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center text-gray-400 py-6">No transactions found</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              {/*<TabsContent value="settings" className="space-y-4">*/}
              {/*  <Card className="bg-gray-800 border-gray-700">*/}
              {/*    <CardHeader className="pb-3">*/}
              {/*      <CardTitle className="text-lg">Application Settings</CardTitle>*/}
              {/*    </CardHeader>*/}
              {/*    <CardContent className="space-y-4">*/}
              {/*      /!* Notifications *!/*/}
              {/*      <div className="flex items-center justify-between">*/}
              {/*        <div>*/}
              {/*          <h4 className="font-medium text-sm">Push Notifications</h4>*/}
              {/*          <p className="text-xs text-gray-400">Receive trading alerts</p>*/}
              {/*        </div>*/}
              {/*        <Switch />*/}
              {/*      </div>*/}

              {/*      /!* Email Notifications *!/*/}
              {/*      <div className="flex items-center justify-between">*/}
              {/*        <div>*/}
              {/*          <h4 className="font-medium text-sm">Email Notifications</h4>*/}
              {/*          <p className="text-xs text-gray-400">Receive email updates</p>*/}
              {/*        </div>*/}
              {/*        <Switch />*/}
              {/*      </div>*/}

              {/*      /!* Two-Factor Authentication *!/*/}
              {/*      <div className="flex items-center justify-between">*/}
              {/*        <div>*/}
              {/*          <h4 className="font-medium text-sm">Two-Factor Authentication</h4>*/}
              {/*          <p className="text-xs text-gray-400">Add extra security to your account</p>*/}
              {/*        </div>*/}
              {/*        <Switch />*/}
              {/*      </div>*/}

              {/*      <Button className="bg-purple-600 hover:bg-purple-700 h-9">Save Settings</Button>*/}
              {/*    </CardContent>*/}
              {/*  </Card>*/}
              {/*</TabsContent>*/}
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
  )
}
