import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url =
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'

    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'CoinGecko request failed', status: res.status },
        { status: 500 }
      )
    }

    const data = await res.json()

    const signals = data.map((item: any, index: number) => {
      const change24h = Number(item.price_change_percentage_24h || 0)
      const price = Number(item.current_price || 0)

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
        coin: String(item.symbol || '').toUpperCase(),
        pair: `${String(item.symbol || '').toUpperCase()}/USDT`,
        signal,
        price,
        change24h: change24h.toFixed(2),
        score,
        rsi: '-',
        macd: '-',
        status: 'LIVE COINGECKO'
      }
    })

    return NextResponse.json({ signals })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
