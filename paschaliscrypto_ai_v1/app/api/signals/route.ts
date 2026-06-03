export async function GET(){
  const coins=['BTC','ETH','SOL','XRP','ADA','DOGE','AVAX','LINK','BNB','ARB','OP','SUI']
  const signals=coins.slice(0,8).map((coin,i)=>({
    coin, pair:`${coin}/USDT`, signal:i%2===0?'LONG':'SHORT', timeframe:['5m','15m','30m'][i%3],
    score:80+i*3, rsi:(42+i*2.7).toFixed(2), macd:(i%2===0?0.0012:-0.0015).toFixed(5),
    adx:(21+i).toFixed(2), atr:(0.25+i/20).toFixed(2), status:i%3===0?'Verified':i%3===1?'Failed':'Pending'
  }))
  return Response.json({signals})
}
