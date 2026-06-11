import { NextResponse } from 'next/server'

function ema(values: number[], period: number) {
  const k = 2 / (period + 1)
  const out: number[] = []
  values.forEach((v, i) => {
    out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k))
  })
  return out
}

function rsiSeries(values: number[], period = 14) {
  const out: number[] = Array(values.length).fill(NaN)
  if (values.length <= period) return out

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }

  return out
}

function lastValid(arr: number[]) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!Number.isNaN(arr[i]) && Number.isFinite(arr[i])) return arr[i]
  }
  return null
}

function stochRsi(values: number[], rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
  const rsis = rsiSeries(values, rsiPeriod)
  const stoch: number[] = Array(values.length).fill(NaN)

  for (let i = 0; i < values.length; i++) {
    if (i < rsiPeriod + stochPeriod) continue

    const slice = rsis.slice(i - stochPeriod + 1, i + 1).filter(v => !Number.isNaN(v))
    if (slice.length < stochPeriod) continue

    const min = Math.min(...slice)
    const max = Math.max(...slice)

    stoch[i] = max === min ? 50 : ((rsis[i] - min) / (max - min)) * 100
  }

  const k = simpleMA(stoch, kPeriod)
  const d = simpleMA(k, dPeriod)

  return {
    k: lastValid(k),
    d: lastValid(d)
  }
}

function simpleMA(values: number[], period: number) {
  const out: number[] = Array(values.length).fill(NaN)

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1).filter(v => !Number.isNaN(v))
    if (slice.length === period) {
      out[i] = slice.reduce((a, b) => a + b, 0) / period
    }
  }

  return out
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

function atrPercentApprox(values: number[], period = 14) {
  if (values.length <= period + 1) return null

  const trs: number[] = []

  for (let i = values.length - period; i < values.length; i++) {
    const prev = values[i - 1]
    const curr = values[i]
    trs.push(Math.abs(curr - prev))
  }

  const atr = trs.reduce((a, b) => a + b, 0) / trs.length
  const last = values[values.length - 1]

  return (atr / last) * 100
}

function lastCandleMove(values: number[]) {
  if (values.length < 2) return 999

  const prev = values[values.length - 2]
  const last = values[values.length - 1]

  if (prev === 0) return 999

  return Math.abs((last - prev) / prev) * 100
}

function analyzeSignal(params: {
  rsi: number
  stochK: number
  stochD: number
  macdHist: number
  macdImproving: boolean
  atrPercent: number
  candleMove: number
  change24h: number
}) {
  let longScore = 0
  let shortScore = 0
  const longReasons: string[] = []
  const shortReasons: string[] = []

  const { rsi, stochK, stochD, macdHist, macdImproving, atrPercent, candleMove, change24h } = params

  if (atrPercent >= 0.2) {
    longScore += 10
    shortScore += 10
  }

  if (candleMove >= 0.05 && candleMove <= 2.2) {
    longScore += 10
    shortScore += 10
  }

  if (35 <= rsi && rsi <= 65) {
    longScore += 10
    shortScore += 10
  }

  if (rsi < 45) {
    longScore += 10
    longReasons.push('RSI χαμηλά υπέρ LONG')
  }

  if (rsi > 55) {
    shortScore += 10
    shortReasons.push('RSI ψηλά υπέρ SHORT')
  }

  if (stochK > stochD && stochK < 80) {
    longScore += 20
    longReasons.push('Stoch RSI bullish')
  }

  if (stochK < stochD && stochK > 10) {
    shortScore += 20
    shortReasons.push('Stoch RSI bearish')
  }

  if (macdHist > 0) {
    longScore += 20
    longReasons.push('MACD bullish')
  }

  if (macdHist < 0) {
    shortScore += 20
    shortReasons.push('MACD bearish')
  }

  if (macdImproving) {
    longScore += 15
    longReasons.push('MACD improving')
  } else {
    shortScore += 15
    shortReasons.push('MACD weakening')
  }

  if (change24h > 0) longScore += 10
  if (change24h < 0) shortScore += 10

  let signal = 'NEUTRAL'
  let score = 50
  let reasons: string[] = []

  if (longScore >= 65 && longScore > shortScore) {
    signal = 'LONG'
    score = Math.min(100, longScore)
    reasons = longReasons
  } else if (shortScore >= 65 && shortScore > longScore) {
    signal = 'SHORT'
    score = Math.min(100, shortScore)
    reasons = shortReasons
  }
const confirmations =
  signal === 'LONG'
    ? longReasons.length
    : signal === 'SHORT'
    ? shortReasons.length
    : 0

return {
  signal,
  score,
  reasons,
  confirmations
}

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

      const rsiValues = rsiSeries(prices)
      const rsiValue = lastValid(rsiValues)
      const stoch = stochRsi(prices)
      const macdData = macd(prices)
      const atr = atrPercentApprox(prices)
      const candleMove = lastCandleMove(prices)

      let signal = 'NEUTRAL'
let score = 50
let reasons: string[] = []
let confirmations = 0

      if (
        rsiValue !== null &&
        stoch.k !== null &&
        stoch.d !== null &&
        macdData !== null &&
        atr !== null
      ) {
        const result = analyzeSignal({
          rsi: rsiValue,
          stochK: stoch.k,
          stochD: stoch.d,
          macdHist: macdData.hist,
          macdImproving: macdData.improving,
          atrPercent: atr,
          candleMove,
          change24h
        })

        signal = result.signal
score = result.score
reasons = result.reasons
confirmations = result.confirmations
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
        stochK: stoch.k !== null ? stoch.k.toFixed(2) : '-',
        stochD: stoch.d !== null ? stoch.d.toFixed(2) : '-',
        macd: macdData ? `${macdData.direction} ${macdData.hist.toFixed(6)}` : '-',
        atr: atr !== null ? atr.toFixed(2) : '-',
        lastCandle: candleMove !== 999 ? candleMove.toFixed(2) : '-',
        status: 'LIVE RSI + STOCH + MACD + ATR',
confirmations,
reasons
      }
    })
       signals.sort((a: any, b: any) => {
  const order: any = {
    LONG: 1,
    SHORT: 2,
    NEUTRAL: 3
  }

  if (order[a.signal] !== order[b.signal]) {
    return order[a.signal] - order[b.signal]
  }

  return b.score - a.score
})
    return NextResponse.json({ signals })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
