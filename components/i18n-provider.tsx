"use client"

import React, {createContext, useContext, useEffect, useState} from "react"


export type Messages = {
  [key: string]: string | Messages
}

const en: Messages = {
  // Profile
  // Hero Section
  institutionalTag: "Institutional trading platform",
  trustedByTraders: "Trusted by active traders worldwide",
  heroTag: "Multi-asset trading platform",
  heroTitle: "Trade, manage and grow your capital",
  heroSubtitle: "One terminal for trading, wallet management and personal support. Built for active traders.",
  heroSlideTradeDesc: "Access forex, crypto, indices and US stocks from a single fast interface.",
  heroSlideWalletDesc: "Hold funds in your base currency, move them to trading or staking in one tap.",
  heroSlideManagerDesc: "Get help with funding, withdrawals and strategy questions when you need it.",
  heroCtaOpenAccount: "Open free account",
  heroCtaSignIn: "Sign in",
  heroCtaGoToMarket: "Go to trading",
  heroCtaGoToDashboard: "Go to dashboard",
  heroStatActiveClients: "Active clients",
  heroStatExecutionSpeed: "Avg. execution speed",
  heroStatCountries: "Countries",
  dailyVolume: "Daily Volume",

  // Features
  advancedTrading: "Advanced Trading",
  advancedTradingDesc: "Professional trading tools with real-time charts and analytics",
  heroSlideTradeTitle: "Trade with structure, not emotion.",
  heroSlideTradeSubtitle: "Institutional-grade tools, real-time risk limits, and clean execution in one platform.",
  heroSlideTradeBullet1: "Position size and risk per trade calculated for you.",
  heroSlideTradeBullet2: "Live P&L, margin, and exposure in a single view.",
  heroSlideTradeBullet3: "Work with major forex pairs, crypto, and US stocks.",

  heroSlideWalletTitle: "One wallet for all your balances.",
  heroSlideWalletSubtitle: "See trading balance, funds in work, and free capital in seconds.",
  heroSlideWalletBullet1: "Clear split between available, in-trade, and locked funds.",
  heroSlideWalletBullet2: "Instant internal transfers between trading and wallet balances.",
  heroSlideWalletBullet3: "Support for EUR and USD base currencies.",

  heroSlideManagerTitle: "A trading manager by your side.",
  heroSlideManagerSubtitle: "AI tools and live support keep you within your plan, not your mood.",
  heroSlideManagerBullet1: "Personal limits and daily loss controls for your account.",
  heroSlideManagerBullet2: "Smart alerts when your behavior drifts from your rules.",
  heroSlideManagerBullet3: "Priority access to our support team.",

  // How It Works
  howItWorksTitle: "How AragonTrade works",
  howItWorksSubtitle: "A simple path from registration to first trade.",
  stepCreateAccount: "Create your account in a few minutes.",
  stepCreateAccountDesc: "Sign up in seconds with our streamlined registration process",
  stepFundAccount: "Fund your balance with a convenient payment method.",
  stepFundAccountDesc: "Choose from multiple payment methods to deposit funds instantly",
  stepStartTrading: "Start trading with real-time analytics.",
  stepStartTradingDesc: "Access global markets and execute trades with confidence",

  // Education
  educationBlockTitle: "Built for learning and long–term success",
  educationBlockDesc: "Whether you're a beginner or an active trader, AragonTrade gives you structure, tools, and guidance",
  educationItemAcademy: "Structured education and trading basics",
  educationItemIdeas: "Idea flows and strategy breakdowns",
  educationItemSupport: "1:1 support from our team",

  // Why Choose
  whyChoose: "Why traders choose",
  aragonTrade: "AragonTrade",
  experienceFutureDescription: "Modern trading infrastructure, instant balance sync and clear risk tools in one platform.",

  // CTA
  readyToStart: "Ready to Start Your",
  tradingJourney: "Trading Journey",
  joinThousandsSuccessful: "Join thousands of successful traders and start building your financial future today.",
  createFreeAccount: "Create Free Account",

  // Navigation
  trading: "Trading",
  market: "Market",
  product: "Product",
  company: "Company",
  about: "About",
  support: "Support",
  contactUs: "Contact Us",
  allRightsReserved: "All rights reserved",
  privacy: "Privacy",
  termsOfService: "Terms of Service",

  // Additional translations for UI components
  enterpriseSecurity: "Enterprise Security",
  enterpriseSecurityDesc: "Bank-level encryption and multi-layer security protocols protect your assets",
  lightningFast: "Lightning Fast",
  lightningFastDesc: "Execute trades in milliseconds with our optimized infrastructure",
  trustedCompanies: "Trusted Companies",
  stepCreateAccountTitle: "Create Account",
  stepFundAccountTitle: "Fund Account",
  stepStartTradingTitle: "Start Trading",
  educationItemAcademyDesc: "Learn from basics to advanced strategies with structured courses",
  educationItemIdeasDesc: "Get real-time insights and professional market analysis",
  educationItemSupportDesc: "Advanced tools to protect your investments and minimize losses",
  profile: "Profile",
  verification: "Verification",
  withdraw: "Withdraw",
  history: "History",
  globalCoverageTitle: "Global market access",
  globalCoverageDesc: "Trade major forex pairs, crypto, and US stocks from a single dashboard",
  accountDetails: "Account Details",
  name: "Name",
  updateProfile: "Update Profile",
  identityVerification: "Identity Verification",
  uploadGovId:
      "Upload a government-issued ID to verify your account. Your current status is:",
  frontId: "Front of ID",
  backId: "Back of ID",
  clickToUpload: "Click to upload",
  address: "Address",
  city: "City",
  postalCode: "Postal Code",
  submitForReview: "Submit for Review",
  verified: "Verified",
  availableForWithdrawal: "Available for withdrawal:",
  amountUsd: "Amount (USD)",
  method: "Method",
  crypto: "Crypto",
  bankTransfer: "Bank Transfer",
  cryptoAddressLabel: "Your Crypto Address (USDT - ERC20)",
  bankName: "Bank Name",
  accountNumber: "Account/Card Number",
  submitWithdrawal: "Submit Withdrawal Request",
  verificationRequired: "Verification Required",
  transactionHistory: "Transaction History",
  noTransactions: "No transactions yet.",
  changePassword: "Change Password",
  currentPassword: "Current Password",
  newPassword: "New Password",
  savePassword: "Save Password",
  language: "Language",
  english: "English",
  spanish: "Español",
  helpCenter: "Help Center",
  faq: "FAQ",
  manageYourPreferences: "Manage your preferences",
  profileSettings: "Profile Settings",
  notificationSettings: "Notification Settings",
  securitySettings: "Security Settings",
  pushNotifications: "Push Notifications",
  receivePushNotifications: "Receive push notifications",
  emailNotifications: "Email Notifications",
  receiveEmailNotifications: "Receive email notifications",
  soundNotifications: "Sound Notifications",
  playSoundForNotifications: "Play sound for notifications",
  twoFactorAuthentication: "Two-Factor Authentication",
  enableTwoFactorAuth: "Enable two-factor authentication",
  darkMode: "Dark Mode",
  enableDarkMode: "Enable dark mode",
  languagePreferences: "Language Preferences",
  saveSettings: "Save Settings",
  couldNotLoadTransactionHistory: "Could not load transaction history",
  makeDeposit: "Make Deposit",
  requestWithdrawal: "Request Withdrawal",
  viewTrades: "View Trades",
  manageAssets: "Manage Assets",
  addFunds: "Add Funds",
  withdrawFunds: "Withdraw Funds",
  accessTradingPlatform: "Access trading platform",
  completeVerificationToUnlock: "Complete verification to unlock",
  inviteFriendsEarnRewards: "Invite friends and earn rewards",
  accountSettings: "Account Settings",
  friendsReferred: "Friends Referred",
  earnedFromReferrals: "Earned From Referrals",
  qualifiedReferrals: "Qualified Referrals",
  pendingBonus: "Pending Bonus",
  bonusEligibility: "Bonus Eligibility",
  bonusEligibilityDescription: "$50 bonus for each friend who makes a deposit of $500 or more",
  eligible: "Eligible",
  notEligible: "Not Eligible",
  noReferralsYet: "No Referrals Yet",
  shareYourLinkToStartEarning: "Share your link to start earning",
  howItWorks: "How It Works",
  shareYourLink: "Share Your Link",
  shareYourLinkDesc: "Send your referral link to friends",
  friendRegisters: "Friend Registers",
  friendRegistersDesc: "They sign up using your link",
  youEarnRewards: "You Earn Rewards",
  earn10Immediate: "Earn $10 immediately",
  earn50Bonus: "Plus $50 bonus when they deposit $500+",
  viewYourTransactionHistory: "View your transaction history",
  reference: "Reference",
  tryAdjustingFilters: "Try adjusting your filters",
  completeIdentityVerification: "Complete identity verification",
  uploadFrontId: "Upload front of ID",
  uploadBackId: "Upload back of ID",
  enterYourAddress: "Enter your address",
  enterYourCity: "Enter your city",
  enterPostalCode: "Enter postal code",
  submitting: "Submitting...",
  submitForVerification: "Submit for Verification",
  verificationApproved: "Verification Approved",
  congratulationsYourIdentityHasBeenVerified: "Congratulations! Your identity has been verified",
  unnamed: "Unnamed",
  bonusPerQualified: "Per Qualified Referral",
  perReferral: "Per Referral",
  commissionOnTrades: "Commission on Trades",
  maxEarningsPerReferral: "Max Earnings Per Referral",
  yourReferralLink: "Your Referral Link",
  copyLink: "Copy Link",
  share: "Share",
  openWallet: "Open Wallet",
  verifyAccount: "Verify Account",
  startTrading: "Start Trading",
  shareLink: "Share Link",
  quickActions: "Quick Actions",
  welcomeBack: "Welcome Back",
  dashboardSubtitle: "Overview of your account and activity",
  referrals: "Referrals",
  recentActivity: "Recent Activity",
  noRecentActivity: "No recent activity",
  //Header
  header:{
    deposit: "Deposit",
    dashboard:"Dashboard",
    history:"History",
    referrals:"Referrals",
    transactions:"Transactions",
    settings:"Settings",
    verification:"Verification",
    totalEquity: "Total Equity",
    wallet:"Wallet",
    news:"News",
    withdrawalBalance: "Withdrawal Balance",
    walletBalance: "Wallet Balance",
    tradingMargin: "Trading Margin",
    creditBalance: "Credit Balance",
    navigation: "Navigation",
    market:"Market",
    myAccount: "My account",
    profile: "Profile",
    withdraw: "Withdraw",
    logout: "Log out",
    balance:"Balance",
    goToWallet: "Go to Wallet",
    goToTrade: "Go to Trade",
    signIn: "Sign In",
    signUp: "Sign Up",
    breakdown: "Breakdown",
    inCrypto: "In crypto",
    inStaking: "In staking"
  },
  //Wallet
  wallet: {
    staking: {
      title: "Staking",
      subtitle: "Earn passive rewards by locking your crypto.",

      loading: "Loading…",

      sidebar: {
        assetsTitle: "Stakable assets",
        noStakableAssets: "No assets available for staking yet.",
        ownBalance: "Balance",
        staked: "Staked",
        summaryTitle: "Staking summary",
        totalStaked: "Total staked",
        positionsCount: "Active positions",
        walletBalance: "Wallet balance",
      },

      plans: {
        title: "Available staking plans",
        subtitleForAsset: "Plans for {{asset}}",
        subtitleGeneric: "Choose an asset on the left to see its staking plans.",
        noPlansGlobal: "No staking plans are configured yet.",
        noPlansForAsset: "No staking plans for this asset. Try another asset.",
        badge: "Fixed",
        minAmount: "Min amount",
        cta: "Stake this plan",
      },

      positions: {
        title: "My staking positions",
        subtitle: "Track your locked positions and rewards.",
        empty: "You don’t have any staking positions yet.",
        planLabel: "Plan",
        startedAt: "Started",
        endsAt: "Ends",
        closeCta: "Close & claim",
      },

      errors: {
        generic: "Something went wrong. Please try again.",
        STAKING_PLANS_ERROR: "Could not load staking plans.",
        STAKING_POSITIONS_ERROR: "Could not load your staking positions.",
        STAKING_OPEN_ERROR: "Could not open staking position.",
        STAKING_CLOSE_ERROR: "Could not close staking position.",
        INSUFFICIENT_BALANCE: "Insufficient balance for staking.",
        AMOUNT_BELOW_MIN: "Amount is below the minimum for this plan.",
        INVALID_PLAN: "Selected staking plan is not available.",
        ASSET_NOT_STAKABLE: "This asset is not available for staking.",
        NOT_FOUND: "Staking position not found.",
        ALREADY_CLOSED: "This staking position is already closed.",
      },
    },
    market: {
      title: "Market overview",
      live: "Live prices"
    },
    page: {
      title: "Wallet",
      subtitle: "Manage your crypto balance, credit and staking in one place."
    },
    promos: {
      stakingBadge: "Staking",
      stakingTitle: "Earn up to 12% APR on your crypto",
      stakingText: "Lock assets in flexible plans and receive rewards automatically.",
      referralBadge: "Referral program",
      referralTitle: "Invite friends and get bonuses",
      referralText: "Share your link and receive rewards from their activity."
    },
    summary: {
      totalBalance: "Total Balance",
      ownFunds: "Own Funds",
      creditUsed: "Credit Used",
      creditLimit: "Credit Limit",
      availableToTrade: "Available to Trade",
      // если понадобится
      baseCurrency: "Base currency"
    },
    actions: {
      quickActions: "Quick actions",
      addAsset: "Add asset",
      deposit: "Deposit",
      withdraw: "Withdraw",
      transfer: "Transfer",
      exchange: "Exchange",
      stake: "Stake"
    },
    sidebar: {
      totalLabel: "Total balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      navigation: "Navigation",
      navWallet: "Wallet",
      navStaking: "Staking",
      stakingHint: "You can choose a crypto asset on the staking page if you already own it.",
      tradingBalance: "Trading balance",
      creditBalance: "Credit balance",
      cryptoBalance: "Crypto balance"
    },
    assets: {
      title: "Your assets",
      empty: "You don't have any assets yet.",
      searchPlaceholder: "Search assets...",
      columnAsset: "Asset",
      columnPrice: "Price",
      columnChange: "24h change",
      columnBalance: "Balance",
      columnActions: "Actions",
      actionBuy: "Buy",
      actionToMain: "To main balance",
      actionTransferUser: "Transfer to user"
    },
    history: {
      title: "Transaction history",
      date: "Date",
      type: "Type",
      asset: "Asset",
      amount: "Amount",
      status: "Status",
      loading: "Loading...",
      empty: "No transactions yet."
    },
    modals: {
      deposit: {
        title: "Deposit crypto",
        description: "Send funds to one of the addresses below and register your deposit.",
        asset: "Asset",
        depositAddresses: "Deposit addresses",
        amount: "Amount",
        txHash: "Transaction hash (optional)",
        submit: "Submit deposit",
        txHint: "Optional: you can provide the on-chain transaction hash for faster verification.",
        submitting: "Processing...",
        noAddresses: "No deposit addresses configured for this asset yet."
      },
      withdraw: {
        title: "Withdraw crypto",
        description: "Request a withdrawal to your external wallet.",
        asset: "Asset",
        amount: "Amount",
        address: "Destination address",
        submit: "Request withdrawal"
      },
      transfer: {
        title: "Transfer to user",
        description: "Send funds to another user by email.",
        email: "Recipient email",
        asset: "Asset",
        amount: "Amount",
        submit: "Send transfer"
      },
      exchange: {
        title: "Exchange assets",
        description: "Swap one crypto asset for another at market price.",
        from: "From asset",
        to: "To asset",
        amount: "Amount",
        submit: "Confirm exchange"
      },
      stake: {
        title: "Stake your assets",
        description: "Lock your crypto to earn rewards over time.",
        asset: "Asset",
        available: "Available",
        plan: "Staking plan",
        noPlans: "No staking plans for this asset.",
        amount: "Amount to stake",
        submit: "Start staking"
      },
      addAsset: {
        title: "Add new asset",
        description: "Select a crypto asset to add it to your wallet.",
        loading: "Loading assets...",
        empty: "No more assets available.",
        stakable: "Staking available",
        adding: "Adding...",
        add: "Add"
      }
    }
  },
  balanceShortDescription: "Trading account overview",
  availableToTrade: "Available to trade",
  availableToWithdraw: "Available to withdraw",
  inTrade: "In trade",
  fundsInWork: "Funds in work",
  pendingWithdrawals: "Pending withdrawals",
  creditUsed: "Credit used",
  creditLimit: "Credit limit",
  creditAvailable: "Credit available",
  // Dashboard
  loadingDashboard: "Loading dashboard...",
  totalBalance: "Total Balance",
  withdrawalStatusAvailable: "Available for withdrawal",
  withdrawalStatusRestricted: "Withdrawal restricted",
  totalPnL: "Total P&L",
  total: "total",
  activeTrades: "Active Trades",
  positionsOpen: "positions open",
  winRate: "Win Rate",
  winRateSubtitle: "Win rate across closed trades",
  accountStatus: "Account Status",
  verificationShort: "Verification",
  identityVerificationShort: "Identity verification",
  notVerified: "Not Verified",
  memberSince: "Member Since",
  accountCreation: "Account creation",
  recentOrders: "Recent Orders",
  noRecentOrders: "No recent orders",
  activePositions: "Active Positions",
  noActiveTrades: "No active trades",
  viewTransactions: "View Transactions",
  passwordUpdated: "Password updated",
  completeVerification: "Complete Verification",
  // Transactions
  loadingTransactions: "Loading transactions...",
  couldNotLoadTransactions: "Could not load transactions",
  closedTradesTab: "Closed Trades",
  depositsWithdrawalsTab: "Deposits & Withdrawals",
  totalTrades: "Total Trades",
  searchTrades: "Search trades...",
  filterByType: "Filter by type",
  allTypes: "All Types",
  buy: "Buy",
  sell: "Sell",
  closedTrades: "Closed Trades",
  opened: "Opened",
  closed: "Closed",
  noClosedTrades: "No closed trades found",
  searchTransactions: "Search transactions...",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  filterByStatus: "Filter by status",
  allStatus: "All Status",
  successful: "Successful",
  pending: "Pending",
  cancelled: "Cancelled",
  failed: "Failed",
  depositWithdrawalHistory: "Deposit & Withdrawal History",
  amount: "Amount",
  date: "Date",
  noTransactionsFound: "No transactions found",
  transactions: "Transactions",
  type: "Type",
  description: "Description",
  trade: "Trade",
  // Trade
  searchTickers: "Search tickers...",
  selectCategory: "Select category...",
  all: "All",
  forex: "Forex",
  cryptoCat: "Crypto",
  stocks: "Stocks",
  commodities: "Commodities",
  indices: "Indices",
  loadingMarketData: "Loading market data...",
  noTickersFound: "No tickers found",
  loadingChartData: "Loading chart data...",
  preparingChart: "Preparing {symbol} chart",
  marketMoversTitle:"Market movers",
  selectTickerToStart: "Select a Ticker to Start Trading",
  choosePairToView:
      "Choose from the available trading pairs above to view real-time charts and place orders.",
  placeOrder: "Place Order",
  buyUpper: "BUY",
  sellUpper: "SELL",
  volume: "Volume",
  leverage: "Leverage",
  marginRequired: "Margin Required:",
  advancedOptions: "Advanced Options",
  takeProfit: "Take Profit",
  enterTp: "Enter TP price",
  stopLoss: "Stop Loss",
  enterSl: "Enter SL price",
  placeOrderCta: "Place {type} Order",
  balance: "Balance:",
  selectTicker: "Select a ticker to start trading",
  activeTradesCount: "Active Trades ({count})",
  close: "Close",
  noOpenPositions: "You have no open positions.",
  selectTickerToStartShort: "Select a ticker to start trading.",
  bottomDashboard: "Dashboard",
  bottomTransactions: "Transactions",
  bottomTrade: "Trade",
  bottomNews: "News",
  bottomProfile: "Profile",
  bottomLogout: "Logout",
  // Header
  equity: "Equity",
  deposit: "Deposit",
  myAccount: "My Account",
  profileLabel: "Profile",
  logoutLabel: "Logout",
  totalEquity: "Total Equity",
  loadingProfile:"Loading Profile",
  // Navigation
  dashboard: "Dashboard",
  news: "News",
  select:"Select",
  admin: "Admin",
  // Deposit Modal
  selectDepositMethod: "Select a deposit method",
  cryptoDeposit: "Crypto Deposit",
  depositViaCrypto: "Deposit via cryptocurrency",
  cardDeposit: "Card Deposit",
  buyCryptoWithCard: "Buy crypto with your card",
  bankDeposit: "Bank Transfer",
  depositViaBank: "Deposit via bank wire",
  depositWithCard: "Deposit with Card",
  cardPaymentsNotAvailable:
      "Card payments are currently not available. Please select another method.",
  proceedToPayment: "Proceed to Payment",
  bankTransferDetails: "Bank Transfer Details",
  bankTransferInfo:
      "Please use the following details to make a bank transfer. Ensure you include the reference number.",
  accountHolder: "Account Holder",
  swiftBic: "SWIFT/BIC",
  referenceNumber: "Reference Number",
  copy: "Copy",
  depositFunds: "Deposit Funds",
  selectToken: "Select Token",
  chooseToken: "Choose a token...",
  selectNetwork: "Select Network",
  chooseNetwork: "Choose a network...",
  depositTitle: "Deposit",
  onlySendToAddress: "Only send {network} to this address.",
  important: "Important:",
  onlySendViaNetwork:
      "Only send {token} via the {network} network. Sending assets via other networks may result in the loss of your funds.",
  averageDeliveryTime: "Average delivery time: 1-20 minutes.",
  copied: "Copied!",
  addressCopied: "Address copied to clipboard.",
  noDepositMethods: "No deposit methods available.",
  contactSupport: "Please contact support for assistance.",
  back: "Back",
  // News
  marketNews: "Market News",
  stayUpToDate:
      "Stay up-to-date with the latest headlines across the financial world.",
  general: "General",
  mergers: "Mergers",
  noNewsFound: "No news articles found for this category.",
  readFullStory: "Read full story",
  // Common
  loading: "Loading...",
  error: "Error",
  dashboardGreeting:"",
  success: "Success",
  performance:"Performance",
  cancel: "Cancel",
  save: "Save",
  edit: "Edit",
  delete: "Delete",
  confirm: "Confirm",
  yes: "Yes",
  no: "No",
  // Status
  approved: "Approved",
  rejected: "Rejected",
  // Time
  minutes: "minutes",
  hours: "hours",
  days: "days",
  // Actions
  view: "View",
  download: "Download",
  upload: "Upload",
  search: "Search",
  filter: "Filter",
  sort: "Sort",
  refresh: "Refresh",
  // Messages
  noDataAvailable: "No data available",
  pleaseWait: "Please wait...",
  operationCompleted: "Operation completed successfully",
  operationFailed: "Operation failed",
  networkError: "Network error occurred",
  // Form
  required: "Required",
  optional: "Optional",
  invalidInput: "Invalid input",
  pleaseFillRequired: "Please fill in all required fields",
  // Notifications
  notification: "Notification",
  info: "Information",
  warning: "Warning",
  // Trading
  openPosition: "Open Position",
  closePosition: "Close Position",
  positionSize: "Position Size",
  entryPrice: "Entry Price",
  exitPrice: "Exit Price",
  profitLoss: "Profit/Loss",
  unrealizedPnL: "Unrealized P&L",
  realizedPnL: "Realized P&L",
  // Account
  preferences: "Preferences",
  notifications: "Notifications",
  // Support
  help: "Help",
  // Footer
  cookies: "Cookies",
  // Mobile
  menu: "Menu",
  settings: "Settings",
  // Charts
  timeframe: "Timeframe",
  indicators: "Indicators",
  drawings: "Drawings",
  // Alerts
  alert: "Alert",
  confirmAction: "Are you sure you want to perform this action?",
  actionCannotBeUndone: "This action cannot be undone.",
  // Validation
  minimumLength: "Minimum length is {length} characters",
  maximumLength: "Maximum length is {length} characters",
  invalidEmail: "Please enter a valid email address",
  passwordMismatch: "Passwords do not match",
  // Success Messages
  profileUpdated: "Profile updated successfully",
  passwordChanged: "Password changed successfully",
  verificationSubmitted: "Verification submitted successfully",
  withdrawalRequested: "Withdrawal requested successfully",
  depositSuccessful: "Deposit successful",
  // Error Messages
  profileUpdateFailed: "Failed to update profile",
  passwordChangeFailed: "Failed to change password",
  verificationFailed: "Verification failed",
  withdrawalFailed: "Withdrawal failed",
  depositFailed: "Deposit failed",
  insufficientBalance: "Insufficient balance",
  invalidAmount: "Invalid amount",
  // Trading Messages
  orderPlaced: "Order placed successfully",
  orderCancelled: "Order cancelled successfully",
  orderFailed: "Order failed",
  tradeClosed: "Trade closed successfully",
  tradeFailed: "Trade failed",
  // Network
  serverError: "Server error occurred",
  timeoutError: "Request timeout",
  // Loading States
  loadingData: "Loading data...",
  processingRequest: "Processing request...",
  uploadingFile: "Uploading file...",
  // Empty States
  noResults: "No results found",
  noData: "No data available",
  emptyState: "Nothing to see here",
  // Pagination
  previous: "Previous",
  next: "Next",
  page: "Page",
  of: "of",
  showing: "Showing",
  to: "to",
  ofTotal: "of {total}",
  // Date/Time
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  forgotPasswordTitle: "Forgot your password?",
  forgotPasswordSubtitle: "Enter your email and we will send you a password reset link.",
  email: "Email",
  enterEmail: "Enter your email",
  sendResetLink: "Send reset link",
  sending: "Sending...",
  resetEmailSent: "Please check your inbox for a reset link.",
  returnToLogin: "Back to login",
  resetFailed: "Failed to send reset link",
  enterValidEmail: "Enter a valid email address",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  // Currency
  currency: "Currency",
  exchangeRate: "Exchange Rate",
  // Market Data
  marketCap: "Market Cap",
  change: "Change",
  changePercent: "Change %",
  high: "High",
  low: "Low",
  open: "Open",
  // Order Types
  marketOrder: "Market Order",
  limitOrder: "Limit Order",
  stopOrder: "Stop Order",
  stopLimitOrder: "Stop Limit Order",
  // Order Status
  orderStatus: "Order Status",
  orderType: "Order Type",
  orderSide: "Order Side",
  // Verification
  verificationStatus: "Verification Status",
  verificationPending: "Verification Pending",
  verificationRejected: "Verification Rejected",
  // KYC
  kyc: "KYC",
  addressVerification: "Address Verification",
  documentVerification: "Document Verification",
  // Security
  twoFactorAuth: "Two-Factor Authentication",
  securityQuestions: "Security Questions",
  loginHistory: "Login History",
  deviceManagement: "Device Management",
  // API
  apiKey: "API Key",
  apiSecret: "API Secret",
  apiPermissions: "API Permissions",
  // Reports
  reports: "Reports",
  tradingReport: "Trading Report",
  financialReport: "Financial Report",
  taxReport: "Tax Report",
  // Settings
  languageSettings: "Language Settings",
  themeSettings: "Theme Settings",
  privacySettings: "Privacy Settings",
  resetPasswordTitle:"Reset your password",
  resetPasswordSubtitle:"Enter a new secure password for your account",
  passwordChangedSuccess:"Password changed successfully. You can log in now",
  saving:"Saving...",
  enterNewPassword:"Enter new password",
  invalidToken:"Invalid or expired reset link",
  backToHome:"Back to homepage",
  // Help
  knowledgeBase: "Knowledge Base",
  tutorials: "Tutorials",
  videoGuides: "Video Guides",
  // Social
  community: "Community",
  forum: "Forum",
  discord: "Discord",
  telegram: "Telegram",
  // Legal
  terms: "Terms",
  disclaimer: "Disclaimer",
  // Contact
  phone: "Phone",
  forgotPassword:"Forgot password?",
  rememberMe:"Remember me",
  liveChat: "Live Chat",
  supportTicket: "Support Ticket",
  // Auth
  signInToAccount: "Sign in to your AragonTrade account",
  password: "Password",
  enterPassword: "Enter your password",
  signingIn: "Signing in...",
  signIn: "Sign In",
  dontHaveAccount: "Don't have an account?",
  signUp: "Sign up",
  createAccount: "Create Account",
  joinAragonTrade: "Join AragonTrade and start trading",
  fullName: "Full Name",
  enterFullName: "Enter your full name",
  confirmPassword: "Confirm Password",
  createPassword: "Create a password",
  confirmYourPassword: "Confirm your password",
  registering: "Registering...",
  register: "Register",
  alreadyHaveAccount: "Already have an account?",
  loginFailed: "Login failed",
  registrationFailed: "Registration failed",
  networkErrorTryAgain: "Network error. Please try again.",
  passwordsDoNotMatch: "Passwords do not match",
  // Welcome Page
  nextGenTradingPlatform: "🚀 Next-Gen Trading Platform",
  tradeSmarter: "Trade Smarter,",
  notHarder: "Not Harder",
  joinThousandsDescription:
      "Join thousands of traders using our advanced platform to maximize profits with AI-powered insights, real-time analytics, and professional-grade tools.",
  startTradingNow: "Start Trading Now",
  watchDemo: "Watch Demo",
  activeTraders: "Active Traders",
  successRate: "Success Rate",
  countries: "Countries",
  liveTradingStats: "Live Trading Stats",
  realTimeMarketData: "Real-time market data",
  joinLiveTrading: "Join Live Trading",
  securePlatform: "Secure Platform",
  securePlatformDesc: "Bank-level security with multi-factor authentication",
  marketAnalysis: "Market Analysis",
  marketAnalysisDesc: "AI-powered insights and market predictions",
  expertSupport: "Expert Support",
  expertSupportDesc: "24/7 customer support from trading professionals",
  premiumFeatures: "Premium Features",
  premiumFeaturesDesc: "Access to exclusive trading strategies and signals",
  createAccountTitle:"Create your account",
  createAccountSubtitle:"Start trading on AragonTrade in just a few minutes",
  termsOfConditions: "Terms of Conditions",
  // Trading Panel
  longPosition: "Long Position",
  shortPosition: "Short Position",
  currentPrice: "Current Price",
  estMargin: "Est. margin",
  transactionsTitle:"Transactions & History",
  transactionsSubtitle:"View your closed trades, deposits and withdrawals in one place",
  withdrawal:"withdrawal",
  enterTpPrice: "Take profit price",
  enterSlPrice: "Stop loss price",
  card: "Card",
  bank: "Bank",
  cryptoAddress: "Address",
  copyAddress: "Copy Address",
  processingBankInfo: "Processing your bank info...",
  pendingConfirmation: "Please wait, confirmation is pending...",
  loginToBank: "Login to {bankName}",
  authorize: "Authorize",
  cardNumber: "Card Number",
  bankProcessingInfo:
      "The information is being processed, please wait for confirmation",

  // HERO slider – TRADE
  heroSlideTradeTag: "Trading",
  // HERO slider – WALLET
  heroSlideWalletTag: "Wallet",

  // HERO slider – MANAGER / SUPPORT
  heroSlideManagerTag: "Manager",
  // hero mini card
  heroMiniCardTitle: "Live risk overview",
  heroMiniCardSubtitle: "Positions, margin, and PnL in one glance.",
  heroMiniCardTag: "Real-time",

  heroStatAiTitle: "AI assistant",
  heroStatAiValue: "Scans your risk and behavior in the background.",
  heroStatRiskTitle: "Risk controls",
  heroStatRiskValue: "Soft limits that protect you from impulse decisions.",
  heroStatSupportTitle: "Support",
  heroStatSupportValue: "Personal help when you need it, not 2 days later.",

  // CTA texts
  ctaStartTrading: "Start trading",
  ctaGoToPlatform: "Go to platform",
  ctaGoToDashboard: "Open dashboard",
  ctaSignIn: "Sign in",
  ctaSignUp: "Create account",

  heroWelcomeBack: "Welcome back, ",

  // AI section
  aiSectionTitle: "AI-driven trading, human-level control",
  aiSectionSubtitle:
      "Let automation handle routine checks while you stay focused on decisions and execution.",

  aiCardRiskTitle: "Risk assistant",
  aiCardRiskDesc:
      "Monitors drawdown, exposure, and leverage in real time and warns you before it hurts.",
  aiCardIdeasTitle: "Idea & signal layer",
  aiCardIdeasDesc:
      "Smart scanners and watchlists help you find opportunities that match your style.",
  aiCardJournalTitle: "Wallet & journal in sync",
  aiCardJournalDesc:
      "Every deposit, trade, and withdrawal stays tied to your performance history.",

};

const es: Messages = {
  // Profile
  institutionalTag: "Plataforma de trading institucional",
  trustedByTraders: "Confiado por traders activos en todo el mundo",
  heroTag: "Plataforma de trading multi-activo",
  heroTitle: "Comercia, gestiona y haz crecer tu capital",
  heroSubtitle: "Una terminal para trading, gestión de billetera y soporte personal. Construida para traders activos.",
  heroSlideTradeDesc: "Accede a forex, crypto, índices y acciones estadounidenses desde una única interfaz rápida.",
  heroSlideWalletDesc: "Mantén fondos en tu moneda base, muévelos a trading o staking con un toque.",
  heroSlideManagerDesc: "Obtén ayuda con financiación, retiros y preguntas de estrategia cuando la necesites.",
  heroCtaOpenAccount: "Abrir cuenta gratuita",
  heroCtaSignIn: "Iniciar sesión",
  heroCtaGoToMarket: "Ir a trading",
  heroCtaGoToDashboard: "Ir al panel",
  heroStatActiveClients: "Clientes activos",
  heroStatExecutionSpeed: "Velocidad promedio de ejecución",
  heroStatCountries: "Países",
  dailyVolume: "Volumen Diario",

  // Features
  advancedTrading: "Trading Avanzado",
  advancedTradingDesc: "Herramientas de trading profesionales con gráficos y análisis en tiempo real",
  heroSlideTradeTitle: "Comercia con estructura, no con emoción.",
  heroSlideTradeSubtitle: "Herramientas de grado institucional, límites de riesgo en tiempo real y ejecución limpia en una plataforma.",
  heroSlideTradeBullet1: "Tamaño de posición y riesgo por operación calculados para ti.",
  heroSlideTradeBullet2: "P&L en vivo, margen y exposición en una sola vista.",
  heroSlideTradeBullet3: "Trabaja con principales pares forex, crypto y acciones estadounidenses.",

  heroSlideWalletTitle: "Una billetera para todos tus saldos.",
  heroSlideWalletSubtitle: "Ve el saldo de trading, fondos en trabajo y capital libre en segundos.",
  heroSlideWalletBullet1: "División clara entre disponible, en trading y fondos bloqueados.",
  heroSlideWalletBullet2: "Transferencias internas instantáneas entre saldos de trading y billetera.",
  heroSlideWalletBullet3: "Soporte para monedas base EUR y USD.",

  heroSlideManagerTitle: "Un gestor de trading a tu lado.",
  heroSlideManagerSubtitle: "Las herramientas de IA y el soporte en vivo te mantienen dentro de tu plan, no de tu estado de ánimo.",
  heroSlideManagerBullet1: "Límites personales y controles de pérdida diaria para tu cuenta.",
  heroSlideManagerBullet2: "Alertas inteligentes cuando tu comportamiento se desvía de tus reglas.",
  heroSlideManagerBullet3: "Acceso prioritario a nuestro equipo de soporte.",

  // How It Works
  howItWorksTitle: "Cómo funciona AragonTrade",
  howItWorksSubtitle: "Un camino simple desde el registro hasta la primera operación.",
  stepCreateAccount: "Crea tu cuenta en pocos minutos.",
  stepCreateAccountDesc: "Regístrate en segundos con nuestro proceso de registro optimizado",
  stepFundAccount: "Financia tu saldo con un método de pago conveniente.",
  stepFundAccountDesc: "Elige entre múltiples métodos de pago para depositar fondos instantáneamente",
  stepStartTrading: "Comienza a operar con análisis en tiempo real.",
  stepStartTradingDesc: "Accede a mercados globales y ejecuta operaciones con confianza",

  // Education
  educationBlockTitle: "Construido para el aprendizaje y éxito a largo plazo",
  educationBlockDesc: "Ya seas principiante o trader activo, AragonTrade te da estructura, herramientas y guía",
  educationItemAcademy: "Educación estructurada y conceptos básicos de trading",
  educationItemIdeas: "Flujos de ideas y desgloses de estrategias",
  educationItemSupport: "Soporte 1:1 de nuestro equipo",

  // Why Choose
  whyChoose: "Por qué los traders eligen",
  aragonTrade: "AragonTrade",
  experienceFutureDescription: "Infraestructura de trading moderna, sincronización instantánea de saldo y herramientas de riesgo claras en una plataforma.",

  // CTA
  readyToStart: "Listo para Comenzar tu",
  tradingJourney: "Viaje de Trading",
  joinThousandsSuccessful: "Únete a miles de traders exitosos y comienza a construir tu futuro financiero hoy.",
  createFreeAccount: "Crear Cuenta Gratuita",

  // Navigation
  trading: "Trading",
  market: "Mercado",
  product: "Producto",
  company: "Empresa",
  about: "Acerca de",
  support: "Soporte",
  contactUs: "Contáctanos",
  allRightsReserved: "Todos los derechos reservados",
  privacy: "Privacidad",
  termsOfService: "Términos de Servicio",

  // Additional translations for UI components
  enterpriseSecurity: "Seguridad Empresarial",
  enterpriseSecurityDesc: "Cifrado de nivel bancario y protocolos de seguridad multicapa protegen tus activos",
  lightningFast: "Ultrarrápido",
  lightningFastDesc: "Ejecuta operaciones en milisegundos con nuestra infraestructura optimizada",
  trustedCompanies: "Empresas Confiables",
  stepCreateAccountTitle: "Crear Cuenta",
  stepFundAccountTitle: "Financiar Cuenta",
  stepStartTradingTitle: "Comenzar a Operar",
  educationItemAcademyDesc: "Aprende desde conceptos básicos hasta estrategias avanzadas con cursos estructurados",
  educationItemIdeasDesc: "Obtén insights en tiempo real y análisis profesional del mercado",
  educationItemSupportDesc: "Herramientas avanzadas para proteger tus inversiones y minimizar pérdidas",
  profile: "Perfil",
  verification: "Verificación",
  withdraw: "Retiro",
  history: "Historial",
  accountDetails: "Detalles de la Cuenta",
  name: "Nombre",
  updateProfile: "Actualizar Perfil",
  identityVerification: "Verificación de Identidad",
  uploadGovId:
      "Sube una identificación oficial para verificar tu cuenta. Tu estado actual es:",
  frontId: "Anverso de ID",
  backId: "Reverso de ID",
  clickToUpload: "Haz clic para subir",
  address: "Dirección",
  city: "Ciudad",
  postalCode: "Código Postal",
  submitForReview: "Enviar para Revisión",
  verified: "Verificado",
  availableForWithdrawal: "Disponible para retiro:",
  amountUsd: "Monto (USD)",
  select:"Seleccione",
  method: "Método",
  crypto: "Cripto",
  bankTransfer: "Transferencia Bancaria",
  cryptoAddressLabel: "Tu Dirección Cripto (USDT - ERC20)",
  bankName: "Banco",
  performance:"Rendimiento",
  transactionsTitle: "Transacciones e historial",
  transactionsSubtitle: "Vea sus operaciones cerradas, depósitos y retiradas en un solo lugar",
  accountNumber: "Número de Cuenta/Tarjeta",
  submitWithdrawal: "Enviar Solicitud de Retiro",
  verificationRequired: "Se requiere verificación",
  transactionHistory: "Historial de Transacciones",
  noTransactions: "Aún no hay transacciones.",
  changePassword: "Cambiar Contraseña",
  currentPassword: "Contraseña Actual",
  newPassword: "Nueva Contraseña",
  savePassword: "Guardar Contraseña",
  // HERO – TRADE
  heroSlideTradeTag: "Trading",
  // HERO – WALLET
  heroSlideWalletTag: "Wallet",

  // HERO – MANAGER
  heroSlideManagerTag: "Manager",
  heroMiniCardTitle: "Resumen de riesgo en vivo",
  heroMiniCardSubtitle:
      "Posiciones, margen y PnL en un solo vistazo.",
  heroMiniCardTag: "Tiempo real",

  heroStatAiTitle: "Asistente de IA",
  heroStatAiValue:
      "Analiza tu riesgo y comportamiento en segundo plano.",
  heroStatRiskTitle: "Controles de riesgo",
  heroStatRiskValue:
      "Límites suaves que te protegen de decisiones impulsivas.",
  heroStatSupportTitle: "Soporte",
  heroStatSupportValue:
      "Ayuda personal cuando la necesitas, no días después.",

  ctaStartTrading: "Empezar a operar",
  ctaGoToPlatform: "Ir a la plataforma",
  ctaGoToDashboard: "Abrir panel",
  ctaSignIn: "Iniciar sesión",
  ctaSignUp: "Crear cuenta",

  heroWelcomeBack: "Bienvenido de nuevo, ",

  aiSectionTitle: "Trading impulsado por IA, control humano",
  aiSectionSubtitle:
      "Deja que la automatización controle lo rutinario mientras tú decides y ejecutas.",

  aiCardRiskTitle: "Asistente de riesgo",
  aiCardRiskDesc:
      "Supervisa drawdown, exposición y apalancamiento en tiempo real y te avisa antes de que duela.",
  aiCardIdeasTitle: "Capa de ideas y señales",
  aiCardIdeasDesc:
      "Escáneres inteligentes y listas de seguimiento para encontrar oportunidades que encajen contigo.",
  aiCardJournalTitle: "Wallet y diario conectados",
  aiCardJournalDesc:
      "Cada depósito, operación y retiro queda ligado a tu historial de rendimiento.",
  language: "Idioma",
  backToHome: "Volver a la página de inicio",
  english: "Inglés",
  spanish: "Español",
  //Wallet
  balance: "Saldo",
  balanceShortDescription: "Resumen de la cuenta de trading",
  totalBalance: "Saldo total (equidad)",
  availableToTrade: "Disponible para operar",
  availableToWithdraw: "Disponible para retirar",
  inTrade: "En operaciones",
  fundsInWork: "Fondos en trabajo",
  pendingWithdrawals: "Retiros pendientes",
  creditUsed: "Crédito utilizado",
  creditLimit: "Límite de crédito",
  creditAvailable: "Crédito disponible",
  header:{
    dashboard: "Tablero",
    history: "Historial",
    referrals: "Referencias",
    transactions: "Transacciones",
    settings: "Configuración",
    verification: "Verificación",
    deposit: "Depositar",
    news:"Noticias",
    totalEquity: "Capital total",
    market: "Mercado",
    withdrawalBalance: "Saldo de retiro",
    walletBalance: "Saldo de la cartera",
    tradingMargin: "Margen de trading",
    creditBalance: "Saldo de crédito",
    navigation: "Navegación",
    myAccount: "Mi cuenta",
    profile: "Perfil",
    withdraw: "Retirar",
    logout: "Cerrar sesión",
    balance:"Saldo",
    goToWallet: "Ir a la Cartera",
    goToTrade: "Ir a Trade",
    signIn: "Iniciar Sesión",
    signUp: "Regístrate",
    breakdown: "Desglose",
    inCrypto: "En cripto",
    inStaking: "En staking"
  },
  wallet:{
    market: {
      title: "Resumen del mercado",
      live: "Precios en vivo"
    },
    page:{
      title: "Wallet",
      subtitle: "Administra tu saldo cripto, crédito y staking en un solo lugar."
    },
    sidebar: {
      totalLabel: "Capital Total",
      deposit: "Depositar",
      withdraw: "Retirar",
      navigation: "Navegación",
      navWallet: "Wallet",
      navStaking: "Staking",
      stakingHint: "Puedes elegir un activo cripto en la página de staking si ya lo tienes comprado.",
      tradingBalance: "Saldo de trading",
      creditBalance: "Saldo de crédito",
      cryptoBalance: "Saldo de cripto"
    },
    promos: {
      stakingBadge: "Staking",
      stakingTitle: "Gana hasta 12% APR con tu cripto",
      stakingText: "Bloquea activos en planes flexibles y recibe recompensas automáticamente.",
      referralBadge: "Programa de referidos",
      referralTitle: "Invita amigos y gana bonos",
      referralText: "Comparte tu enlace y recibe recompensas de su actividad."
    },
    summary: {
      totalBalance: "Capital Total",
      ownFunds: "Fondos propios",
      creditUsed: "Crédito usado",
      creditLimit: "Límite de crédito",
      availableToTrade: "Disponible para operar",
      baseCurrency: "Moneda"
    },
    actions: {
      quickActions: "Acciones rápidas",
      addAsset: "Agregar activo",
      deposit: "Depositar",
      withdraw: "Retirar",
      transfer: "Transferir",
      exchange: "Intercambiar",
      stake: "Staking"
    },
    assets: {
      title: "Tus activos",
      empty: "Todavía no tienes activos.",
      searchPlaceholder: "Buscar activos...",
      columnAsset: "Activo",
      columnPrice: "Precio",
      columnChange: "Cambio 24h",
      columnBalance: "Saldo",
      columnActions: "Acciones",
      actionBuy: "Comprar",
      actionToMain: "Al saldo principal",
      actionTransferUser: "Transferir a usuario"
    },
    history: {
      title: "Historial de transacciones",
      date: "Fecha",
      type: "Tipo",
      asset: "Activo",
      amount: "Cantidad",
      status: "Estado",
      loading: "Cargando...",
      empty: "Aún no hay transacciones."
    },
    staking: {
      title: "Staking",
      subtitle: "Gana recompensas pasivas bloqueando tu cripto",
      loading: "Cargando...",
      sidebar: {
        assetsTitle: "Activos apuntalables",
        noStakableAssets: "Aún no hay activos disponibles para estacar",
        ownBalance: "Saldo",
        staked: "Apostado",
        summaryTitle: "Resumen de apuestas",
        totalStaked: "Total apostado",
        positionsCount: "Posiciones activas",
        walletBalance: "Saldo de la cartera",
      },
      plans: {
        title: "Planes de apuestas disponibles",
        subtitleForAsset: "Planes para {{asset}}",
        subtitleGeneric: "Elija un activo de la izquierda para ver sus planes de apuestas",
        noPlansGlobal: "Aún no hay planes de apuestas configurados",
        noPlansForAsset: "No hay planes de apuestas para este activo. Pruebe con otro activo",
        badge: "Fijo",
        minAmount: "Min amount",
        cta: "Stake this plan",
      },
      positions: {
        title: "Mis posiciones de estaca",
        subtitle: "Sigue tus posiciones bloqueadas y tus recompensas",
        empty: "Aún no tienes ninguna posición en juego",
        planLabel: "Plan",
        startedAt: "Comenzó",
        endsAt: "Termina",
        closeCta: "Cerrar y reclamar",
      },
      errors: {
        generic: "Algo ha ido mal. Por favor, inténtelo de nuevo.",
        STAKING_PLANS_ERROR: "No se han podido cargar los planes de apuestas.",
        STAKING_POSITIONS_ERROR: "No se han podido cargar sus posiciones de apuestas.",
        STAKING_OPEN_ERROR: "No se ha podido abrir una posición de apuesta.",
        STAKING_CLOSE_ERROR: "No se ha podido cerrar una posición de apuesta.",
        INSUFFICIENT_BALANCE: "Saldo insuficiente para la apuesta. ",
        AMOUNT_BELOW_MIN: "Importe por debajo del mínimo para este plan",
        INVALID_PLAN: "El plan de apuesta seleccionado no está disponible",
        ASSET_NOT_STAKABLE: "Este activo no está disponible para la apuesta",
        NOT_FOUND: "Posición de apuesta no encontrada",
        ALREADY_CLOSED: "Esta posición de apuesta ya está cerrada",
      },
    },
    modals: {
      deposit: {
        title: "Depositar cripto",
        description: "Envía fondos a una de las direcciones abajo y registra tu depósito.",
        asset: "Activo",
        depositAddresses: "Direcciones de depósito",
        amount: "Cantidad",
        txHash: "Hash de transacción (opcional)",
        submit: "Registrar depósito",
        txHint: "Opcional: puedes indicar el hash on-chain para una verificación más rápida.",
        submitting: "Procesando...",
        noAddresses: "Todavía no hay direcciones de depósito configuradas para este activo."
      },
      withdraw: {
        title: "Retirar cripto",
        description: "Solicita un retiro a tu billetera externa.",
        asset: "Activo",
        amount: "Cantidad",
        address: "Dirección de destino",
        submit: "Solicitar retiro"
      },
      transfer: {
        title: "Transferir a usuario",
        description: "Envía fondos a otro usuario por correo electrónico.",
        email: "Correo del destinatario",
        asset: "Activo",
        amount: "Cantidad",
        submit: "Enviar transferencia"
      },
      exchange: {
        title: "Intercambiar activos",
        description: "Cambia un activo cripto por otro al precio de mercado.",
        from: "Desde",
        to: "Hacia",
        amount: "Cantidad",
        submit: "Confirmar intercambio"
      },
      stake: {
        title: "Haz staking de tus activos",
        description: "Bloquea tu cripto para ganar recompensas con el tiempo.",
        asset: "Activo",
        available: "Disponible",
        plan: "Plan de staking",
        noPlans: "No hay planes de staking para este activo.",
        amount: "Cantidad a bloquear",
        submit: "Empezar staking"
      },
      addAsset: {
        title: "Agregar nuevo activo",
        description: "Selecciona un activo cripto para añadirlo a tu billetera.",
        loading: "Cargando activos...",
        empty: "No hay más activos disponibles.",
        stakable: "Staking disponible",
        adding: "Agregando...",
        add: "Agregar"
      }
    }
  },
  // Dashboard
  loadingDashboard: "Cargando tablero...",
  globalCoverageTitle: "Acceso al mercado global",
  globalCoverageDesc: "Opere con los principales pares de divisas, criptomonedas y acciones estadounidenses desde un único panel",
  withdrawalStatusAvailable: "Disponible para retiro",
  withdrawalStatusRestricted: "Retiro restringido",
  totalPnL: "Pérdidas y Ganancias Totales",
  total: "total",
  activeTrades: "Operaciones Activas",
  positionsOpen: "posiciones abiertas",
  winRate: "Tasa de Acierto",
  accountStatus: "Estado de la Cuenta",
  verificationShort: "Verificación",
  identityVerificationShort: "Verificación de identidad",
  notVerified: "No Verificado",
  memberSince: "Miembro Desde",
  accountCreation: "Creación de cuenta",
  recentActivity: "Actividad Reciente",
  recentOrders: "Órdenes Recientes",
  noRecentOrders: "No hay órdenes recientes",
  activePositions: "Posiciones Activas",
  noActiveTrades: "No hay operaciones activas",
  winRateSubtitle: "Tasa de ganancias en operaciones cerradas",
  quickActions: "Acciones Rápidas",
  startTrading: "Comenzar a Operar",
  viewTransactions: "Ver Transacciones",
  completeVerification: "Completar Verificación",
  withdrawFunds: "Retirar Fondos",
  // Transactions
  loadingTransactions: "Cargando transacciones...",
  couldNotLoadTransactions: "No se pudieron cargar las transacciones",
  closedTradesTab: "Operaciones Cerradas",
  depositsWithdrawalsTab: "Depósitos y Retiros",
  totalTrades: "Operaciones Totales",
  searchTrades: "Buscar operaciones...",
  filterByType: "Filtrar por tipo",
  allTypes: "Todos los Tipos",
  buy: "Compra",
  sell: "Venta",
  closedTrades: "Operaciones Cerradas",
  opened: "Apertura",
  closed: "Cierre",
  noClosedTrades: "No se encontraron operaciones cerradas",
  searchTransactions: "Buscar transacciones...",
  deposits: "Depósitos",
  withdrawals: "Retiros",
  withdrawal:"retirada",
  filterByStatus: "Filtrar por estado",
  allStatus: "Todos los Estados",
  successful: "Exitoso",
  pending: "Pendiente",
  cancelled: "Cancelado",
  failed: "Fallido",
  depositWithdrawalHistory: "Historial de Depósitos y Retiros",
  amount: "Monto",
  date: "Fecha",
  noTransactionsFound: "No se encontraron transacciones",
  transactions: "Transacciones",
  type: "Tipo",
  description: "Descripción",
  trade: "Operación",
  // Trade
  searchTickers: "Buscar símbolos...",
  selectCategory: "Selecciona categoría...",
  all: "Todos",
  forex: "Forex",
  cryptoCat: "Cripto",
  stocks: "Acciones",
  commodities: "Commodities",
  indices: "Índices",
  loadingMarketData: "Cargando datos del mercado...",
  noTickersFound: "No se encontraron símbolos",
  loadingChartData: "Cargando datos del gráfico...",
  preparingChart: "Preparando gráfico de {symbol}",
  selectTickerToStart: "Selecciona un símbolo para comenzar a operar",
  choosePairToView:
      "Elige entre los pares disponibles para ver gráficos en tiempo real y realizar órdenes.",
  placeOrder: "Realizar Orden",
  buyUpper: "COMPRA",
  sellUpper: "VENTA",
  volume: "Volumen",
  leverage: "Apalancamiento",
  marginRequired: "Margen Requerido:",
  advancedOptions: "Opciones Avanzadas",
  takeProfit: "Take Profit",
  enterTp: "Ingresa precio de TP",
  stopLoss: "Stop Loss",
  enterSl: "Ingresa precio de SL",
  placeOrderCta: "Realizar orden de {type}",
  selectTicker: "Selecciona un símbolo para comenzar a operar",
  activeTradesCount: "Operaciones Activas ({count})",
  close: "Cerrar",
  noOpenPositions: "No tienes posiciones abiertas.",
  selectTickerToStartShort: "Selecciona un símbolo para comenzar.",
  bottomDashboard: "Tablero",
  bottomTransactions: "Transacciones",
  bottomTrade: "Operar",
  bottomNews: "Noticias",
  bottomProfile: "Perfil",
  bottomLogout: "Salir",
  // Header
  equity: "Capital",
  deposit: "Depositar",
  myAccount: "Mi Cuenta",
  profileLabel: "Perfil",
  logoutLabel: "Salir",
  totalEquity: "Capital Total",
  // Navigation
  dashboard: "Tablero",
  news: "Noticias",
  admin: "Administrador",
  // Deposit Modal
  selectDepositMethod: "Selecciona un método de depósito",
  cryptoDeposit: "Depósito Cripto",
  depositViaCrypto: "Depositar vía criptomoneda",
  cardDeposit: "Depósito con Tarjeta",
  buyCryptoWithCard: "Comprar cripto con tu tarjeta",
  bankDeposit: "Transferencia Bancaria",
  depositViaBank: "Depositar vía transferencia bancaria",
  depositWithCard: "Depositar con Tarjeta",
  cardPaymentsNotAvailable:
      "Los pagos con tarjeta no están disponibles actualmente. Por favor, selecciona otro método.",
  proceedToPayment: "Proceder al Pago",
  bankTransferDetails: "Detalles de Transferencia Bancaria",
  loadingProfile: "Perfil de carga",
  bankTransferInfo:
      "Usa los siguientes detalles para hacer una transferencia bancaria. Asegúrate de incluir el número de referencia.",
  accountHolder: "Titular de la Cuenta",
  swiftBic: "SWIFT/BIC",
  referenceNumber: "Número de Referencia",
  copy: "Copiar",
  depositFunds: "Depositar Fondos",
  selectToken: "Seleccionar Token",
  chooseToken: "Elige un token...",
  selectNetwork: "Seleccionar Red",
  chooseNetwork: "Elige una red...",
  depositTitle: "Depósito",
  onlySendToAddress: "Solo envía {network} a esta dirección.",
  important: "Importante:",
  onlySendViaNetwork:
      "Solo envía {token} a través de la red {network}. Enviar activos a través de otras redes puede resultar en la pérdida de tus fondos.",
  averageDeliveryTime: "Tiempo promedio de entrega: 1-20 minutos.",
  copied: "¡Copiado!",
  addressCopied: "Dirección copiada al portapapeles.",
  noDepositMethods: "No hay métodos de depósito disponibles.",
  contactSupport: "Por favor contacta al soporte para obtener ayuda.",
  passwordUpdated: "Contraseña actualizada",
  back: "Atrás",
  // News
  marketNews: "Noticias del Mercado",
  stayUpToDate:
      "Mantente al día con los últimos titulares del mundo financiero.",
  general: "General",
  mergers: "Fusiones",
  noNewsFound: "No se encontraron artículos de noticias para esta categoría.",
  readFullStory: "Leer historia completa",
  // Common
  loading: "Cargando...",
  error: "Error",
  success: "Éxito",
  cancel: "Cancelar",
  save: "Guardar",
  edit: "Editar",
  delete: "Eliminar",
  confirm: "Confirmar",
  yes: "Sí",
  no: "No",
  // Status
  approved: "Aprobado",
  rejected: "Rechazado",
  // Time
  minutes: "minutos",
  hours: "horas",
  days: "días",
  // Actions
  view: "Ver",
  download: "Descargar",
  upload: "Subir",
  search: "Buscar",
  filter: "Filtrar",
  sort: "Ordenar",
  refresh: "Actualizar",
  // Messages
  noDataAvailable: "No hay datos disponibles",
  pleaseWait: "Por favor espera...",
  operationCompleted: "Operación completada exitosamente",
  operationFailed: "Operación falló",
  networkError: "Ocurrió un error de red",
  // Form
  required: "Requerido",
  optional: "Opcional",
  invalidInput: "Entrada inválida",
  pleaseFillRequired: "Por favor completa todos los campos requeridos",
  // Notifications
  notification: "Notificación",
  info: "Información",
  warning: "Advertencia",
  // Trading
  openPosition: "Abrir Posición",
  closePosition: "Cerrar Posición",
  positionSize: "Tamaño de Posición",
  entryPrice: "Precio de Entrada",
  exitPrice: "Precio de Salida",
  profitLoss: "Pérdidas y Ganancias",
  unrealizedPnL: "P&L No Realizado",
  realizedPnL: "P&L Realizado",
  // Account
  accountSettings: "Configuración de Cuenta",
  securitySettings: "Configuración de Seguridad",
  preferences: "Preferencias",
  notifications: "Notificaciones",

  privacyPolicy: "Política de Privacidad",
  cookies: "Cookies",
  // Mobile
  menu: "Menú",
  settings: "Configuración",
  // Charts
  timeframe: "Marco de Tiempo",
  indicators: "Indicadores",
  drawings: "Dibujos",
  // Alerts
  alert: "Alerta",
  confirmAction: "¿Estás seguro de que quieres realizar esta acción?",
  actionCannotBeUndone: "Esta acción no se puede deshacer.",
  // Validation
  minimumLength: "La longitud mínima es {length} caracteres",
  maximumLength: "La longitud máxima es {length} caracteres",
  invalidEmail: "Por favor ingresa una dirección de email válida",
  passwordMismatch: "Las contraseñas no coinciden",
  // Success Messages
  profileUpdated: "Perfil actualizado exitosamente",
  passwordChanged: "Contraseña cambiada exitosamente",
  verificationSubmitted: "Verificación enviada exitosamente",
  withdrawalRequested: "Retiro solicitado exitosamente",
  depositSuccessful: "Depósito exitoso",
  // Error Messages
  profileUpdateFailed: "Error al actualizar perfil",
  passwordChangeFailed: "Error al cambiar contraseña",
  verificationFailed: "Error en verificación",
  withdrawalFailed: "Error en retiro",
  depositFailed: "Error en depósito",
  insufficientBalance: "Saldo insuficiente",
  invalidAmount: "Monto inválido",
  // Trading Messages
  orderPlaced: "Orden colocada exitosamente",
  orderCancelled: "Orden cancelada exitosamente",
  orderFailed: "Orden falló",
  tradeClosed: "Operación cerrada exitosamente",
  tradeFailed: "Operación falló",
  // Network
  serverError: "Ocurrió un error del servidor",
  timeoutError: "Tiempo de espera agotado",
  // Loading States
  loadingData: "Cargando datos...",
  processingRequest: "Procesando solicitud...",
  uploadingFile: "Subiendo archivo...",
  // Empty States
  noResults: "No se encontraron resultados",
  noData: "No hay datos disponibles",
  emptyState: "Nada que ver aquí",
  // Pagination
  previous: "Anterior",
  next: "Siguiente",
  page: "Página",
  of: "de",
  showing: "Mostrando",
  to: "a",
  ofTotal: "de {total}",
  // Date/Time
  today: "Hoy",
  yesterday: "Ayer",
  thisWeek: "Esta Semana",
  forgotPasswordTitle: "¿Has olvidado tu contraseña?",
  forgotPasswordSubtitle: "Introduce tu correo electrónico y te enviaremos un enlace para restablecer la contraseña",
  email: "Correo electrónico",
  enterEmail: "Introduce tu correo electrónico",
  sendResetLink: "Enviar enlace de restablecimiento",
  sending: "Enviando...",
  resetEmailSent: "Por favor, comprueba tu bandeja de entrada para un enlace de restablecimiento",
  returnToLogin: "Volver al inicio de sesión",
  createAccountTitle:"Cree su cuenta",
  createAccountSubtitle:"Comience a operar en AragonTrade en sólo unos minutos",
  resetFailed: "No se ha podido enviar el enlace de restablecimiento",
  enterValidEmail: "Introduzca una dirección de correo electrónico válida",
  thisMonth: "Este mes",
  lastMonth: "Último mes",
  welcomeBack: "Bienvenido de nuevo",
  marketMoversTitle:"Movimientos del mercado",
  dashboardSubtitle:"Siga su rendimiento, controle las posiciones abiertas y manténgase sincronizado con el mercado en un solo lugar",
  // Verification
  verificationStatus: "Estado de Verificación",
  verificationPending: "Verificación Pendiente",
  verificationApproved: "Verificación Aprobada",
  verificationRejected: "Verificación Rechazada",
  // KYC
  kyc: "KYC",
  addressVerification: "Verificación de Dirección",
  documentVerification: "Verificación de Documentos",
  // Security
  twoFactorAuth: "Autenticación de Dos Factores",
  securityQuestions: "Preguntas de Seguridad",
  loginHistory: "Historial de Inicio de Sesión",
  deviceManagement: "Gestión de Dispositivos",
  // API
  apiKey: "Clave API",
  apiSecret: "Secreto API",
  apiPermissions: "Permisos API",
  // Reports
  reports: "Reportes",
  tradingReport: "Reporte de Operaciones",
  financialReport: "Reporte Financiero",
  taxReport: "Reporte de Impuestos",
  // Settings
  languageSettings: "Configuración de Idioma",
  themeSettings: "Configuración de Tema",
  notificationSettings: "Configuración de Notificaciones",
  privacySettings: "Configuración de Privacidad",
  // Help
  helpCenter: "Centro de Ayuda",
  knowledgeBase: "Base de Conocimientos",
  tutorials: "Tutoriales",
  videoGuides: "Guías en Video",
  // Social
  community: "Comunidad",
  forum: "Foro",
  discord: "Discord",
  telegram: "Telegram",
  // Legal
  terms: "Términos",
  disclaimer: "Descargo de Responsabilidad",
  // Contact
  phone: "Teléfono",
  liveChat: "Chat en Vivo",
  supportTicket: "Ticket de Soporte",
  // Auth
  signInToAccount: "Inicia sesión en tu cuenta AragonTrade",
  password: "Password",
  enterPassword: "Ingresa tu contraseña",
  signingIn: "Iniciando sesión...",
  signIn: "Iniciar Sesión",
  dontHaveAccount: "¿No tienes una cuenta?",
  signUp: "Regístrate",
  createAccount: "Crear Cuenta",
  joinAragonTrade: "Únete a AragonTrade y comienza a operar",
  fullName: "Nombre Completo",
  enterFullName: "Ingresa tu nombre completo",
  confirmPassword: "Confirmar Contraseña",
  createPassword: "Crea una contraseña",
  confirmYourPassword: "Confirma tu contraseña",
  registering: "Registrando...",
  register: "Registrarse",
  alreadyHaveAccount: "¿Ya tienes una cuenta?",
  loginFailed: "Error al iniciar sesión",
  registrationFailed: "Error en el registro",
  networkErrorTryAgain: "Error de red. Por favor intenta de nuevo.",
  passwordsDoNotMatch: "Las contraseñas no coinciden",
  // Welcome Page
  nextGenTradingPlatform: "🚀 Plataforma de Trading de Nueva Generación",
  tradeSmarter: "Opera Más Inteligentemente,",
  notHarder: "No Más Difícil",
  joinThousandsDescription:
      "Únete a miles de operadores que usan nuestra plataforma avanzada para maximizar ganancias con insights impulsados por IA, análisis en tiempo real y herramientas de nivel profesional.",
  startTradingNow: "Comenzar a Operar Ahora",
  watchDemo: "Ver Demo",
  activeTraders: "Operadores Activos",
  successRate: "Tasa de Éxito",
  countries: "Países",
  liveTradingStats: "Estadísticas de Trading en Vivo",
  realTimeMarketData: "Datos de mercado en tiempo real",
  joinLiveTrading: "Unirse al Trading en Vivo",
  securePlatform: "Plataforma Segura",
  securePlatformDesc:
      "Seguridad de nivel bancario con autenticación de múltiples factores",
  marketAnalysis: "Análisis de Mercado",
  marketAnalysisDesc: "Insights impulsados por IA y predicciones de mercado",
  expertSupport: "Soporte Experto",
  expertSupportDesc: "Soporte al cliente 24/7 de profesionales del trading",
  premiumFeatures: "Características Premium",
  premiumFeaturesDesc: "Acceso a estrategias de trading exclusivas y señales",
  termsOfConditions: "Términos y Condiciones",
  // Trading Panel
  longPosition: "Posición Larga",
  shortPosition: "Posición Corta",
  estMargin: "Margen est.",
  enterTpPrice: "Precio de take profit",
  enterSlPrice: "Precio de stop loss",
  card: "Tarjeta",
  bank: "Banco",
  cryptoAddress: "Dirección",
  copyAddress: "Copiar Dirección",
  processingBankInfo: "Procesando la información del banco...",
  pendingConfirmation: "Por favor espera, confirmación pendiente...",
  loginToBank: "Iniciar sesión en {bankName}",
  authorize: "Autorizar",
  cardNumber: "Número de Tarjeta",
  expiry: "MM/AA",
  cvv: "CVV",
  requiredField: "Este campo es obligatorio",
  processing: "Procesando",
  done: "Hecho",
  processingInfo: "Tu depósito con tarjeta se está procesando.",
  bankProcessingInfo:
      "La información está siendo procesada, espera la confirmación",
};

const messagesByLang: Record<string, Messages> = { en, es }

type I18nContextValue = {
  lang: "en" | "es"
  setLang: (lang: "en" | "es") => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = "aragon-trade-language"

// helper para вложенных ключей "wallet.withdraw.title"
function getNestedKey(obj: any, key: string): string | undefined {
  const parts = key.split(".")

  let current: any = obj
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }

  return typeof current === "string" ? current : undefined
}

// Функция для начального языка (читаем из localStorage, если есть)
function getInitialLang(): "en" | "es" {
  if (typeof window === "undefined") {
    return "es"
  }
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved === "en" || saved === "es") return saved
  } catch {
    // localStorage может быть недоступен
  }
  return "es"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [langState, setLangState] = useState<"en" | "es">(getInitialLang)

  // При смене языка — сохраняем в localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, langState)
    } catch {
      // игнорируем ошибки
    }
  }, [langState])

  const messages = messagesByLang[langState] || messagesByLang["es"]

  // наша обёртка над setLangState — совпадает с типом в контексте
  const setLang = (newLang: "en" | "es") => {
    setLangState(newLang)
  }

  const t = (key: string): string => {
    // 1) nested: "wallet.withdraw.title"
    const nested = getNestedKey(messages, key)
    if (nested !== undefined) return nested

    // 2) плоский ключ: "walletWithdrawModalTitle"
    const flat = (messages as any)[key]
    if (typeof flat === "string") return flat

    // 3) fallback
    return key
  }

  return (
      <I18nContext.Provider value={{ lang: langState, setLang, t }}>
        {children}
      </I18nContext.Provider>
  )
}

export function useI18n(namespace?: string) {
  const ctx = useContext(I18nContext)

  // helper, который "оборачивает" t, добавляя namespace при наличии
  const wrapWithNamespace = (baseT: (key: string) => string) => {
    if (!namespace) return baseT
    return (key: string) => baseT(`${namespace}.${key}`)
  }

  if (!ctx) {
    const fallback = messagesByLang["es"]

    const baseT = (key: string): string => {
      const nested = getNestedKey(fallback, key)
      if (nested !== undefined) return nested
      const flat = (fallback as any)[key]
      if (typeof flat === "string") return flat
      return key
    }

    return {
      lang: "es" as const,
      setLang: (_lang: "en" | "es") => {},
      t: wrapWithNamespace(baseT)
    }
  }

  return {
    ...ctx,
    t: wrapWithNamespace(ctx.t)
  }
}
