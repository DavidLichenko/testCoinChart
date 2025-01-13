import { NextRequest, NextResponse } from 'next/server';

const TIINGO_API_KEY = "5c5398add0e123606bb40277f4cb66352b386185";

// Helper function to format data
function formatData(data: any[], type: string, flag1: string, flag2: string) {
  return data.map((item: any) => {
    let price = 0;
    let percentage = 0;

    // For Crypto, use the `topOfBookData` if available
    if (type === 'Crypto' && item.topOfBookData && item.topOfBookData.length > 0) {
      const topOfBook = item.topOfBookData[0];
      price = topOfBook.bidPrice || topOfBook.lastPrice || 0; // Use bidPrice or fallback to lastPrice
    } else if (type === 'Forex') {
      // For Forex, use midPrice or bidPrice as the price
      price = item.midPrice || item.bidPrice || 0;
    } else {
      // For IEX, use the 'last' price
      price = item.last || 0;
      percentage = (item.prevClose - item.last) / item.last * 100
    }
    console.log(item)
    return {
      symbol: item.ticker.toUpperCase(),
      price,  // Price field instead of bid/ask
      change: percentage || 0,  // You can also calculate change if needed
      volume: item.volumeNotional || item.volume || 0,
      type: type as string,
      flag1: flag1,
      flag2: flag2,
    };
  });
}

const forexTickers = [
  'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD',
  'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD',
  'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD',
  'EURSGD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF',
  'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF',
  'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF',
  'USDHKD', 'USDJPY', 'USDMXN',
  'USDPLN', 'USDSGD', 'USDTRY', 'USDZAR'
]
const cryptoTickers = [
  'IDUSDT', 'OPUSDT', 'ADAUSDT', 'APEUSDT', 'APTUSDT',
  'ARBUSDT', 'AXSUSDT', 'BCHUSDT', 'BNBUSDT', 'BTCUSDT',
  'BTTUSDT', 'CFXUSDT', 'CHZUSDT', 'DOTUSDT', 'DYMUSDT',
  'EOSUSDT', 'ERDUSDT', 'ETCUSDT', 'ETHUSDT', 'FILUSDT',
  'FTMUSDT', 'FTTUSDT', 'GRTUSDT', 'HFTUSDT', 'ICPUSDT',
  'INJUSDT', 'IOTUSDT', 'JTOUSDT', 'LDOUSDT', 'LTCUSDT',
  'MKRUSDT', 'NEOUSDT', 'NOTUSDT', 'ONTUSDT', 'QNTUSDT',
  'RIFUSDT', 'SEIUSDT', 'SNXUSDT', 'SOLUSDT', 'STXUSDT',
  'SUIUSDT', 'SXPUSDT', 'TIAUSDT', 'TONUSDT', 'TRXUSDT',
  'TWTUSDT', 'UNIUSDT', 'VETUSDT', 'WIFUSDT', 'WLDUSDT',
  'XECUSDT', 'XLMUSDT', 'XMRUSDT', 'XRPUSDT', 'XTZUSDT',
  'YFIUSDT', 'ZECUSDT', 'AAVEUSDT', 'ALGOUSDT', 'ATOMUSDT',
  'AVAXUSDT', 'BANDUSDT', 'BLURUSDT', 'BONKUSDT', 'CAKEUSDT',
  'DASHUSDT', 'DOGEUSDT', 'EGLDUSDT', 'FLOWUSDT', 'GALAUSDT',
  'HBARUSDT', 'KAVAUSDT', 'KLAYUSDT', 'LINKUSDT', 'LUNAUSDT',
  'LUNCUSDT', 'MANAUSDT', 'MEMEUSDT', 'NEARUSDT', 'ORDIUSDT',
  'PAXGUSDT', 'PEPEUSDT', 'QTUMUSDT', 'RUNEUSDT', 'SANDUSDT',
  'SHIBUSDT', 'FLOKIUSDT', 'MANTAUSDT', 'MATICUSDT', 'OCEANUSDT',
  'THETAUSDT', 'WAVESUSDT', 'PENDLEUSDT'
]

// Prepare the ticker strings for each API call
const forexQuery = forexTickers.join(",").toLowerCase();
const cryptoQuery = cryptoTickers.join(",").toLowerCase();

// Fetch Forex Data
async function fetchForexData() {
  const response = await fetch(
      `https://api.tiingo.com/tiingo/fx/top?tickers=${forexQuery}&token=${TIINGO_API_KEY}`,
  );
  const data = await response.json();

  return formatData(data, 'Forex', 'eur', 'usd'); // Example flags for Forex
}

// Fetch Crypto Data
async function fetchCryptoData() {
  const response = await fetch(
      `https://api.tiingo.com/tiingo/crypto/top?tickers=${cryptoQuery}&token=${TIINGO_API_KEY}`,
  );
  const data = await response.json();
  return formatData(data, 'Crypto', 'btc', 'usd'); // Example flags for Crypto
}

// Fetch IEX Data
async function fetchIEXData() {
  const response = await fetch(
      `https://api.tiingo.com/iex?tickers=aapl,msft,googl,amzn,meta&token=${TIINGO_API_KEY}`,
  );
  const data = await response.json();

  return formatData(data, 'IEX', 'us', 'us'); // Example flags for IEX
}

export async function GET(req: NextRequest) {
  try {
    // Fetch data concurrently
    const [forexData, cryptoData, iexData] = await Promise.all([
      fetchForexData(),
      fetchCryptoData(),
      fetchIEXData(),
    ]);

    // Combine all the data
    const formattedData = [
      ...forexData,
      ...cryptoData,
      ...iexData,
    ];

    // Send the formatted data to the client
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
