export const dynamic = 'force-dynamic'

const SYMBOLS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','SUIUSDT','XRPUSDT',
  'DOGEUSDT','ADAUSDT','AVAXUSDT','LINKUSDT','BNBUSDT',
  'ATOMUSDT','LTCUSDT','TRXUSDT','APTUSDT','ARBUSDT',
  'OPUSDT','NEARUSDT','INJUSDT','FILUSDT','ETCUSDT',
  'TONUSDT','SEIUSDT','WIFUSDT','PEPEUSDT','SHIBUSDT',
  'DOTUSDT','UNIUSDT','AAVEUSDT','POLUSDT','GALAUSDT',
  'RUNEUSDT','TIAUSDT','JUPUSDT','ORDIUSDT','FETUSDT',
  'WLDUSDT','IMXUSDT','ICPUSDT','LDOUSDT','ENAUSDT',
  'HBARUSDT','ALGOUSDT','SANDUSDT','MANAUSDT','AXSUSDT',
  'EGLDUSDT','KASUSDT','ARUSDT','FLOWUSDT','XLMUSDT',
  'VETUSDT','THETAUSDT','KAVAUSDT','CHZUSDT','ZRXUSDT'
]

type BinanceTicker = {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  quoteVolume: string
  highPrice: string
  lowPrice: string
}

function toPair(symbol: string) {
  return symbol.replace('USDT', '/USDT')
}

function toCoin(symbol: string) {
  return symbol.replace('USDT', '')
}

function getSignal(change: number) {
  if (change >= 0) return 'LONG'
  return 'SHORT'
}

function getScore(change: number, quoteVolume: number) {
  const moveScore = Math.min(Math.abs(change) * 4, 35)
  const volumeScore = quoteVolume > 100_000_000 ? 15 : quoteVolume > 30_000_000 ? 8 : 3
  return Math.round(60 + moveScore + volumeScore)
}

export async function GET() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      cache: 'no-store'
    })

    if (!response.ok) {
      return Response.json({ error: 'Δεν μπόρεσα να πάρω market data.' }, { status: 500 })
    }

    const data: BinanceTicker[] = await response.json()
    const map = new Map(data.map((item) => [item.symbol, item]))

    const market = SYMBOLS
      .map((symbol) => map.get(symbol))
      .filter(Boolean)
      .map((item) => {
        const ticker = item as BinanceTicker
        const change = Number(ticker.priceChangePercent)
        const price = Number(ticker.lastPrice)
        const quoteVolume = Number(ticker.quoteVolume)

        return {
          coin: toCoin(ticker.symbol),
          pair: toPair(ticker.symbol),
          price,
          change24h: change,
          quoteVolume,
          high24h: Number(ticker.highPrice),
          low24h: Number(ticker.lowPrice)
        }
      })
      .slice(0, 50)

    const signals = market.map((item, index) => ({
      coin: item.coin,
      pair: item.pair,
      signal: getSignal(item.change24h),
      timeframe: '24h',
      score: getScore(item.change24h, item.quoteVolume),
      price: item.price,
      change24h: item.change24h,
      rsi: 'Σύντομα',
      macd: 'Σύντομα',
      adx: 'Σύντομα',
      atr: 'Σύντομα',
      status: 'Pending',
      rank: index + 1
    }))

    return Response.json({
      ok: true,
      source: 'Binance public market data',
      updatedAt: new Date().toISOString(),
      count: signals.length,
      signals,
      market
    })
  } catch (error) {
    return Response.json({ error: 'Σφάλμα κατά την αναζήτηση κρυπτονομισμάτων.' }, { status: 500 })
  }
}
