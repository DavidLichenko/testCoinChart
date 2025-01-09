import { NextRequest, NextResponse } from 'next/server';

const TIINGO_API_KEY = "5c5398add0e123606bb40277f4cb66352b386185";

export async function GET(req: NextRequest) {
  try {
    // Define tickers for each type (Forex, Crypto, IEX)
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
      'IDUSD', 'OPUSD', 'ADAUSD', 'APEUSD', 'APTUSD',
      'ARBUSD', 'AXSUSD', 'BCHUSD', 'BNBUSD', 'BTCUSD',
      'BTTUSD', 'CFXUSD', 'CHZUSD', 'DOTUSD', 'DYMUSD',
      'EOSUSD', 'ERDUSD', 'ETCUSD', 'ETHUSD', 'FILUSD',
      'FTMUSD', 'FTTUSD', 'GRTUSD', 'HFTUSD', 'ICPUSD',
      'INJUSD', 'IOTUSD', 'JTOUSD', 'LDOUSD', 'LTCUSD',
      'MKRUSD', 'NEOUSD', 'NOTUSD', 'ONTUSD', 'QNTUSD',
      'RIFUSD', 'SEIUSD', 'SNXUSD', 'SOLUSD', 'STXUSD',
      'SUIUSD', 'SXPUSD', 'TIAUSD', 'TONUSD', 'TRXUSD',
      'TWTUSD', 'UNIUSD', 'VETUSD', 'WIFUSD', 'WLDUSD',
      'XECUSD', 'XLMUSD', 'XMRUSD', 'XRPUSD', 'XTZUSD',
      'YFIUSD', 'ZECUSD', 'AAVEUSD', 'ALGOUSD', 'ATOMUSD',
      'AVAXUSD', 'BANDUSD', 'BLURUSD', 'BONKUSD', 'CAKEUSD',
      'DASHUSD', 'DOGEUSD', 'EGLDUSD', 'FLOWUSD', 'GALAUSD',
      'HBARUSD', 'KAVAUSD', 'KLAYUSD', 'LINKUSD', 'LUNAUSD',
      'LUNCUSD', 'MANAUSD', 'MEMEUSD', 'NEARUSD', 'ORDIUSD',
      'PAXGUSD', 'PEPEUSD', 'QTUMUSD', 'RUNEUSD', 'SANDUSD',
      'SHIBUSD', 'FLOKIUSD', 'MANTAUSD', 'MATICUSD', 'OCEANUSD',
      'THETAUSD', 'WAVESUSD', 'PENDLEUSD'
    ]

    // Prepare the ticker strings for each API call
    const forexQuery = forexTickers.join(",").toLowerCase();
    const cryptoQuery = cryptoTickers.join(",").toLowerCase();

    // Fetch data from Tiingo API (Forex, Crypto, IEX)
    const forexResponse = await fetch(`https://api.tiingo.com/tiingo/fx/top?tickers=${forexQuery}&token=${TIINGO_API_KEY}`);
    const cryptoResponse = await fetch(`https://api.tiingo.com/tiingo/crypto/top?tickers=${cryptoQuery}&token=${TIINGO_API_KEY}`);


    // Check if all responses are successful (status code 200)
    if (!forexResponse.ok) throw new Error(`Forex API error: ${forexResponse.statusText}`);
    if (!cryptoResponse.ok) throw new Error(`Crypto API error: ${cryptoResponse.statusText}`);


    // Wait for all responses to complete
    const [forexData, cryptoData] = await Promise.all([
      forexResponse.json(),
      cryptoResponse.json(),

    ]);
    // Format the data for each category
    const formatData = (data: any[], type: string) => {
      return data.map((item) => {
        if (type === 'Crypto') {
          // For Crypto, access topOfBookData[0] since it's nested
          const topOfBook = item.topOfBookData[0];

          return {
            name: item.ticker,
            price: topOfBook.lastPrice ?? (topOfBook.bidPrice + topOfBook.askPrice) / 2, // Use lastPrice or avg of bid/ask
            prevPrice: topOfBook.bidPrice ?? null, // Assuming bidPrice as a fallback for previous price
            icon: `/icons/${item.ticker.toLowerCase()}.png`, // Adjust icon path based on ticker
            type,
          };
        } else {
          // For Forex (and other types like IEX), directly access the data
          return {
            name: item.ticker,
            price: item.midPrice ?? item.price, // Use midPrice or price
            prevPrice: item.bidPrice ?? item.previousClosePrice, // Assuming bidPrice or previousClosePrice
            icon: `/icons/${item.ticker.toLowerCase()}.png`, // Adjust icon path based on ticker
            type,
          };
        }
      });
    };

    // Combine all the data
    const formattedData = [
      ...formatData(forexData, 'Forex'),
      ...formatData(cryptoData, 'Crypto'),
    ];

    console.log(formattedData)
    // Send the formatted data to the client
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
