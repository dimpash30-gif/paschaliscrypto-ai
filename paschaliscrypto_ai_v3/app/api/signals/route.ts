export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SYMBOLS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','SUIUSDT','XRPUSDT',
  'DOGEUSDT','ADAUSDT','AVAXUSDT','LINKUSDT','BNBUSDT',
  'ATOMUSDT','LTCUSDT','TRXUSDT','APTUSDT','ARBUSDT',
  'OPUSDT','NEARUSDT','INJUSDT','FILUSDT','ETCUSDT',
  'TONUSDT','SEIUSDT','WIFUSDT','PEPEUSDT','SHIB1000USDT',
  'DOTUSDT','UNIUSDT','AAVEUSDT','POLUSDT','GALAUSDT',
  'RUNEUSDT','TIAUSDT','JUPUSDT','ORDIUSDT','FETUSDT',
  'WLDUSDT','IMXUSDT','ICPUSDT','LDOUSDT','ENAUSDT',
  'HBARUSDT','ALGOUSDT','SANDUSDT','MANAUSDT','AXSUSDT',
  'EGLDUSDT','KASUSDT','ARUSDT','FLOWUSDT','XLMUSDT',
  'VETUSDT','THETAUSDT','KAVAUSDT','CHZUSDT','ZRXUSDT'
]

type BybitTicker = {
  symbol: string
  lastPrice: string
  markPrice?: string
  indexPrice?: string
  prevPrice24h?: string
  price24hPcnt?: string
  highPrice24h?: string
  lowPrice24h?: string
  turnover24h?: string
  volume24h?: string
}

type BybitResponse = {
  retCode: number
  retMsg: string
  result?: {
    category: string
    list: BybitTicker[]
  }
}

function toPair(symbol: string) {
  if (symbol === 'SHIB1000USDT') return '1000SHIB/USDT'
  return symbol.replace('USDT', '/USDT')
}

function toCoin(symbol: string) {
  if (symbol === 'SHIB1000USDT') return '1000SHIB'
  return symbol.replace('USDT', '')
}

function getSignal(changePercent: number) {
  if (changePercent > 0.35) return 'LONG'
  if (changePercent < -0.35) return 'SHORT'
  return 'NEUTRAL'
}

function getScore(changePercent: number, turnover24h: number) {
  const moveScore = Math.min(Math.abs(changePercent) * 4, 35)
  const volumeScore = turnover24h > 500_000_000 ? 20 : turnover24h > 150_000_000 ? 14 : turnover24h > 50_000_000 ? 8 : 3
  return Math.round(55 + moveScore + volumeScore)
}

export async function GET() {
  try {
    const response = await fetch('https://api.bybit.com/v5/market/tickers?category=linear', {
      cache: 'no-store',
      headers: { 'accept': 'application/json' }
    })

    if (!response.ok) {
      return Response.json({ error: 'Δεν μπόρεσα να πάρω Bybit market data.' }, { status: 500 })
    }

    const data: BybitResponse = await response.json()

    if (data.retCode !== 0 || !data.result?.list) {
      return Response.json({ error: data.retMsg || 'Η Bybit δεν επέστρεψε σωστά δεδομένα.' }, { status: 500 })
    }

    const map = new Map(data.result.list.map((item) => [item.symbol, item]))

    const market = SYMBOLS
      .map((symbol) => map.get(symbol))
      .filter(Boolean)
      .map((item) => {
        const ticker = item as BybitTicker
        const price = Number(ticker.lastPrice || ticker.markPrice || 0)
        const change24h = Number(ticker.price24hPcnt || 0) * 100
        const turnover24h = Number(ticker.turnover24h || 0)

        return {
          coin: toCoin(ticker.symbol),
          pair: toPair(ticker.symbol),
          symbol: ticker.symbol,
          price,
          change24h,
          quoteVolume: turnover24h,
          high24h: Number(ticker.highPrice24h || 0),
          low24h: Number(ticker.lowPrice24h || 0)
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
      source: 'Bybit public market data - USDT Perpetual / Linear',
      updatedAt: new Date().toISOString(),
      count: signals.length,
      signals,
      market
    })
  } catch (error) {
    return Response.json({ error: 'Σφάλμα κατά την αναζήτηση κρυπτονομισμάτων στη Bybit.' }, { status: 500 })
  }
}
