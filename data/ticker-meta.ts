import rawSymbols from "@/data/ticker-symbols.json"

export type TickerCategory = "forex" | "stocks" | "indices" | "commodities" | "crypto" | "other"

export interface TickerMeta {
  symbol: string
  showName: string
  fullName: string
  category: TickerCategory
  exchange?: string
  baseCurrency?: string
  quoteCurrency?: string
}

const currencyCodes = new Set([
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "SGD",
  "HKD",
  "NOK",
  "SEK",
  "DKK",
  "TRY",
  "ZAR",
  "PLN",
  "HUF",
  "CZK",
  "MXN",
  "RUB",
  "CNH",
  "CNY",
  "BRL",
  "ILS",
  "CLP",
  "COP",
  "IDR",
  "KRW",
  "MYR",
  "PHP",
  "SAR",
  "AED",
  "INR",
  "THB",
  "RON",
  "ISK",
  "ARS",
])

const commodityCodes = new Set(["XAU", "XAG", "XPT", "XPD", "XCU", "XBR", "XTI", "XNG", "XNI", "XAL"])
const commodityKeywords = [
  "OIL",
  "GOLD",
  "SILVER",
  "COPPER",
  "PLAT",
  "PALL",
  "BRENT",
  "WTI",
  "NGAS",
  "GAS",
  "COCOA",
  "COFFEE",
  "CORN",
  "COTTON",
  "SUGAR",
  "WHEAT",
  "SOY",
  "SBEAN",
  "OJ",
]

const cryptoBases = new Set([
  "BTC",
  "ETH",
  "XRP",
  "ADA",
  "SOL",
  "BNB",
  "DOGE",
  "LTC",
  "DOT",
  "LINK",
  "MATIC",
  "AVAX",
  "ETC",
  "BCH",
  "XLM",
  "TRX",
  "NEO",
  "ATOM",
  "ICP",
  "HBAR",
  "APT",
  "ARB",
  "OP",
  "SUI",
  "FIL",
  "XTZ",
  "ALGO",
  "AXS",
  "GRT",
])

const cryptoSymbols = new Set(["BTCUSD", "ETHUSD", "ADAUSD", "SOLUSD", "XRPUSD", "BNBUSD", "DOGUSD", "DOTUSD", "LTCUSD", "MATICUSD"])

const exchangeSuffixMap: Record<
    string,
    {
      exchange: string
      tradingView: string
    }
> = {
  NAS: { exchange: "NASDAQ", tradingView: "NASDAQ" },
  NYSE: { exchange: "NYSE", tradingView: "NYSE" },
  LSE: { exchange: "LSE", tradingView: "LSE" },
  ETR: { exchange: "XETR", tradingView: "XETR" },
  AMS: { exchange: "EURONEXT", tradingView: "EURONEXT" },
  PAR: { exchange: "EURONEXT PAR", tradingView: "EURONEXT" },
  MAD: { exchange: "BME", tradingView: "BME" },
}

const indexNameOverrides: Record<string, string> = {
  US500: "S&P 500",
  US30: "Dow Jones",
  US2000: "Russell 2000",
  US100: "NASDAQ 100",
  USOIL: "WTI Crude",
  UK100: "FTSE 100",
  DE40: "DAX 40",
  FR40: "CAC 40",
  F40: "CAC 40",
  ES35: "IBEX 35",
  IT40: "FTSE MIB",
  JP225: "Nikkei 225",
  HK50: "Hang Seng",
  CHINA50: "China A50",
  NETH25: "AEX 25",
  AUS200: "ASX 200",
  SA40: "South Africa 40",
  SE30: "OMX Stockholm 30",
  SWI20: "Swiss Market",
  TECDE30: "TecDAX",
  STOXX50: "Euro Stoxx 50",
  MIDDE50: "MidDE 50",
  MIDDE60: "MidDE 60",
  NOR25: "Norway 25",
  ITB10Y_Z5: "Italy 10Y Bond",
  UKGB_Z5: "UK Gilt",
  UST10Y_Z5: "US 10Y",
  UST30Y_Z5: "US 30Y",
  VIX_Z5: "VIX",
}

const forexFullNamePrefix = "FX"
const cryptoFullNamePrefix = "CRYPTO"
const commodityFullNamePrefix = "CMD"
const indexFullNamePrefix = "INDEX"

const knownQuotes = ["USDT", "USD", "EUR", "BTC"]

function isForexPair(symbol: string, base: string, quote: string) {
  return symbol.length === 6 && currencyCodes.has(base) && currencyCodes.has(quote)
}

function isCommoditySymbol(symbol: string, base: string, quote: string) {
  if (commodityCodes.has(base) || commodityCodes.has(quote)) return true
  return commodityKeywords.some((keyword) => symbol.includes(keyword))
}

function isCryptoPair(symbol: string) {
  if (cryptoSymbols.has(symbol)) return true
  return cryptoBases.has(symbol.replace(/(USD|USDT|EUR|BTC)$/, ""))
}

function extractCryptoParts(symbol: string) {
  for (const quote of knownQuotes) {
    if (symbol.endsWith(quote)) {
      const base = symbol.slice(0, symbol.length - quote.length)
      if (cryptoBases.has(base)) {
        return { base, quote }
      }
    }
  }
  return null
}

function formatPair(base?: string, quote?: string) {
  const pairRegex = /^[A-Z]{3}$/
  if (base && quote && pairRegex.test(base) && pairRegex.test(quote)) {
    return `${base}/${quote}`
  }
  return undefined
}

function buildMeta(symbol: string): TickerMeta {
  const upperSymbol = symbol.toUpperCase()
  if (symbol.includes(".")) {
    const [base, suffix] = symbol.split(".")
    const info = exchangeSuffixMap[suffix] || { exchange: suffix, tradingView: suffix }
    return {
      symbol,
      showName: base,
      fullName: `${info.tradingView}:${base}`,
      category: "stocks",
      exchange: info.exchange,
    }
  }

  const base = upperSymbol.slice(0, 3)
  const quote = upperSymbol.slice(-3)

  if (isCommoditySymbol(upperSymbol, base, quote)) {
    return {
      symbol,
      showName: formatPair(base, quote) || upperSymbol.replaceAll("_", " "),
      fullName: `${commodityFullNamePrefix}:${upperSymbol}`,
      category: "commodities",
      baseCurrency: base,
      quoteCurrency: quote,
    }
  }

  if (isForexPair(upperSymbol, base, quote)) {
    return {
      symbol,
      showName: `${base}/${quote}`,
      fullName: `${forexFullNamePrefix}:${upperSymbol}`,
      category: "forex",
      baseCurrency: base,
      quoteCurrency: quote,
    }
  }

  if (isCryptoPair(upperSymbol)) {
    const parts = extractCryptoParts(upperSymbol)
    const baseCurrency = parts?.base || base
    const quoteCurrency = parts?.quote || quote
    return {
      symbol,
      showName: formatPair(baseCurrency, quoteCurrency) || upperSymbol,
      fullName: `${cryptoFullNamePrefix}:${upperSymbol}`,
      category: "crypto",
      baseCurrency,
      quoteCurrency,
    }
  }

  if (/\d/.test(symbol)) {
    return {
      symbol,
      showName: indexNameOverrides[upperSymbol] || upperSymbol.replaceAll("_", " "),
      fullName: `${indexFullNamePrefix}:${upperSymbol}`,
      category: "indices",
    }
  }

  return {
    symbol,
    showName: upperSymbol.replaceAll("_", " "),
    fullName: upperSymbol,
    category: "other",
  }
}

export const tickerMeta: TickerMeta[] = (rawSymbols as string[]).map(buildMeta)

export const tickerMetaMap = new Map(tickerMeta.map((meta) => [meta.symbol, meta]))

export const tickerSymbolSet = new Set(tickerMeta.map((meta) => meta.symbol))

export const tickerOrderMap = new Map(tickerMeta.map((meta, index) => [meta.symbol, index]))

export const tickerCategoryLabels: Record<TickerCategory, string> = {
  forex: "Forex",
  stocks: "Stocks",
  indices: "Indices",
  commodities: "Commodities",
  crypto: "Crypto",
  other: "Other",
}

export const orderedCategories: TickerCategory[] = ["forex", "indices", "commodities", "stocks", "crypto", "other"]

