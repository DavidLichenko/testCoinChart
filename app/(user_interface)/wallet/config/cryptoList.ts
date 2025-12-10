export type CryptoMeta = {
    symbol: string;
    name: string;
};

export const CRYPTO_LIST: CryptoMeta[] = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "BNB", name: "Binance Coin" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "XRP", name: "XRP" },
    { symbol: "ADA", name: "Cardano" },
    { symbol: "DOGE", name: "Dogecoin" },
    { symbol: "TON", name: "Toncoin" },
    { symbol: "TRX", name: "TRON" },
    { symbol: "AVAX", name: "Avalanche" },
    { symbol: "MATIC", name: "Polygon" },
    { symbol: "DOT", name: "Polkadot" },
    { symbol: "LTC", name: "Litecoin" },
    { symbol: "BCH", name: "Bitcoin Cash" },
    { symbol: "LINK", name: "Chainlink" },
    { symbol: "UNI", name: "Uniswap" },
    { symbol: "OP", name: "Optimism" },
    { symbol: "ARB", name: "Arbitrum" },
    { symbol: "SUI", name: "Sui" },
    { symbol: "NEAR", name: "NEAR Protocol" },
    { symbol: "APT", name: "Aptos" },
    { symbol: "ATOM", name: "Cosmos" },
    { symbol: "STX", name: "Stacks" },
    { symbol: "SEI", name: "Sei" },
    { symbol: "IMX", name: "Immutable X" },
    { symbol: "DYDX", name: "dYdX" },
    { symbol: "AAVE", name: "Aave" },
    { symbol: "MKR", name: "Maker" },
    { symbol: "PEPE", name: "Pepe" },
    { symbol: "FTM", name: "Fantom" },
    { symbol: "RUNE", name: "THORChain" },
    { symbol: "INJ", name: "Injective" },
    { symbol: "GMX", name: "GMX" },
];

// иконки лежат в public/icons/crypto_icons/SYMBOL.png
// например: /icons/crypto_icons/BTC.png
