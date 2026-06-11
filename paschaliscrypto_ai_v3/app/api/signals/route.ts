import { NextResponse } from 'next/server'

function ema(values: number[], period: number) {
  const k = 2 / (period + 1)
  const out: number[] = []
  values.forEach((v, i) => {
    out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k))
  })
  return out
}

function rsi(values: number[], period = 14) {
  if (values.length <= period) return null

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function macd(values: number[]) {
  if (values.length < 35) return null

  const ema12 = ema(values, 12)
  const ema26 = ema(values, 26)
  const macdLine = values.map((_, i) => ema12[i] - ema26[i])
  const signalLine = ema(macdLine, 9)
  const hist = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1]
  const prevHist = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2]

  return {
    hist,
    prevHist,
    direction: hist > 0 ? 'Bullish' : 'Bearish',
    improving: hist > prevHist
  }
}

function analyzeSignal(rsiValue: number, macdData: any, change24h: number) {
  let longScore = 0
  let shortScore = 0

  if (rsiValue >= 35 && rsiValue <= 65) {
    longScore += 10
    shortScore += 10
  }

  if (rsiValue < 45) longScore += 15
  if (rsiValue > 55) shortScore += 15

  if (macdData.hist > 0) longScore += 25
  if (macdData.hist < 0) shortScore += 25

  if (macdData.improving) longScore += 20
  if (!macdData.improving) shortScore += 20

  if (change24h > 0) longScore += 10
  if (change24h < 0) shortScore += 10

  let signal = 'NEUTRAL'
  let score = 50

  if (longScore >= 45 && longScore > shortScore) {
    signal = 'LONG'
    score = Math.min(100, 50 + longScore)
  } else if (shortScore >= 45 && shortScore > longScore) {
    signal = 'SHORT'
    score = Math.min(100, 50 + shortScore)
  }

  return { signal, score }
}

export async function GET() {
  try {
    const url =
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h'

    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'CoinGecko request failed', status: res.status },
        { status: 500 }
      )
    }

    const data = await res.json()

    const signals = data.map((item: any, index: number) => {
      const prices: number[] = item.sparkline_in_7d?.price || []
      const price = Number(item.current_price || 0)
      const change24h = Number(item.price_change_percentage_24h || 0)

      const rsiValue = rsi(prices)
      const macdData = macd(prices)

      let signal = 'NEUTRAL'
      let score = 50

      if (rsiValue !== null && macdData !== null) {
        const result = analyzeSignal(rsiValue, macdData, change24h)
        signal = result.signal
        score = result.score
      }

      return {
        id: index + 1,
        coin: String(item.symbol || '').toUpperCase(),
        pair: `${String(item.symbol || '').toUpperCase()}/USDT`,
        signal,
        price,
        change24h: change24h.toFixed(2),
        score,
        rsi: rsiValue !== null ? rsiValue.toFixed(2) : '-',
        macd: macdData ? `${macdData.direction} ${macdData.hist.toFixed(6)}` : '-',
        status: 'LIVE RSI + MACD'
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
