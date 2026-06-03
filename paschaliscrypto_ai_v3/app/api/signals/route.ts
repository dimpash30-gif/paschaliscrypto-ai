import { NextResponse } from 'next/server'

const SYMBOLS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT',
  'ADAUSDT','AVAXUSDT','LINKUSDT','BNBUSDT','SUIUSDT',
  'APTUSDT','ARBUSDT','OPUSDT','NEARUSDT','INJUSDT',
  'LTCUSDT','TRXUSDT','DOTUSDT','UNIUSDT','AAVEUSDT',
  'SEIUSDT','WIFUSDT','PEPEUSDT','SHIBUSDT','TONUSDT',
  'ETCUSDT','FILUSDT','ATOMUSDT','ALGOUSDT','HBARUSDT',
  'SANDUSDT','MANAUSDT','AXSUSDT','GALAUSDT','RUNEUSDT',
  'TIAUSDT','JUPUSDT','ORDIUSDT','FETUSDT','WLDUSDT',
  'IMXUSDT','ICPUSDT','LDOUSDT','ENAUSDT','XLMUSDT',
  'VETUSDT','THETAUSDT','KAVAUSDT','CHZUSDT','ZRXUSDT'
]

export async function GET() {
  try {
    const url = 'https://api.bybit.com/v5/market/tickers?category=linear'
    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Bybit request failed', status: res.status },
        { status: 500 }
      )
    }

    const data = await res.json()
    const list = data?.result?.list || []

    const filtered = list
      .filter((item: any) => SYMBOLS.includes(item.symbol))
      .slice(0, 50)
      .map((item: any, index: number) => {
        const change24h = Number(item.price24hPcnt || 0) * 100
        const price = Number(item.lastPrice || 0)

        let signal = 'NEUTRAL'
        let score = 50

        if (change24h > 1) {
          signal = 'LONG'
          score = Math.min(100, Math.round(60 + change24h * 3))
        } else if (change24h < -1) {
          signal = 'SHORT'
          score = Math.min(100, Math.round(60 + Math.abs(change24h) * 3))
        }

        return {
          id: index + 1,
          coin: item.symbol.replace('USDT', ''),
          pair: item.symbol,
          signal,
          price,
          change24h: change24h.toFixed(2),
          score,
          rsi: '-',
          macd: '-',
          status: 'LIVE BYBIT'
        }
      })

    return NextResponse.json({ signals: filtered })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
