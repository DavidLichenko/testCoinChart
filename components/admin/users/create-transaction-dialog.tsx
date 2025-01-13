'use client'

import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"

interface CreateTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (transaction: any) => void
  userId: string
}

const assetTypes = ['IEX', 'Forex', 'Crypto']

const tickerLists = {
  Crypto: [
    'IDUSD', 'OPUSD', 'ADAUSD', 'APEUSD', 'APTUSD', 'ARBUSD', 'AXSUSD', 'BCHUSD', 'BNBUSD', 'BTCUSD',
    'BTTUSD', 'CFXUSD', 'CHZUSD', 'DOTUSD', 'DYMUSD', 'EOSUSD', 'ERDUSD', 'ETCUSD', 'ETHUSD', 'FILUSD',
    'FTMUSD', 'FTTUSD', 'GRTUSD', 'HFTUSD', 'ICPUSD', 'INJUSD', 'IOTUSD', 'JTOUSD', 'LDOUSD', 'LTCUSD',
    'MKRUSD', 'NEOUSD', 'NOTUSD', 'ONTUSD', 'QNTUSD', 'RIFUSD', 'SEIUSD', 'SNXUSD', 'SOLUSD', 'STXUSD',
    'SUIUSD', 'SXPUSD', 'TIAUSD', 'TONUSD', 'TRXUSD', 'TWTUSD', 'UNIUSD', 'VETUSD', 'WIFUSD', 'WLDUSD',
    'XECUSD', 'XLMUSD', 'XMRUSD', 'XRPUSD', 'XTZUSD', 'YFIUSD', 'ZECUSD', 'AAVEUSD', 'ALGOUSD', 'ATOMUSD',
    'AVAXUSD', 'BANDUSD', 'BLURUSD', 'BONKUSD', 'CAKEUSD', 'DASHUSD', 'DOGEUSD', 'EGLDUSD', 'FLOWUSD',
    'GALAUSD', 'HBARUSD', 'KAVAUSD', 'KLAYUSD', 'LINKUSD', 'LUNAUSD', 'LUNCUSD', 'MANAUSD', 'MEMEUSD',
    'NEARUSD', 'ORDIUSD', 'PAXGUSD', 'PEPEUSD', 'QTUMUSD', 'RUNEUSD', 'SANDUSD', 'SHIBUSD', 'FLOKIUSD',
    'MANTAUSD', 'MATICUSD', 'OCEANUSD', 'THETAUSD', 'WAVESUSD', 'PENDLEUSD'
  ],
  Forex: [
    'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD',
    'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURSGD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY',
    'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDCNY', 'USDHKD',
    'USDILS', 'USDINR', 'USDJPY', 'USDMXN', 'USDPLN', 'USDSGD', 'USDTRY', 'USDZAR'
  ],
  IEX: [
    'C', 'F', 'T', 'V', 'AA', 'AI', 'BA', 'BC', 'BE', 'BP', 'CM', 'DG', 'EL', 'META', 'FP', 'GE', 'GL', 'GM',
    'GS', 'HD', 'KO', 'LI', 'MA', 'MO', 'MS', 'MU', 'PG', 'PM', 'QS', 'RY', 'SU', 'TD', 'TM', 'VZ', 'ZM', 'AAL',
    'ACB', 'ADR', 'ADDYY', 'AEM', 'AIG', 'AIR', 'ALB', 'ALL', 'ALV', 'AMD', 'APD', 'ARM', 'AXP', 'AXS', 'AZN',
    'BAC', 'BAS', 'BLK', 'BMO', 'BMW', 'BNP', 'BNS', 'BTG', 'CAT', 'CCL', 'CGC', 'CHV', 'CNQ', 'CRM', 'CVE',
    'CVS', 'DAI', 'DAL', 'DBK', 'DBX', 'DIS', 'DPZ', 'EDR', 'ENB', 'ENI', 'FDX', 'GME', 'HOG', 'HPQ', 'IBM',
    'IMO', 'INO', 'IDEXF', 'JNJ', 'JPM', 'KGC', 'KMX', 'LAC', 'LEN', 'LIN', 'LLY', 'LMT', 'LYG', 'MCD', 'MDT',
    'MGA', 'MMM', 'MRK', 'MTS', 'NEM', 'NET', 'NIO', 'NKE', 'NOC', 'NOK', 'NTR', 'PBA', 'PEP', 'PFE', 'PLL',
    'PVH', 'RBC', 'RCL', 'RIO', 'RTX', 'SAP', 'SHC', 'SIE', 'SJM', 'SLI', 'SQM', 'STZ', 'SYM', 'TLS', 'TPG',
    'TRP', 'TRV', 'TSM', 'TSN', 'UNH', 'VFC', 'VGT', 'VOD', 'VOW', 'WBX', 'WDS', 'WFC', 'WMT', 'XOM', 'AAPL',
    'ABBV', 'ABNB', 'ACRV', 'ADBE', 'AFLT', 'ALRS', 'AMGN', 'AMZN', 'ASML', 'ASPI', 'ATAT', 'AVGO', 'BABA',
    'BAYN', 'BF-B', 'BIDU', 'BIIB', 'BKNG', 'BKSY', 'BLDP', 'BNTX', 'BYON', 'CHPT', 'COIN', 'CORN', 'COST',
    'CSCO', 'DELL', 'DWAC', 'EBAY', 'ERBB', 'ESLT', 'FSLY', 'GAZP', 'GBTC', 'GILD', 'GMKN', 'GNLX', 'GOLD',
    'HTOO', 'IBIT', 'IBKR', 'INTC', 'JMIA', 'JUVE', 'KSCP', 'KYTX', 'LAZR', 'LCID', 'LKOH', 'LULU', 'LYFT',
    'MANU', 'MBIO', 'MRNA', 'MRVL', 'MSFT', 'MSTR', 'NDAQ', 'NFLX', 'NKLA', 'NVAX', 'NVDA', 'NVTK', 'ORCL',
    'PINS', 'PLTR', 'PLUG', 'PYPL', 'QCOM', 'RACE', 'ROSN', 'SBER', 'SBUX', 'SCCO', 'SGML', 'SIRI', 'SITM',
    'SMCI', 'SNAL', 'SNAP', 'SONY', 'SOUN', 'SPCE', 'SPOT', 'SWKS', 'TECK', 'TEVA', 'TLRY', 'TRIP', 'TSLA',
    'UBER', 'ULTA', 'UVXY', 'VALE', 'VTBR', 'VXRT', 'WPRT', 'WYNN', 'YNDX', 'AETUF', 'BRK-A', 'FDXTF', 'GOOGL'
  ]
}

export function CreateTransactionDialog({
                                          open,
                                          onOpenChange,
                                          onSuccess,
                                          userId
                                        }: CreateTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'BUY',
    assetType: 'Crypto',
    ticker: '',
    volume: 0,
    leverage: 1,
    openInA: 0,
  })
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    // Reset ticker when assetType changes
    setFormData(prev => ({ ...prev, ticker: '' }))
  }, [formData.assetType])

  const tickerOptions: ComboboxOption[] = useMemo(() => {
    const list = tickerLists[formData.assetType as keyof typeof tickerLists] || []
    return list.map(ticker => ({
      value: ticker,
      label: ticker
    }))
  }, [formData.assetType])

  const handleSubmit = async () => {
    if (!formData.type || !formData.assetType || !formData.ticker || formData.volume <= 0 || formData.leverage <= 0 || formData.openInA <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create transaction')
      }

      const newTransaction = await response.json()
      onSuccess(newTransaction)
      onOpenChange(false)
      toast({
        title: "Success",
        description: "Transaction created successfully",
      })
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Asset Type</Label>
              <Select
                  value={formData.assetType}
                  onValueChange={(value) => handleSelectChange('assetType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 relative">
              <Label>Ticker</Label>
              <Combobox
                  options={tickerOptions}
                  value={formData.ticker}
                  onChange={(value) => handleSelectChange('ticker', value)}
                  placeholder="Select ticker"
              />
            </div>
            <div className="grid gap-2">
              <Label>Volume</Label>
              <Input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label>Leverage</Label>
              <Input
                  type="number"
                  name="leverage"
                  value={formData.leverage}
                  onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label>Open Price</Label>
              <Input
                  type="number"
                  name="openInA"
                  value={formData.openInA}
                  onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}

