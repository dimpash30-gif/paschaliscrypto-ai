'use client'
import { useEffect, useState } from 'react'
import { BarChart3, LogOut, Play, Search, TrendingUp, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Signal={coin:string,pair:string,signal:string,timeframe:string,score:number,price:number,change24h:number,rsi:string,macd:string,adx:string,atr:string,status:string,rank:number}
type Market={coin:string,pair:string,price:number,change24h:number,quoteVolume:number,high24h:number,low24h:number}

function money(n:number){
 if(n < 0.01) return `$${n.toFixed(8)}`
 if(n < 1) return `$${n.toFixed(5)}`
 return `$${n.toLocaleString(undefined,{maximumFractionDigits:4})}`
}
function pct(n:number){return `${n>=0?'+':''}${n.toFixed(2)}%`}

export default function Dashboard(){
 const [tab,setTab]=useState('Signals')
 const [signals,setSignals]=useState<Signal[]>([])
 const [market,setMarket]=useState<Market[]>([])
 const [loading,setLoading]=useState(false)
 const [msg,setMsg]=useState('')

 async function load(){
  setLoading(true); setMsg('Γίνεται αναζήτηση 50 κρυπτονομισμάτων...')
  try{
   const r=await fetch('/api/signals',{cache:'no-store'})
   const j=await r.json()
   if(!r.ok) throw new Error(j.error || 'Σφάλμα αναζήτησης')
   setSignals(j.signals || [])
   setMarket(j.market || [])
   setMsg(`Βρέθηκαν ${j.count || 0} κρυπτονομίσματα με ζωντανά δεδομένα Bybit.`)
  }catch(e:any){
   setMsg(e.message || 'Δεν ολοκληρώθηκε η αναζήτηση.')
  }finally{setLoading(false)}
 }
 async function logout(){await supabase.auth.signOut(); window.location.href='/'}
 useEffect(()=>{load()},[])
 const long=signals.filter(s=>s.signal==='LONG').length, short=signals.filter(s=>s.signal==='SHORT').length, pending=signals.filter(s=>s.status==='Pending').length
 return <>
 <header className="top"><div className="brand"><TrendingUp/> PaschalisCrypto AI <span className="tag">Bybit Live Beta</span></div><button onClick={logout} className="btn"><LogOut size={16}/> Έξοδος</button></header>
 <main className="wrap">
  <div className="tabs">{['Signals','Market','Chart','Statistics','About'].map(t=><button key={t} onClick={()=>setTab(t)} className={`tab ${tab===t?'active':''}`}>{t}</button>)}</div>
  {tab==='Signals'&&<section className="card"><h2><Zap/> Trading Signals</h2><button onClick={load} disabled={loading} className="btn primary"><Play size={16}/> {loading?'Αναζήτηση...':'Αναζήτηση 50 κρυπτονομισμάτων'}</button><p className="notice" style={{marginTop:14}}>{msg}</p><div style={{overflowX:'auto',marginTop:18}}><table><thead><tr><th>#</th><th>Coin</th><th>Signal</th><th>Price</th><th>24h</th><th>Score</th><th>RSI</th><th>MACD</th><th>Status</th></tr></thead><tbody>{signals.map(s=><tr key={s.pair}><td>{s.rank}</td><td>{s.pair}</td><td><span className={`pill ${s.signal==='LONG'?'long':'short'}`}>{s.signal}</span></td><td>{money(s.price)}</td><td className={s.change24h>=0?'greenText':'redText'}>{pct(s.change24h)}</td><td>{s.score}%</td><td>{s.rsi}</td><td>{s.macd}</td><td>{s.status}</td></tr>)}</tbody></table></div></section>}
  {tab==='Market'&&<section className="card"><h2><Search/> Live Market Data</h2><div style={{overflowX:'auto'}}><table><thead><tr><th>Coin</th><th>Price</th><th>24h</th><th>High 24h</th><th>Low 24h</th><th>Volume USDT</th></tr></thead><tbody>{market.map(s=><tr key={s.pair}><td>{s.pair}</td><td>{money(s.price)}</td><td className={s.change24h>=0?'greenText':'redText'}>{pct(s.change24h)}</td><td>{money(s.high24h)}</td><td>{money(s.low24h)}</td><td>{Math.round(s.quoteVolume).toLocaleString()}</td></tr>)}</tbody></table></div></section>}
  {tab==='Chart'&&<section className="card mobile-card"><div><BarChart3 size={80}/><p>Επόμενο βήμα: επιλογή coin και TradingView chart.</p></div></section>}
  {tab==='Statistics'&&<section className="card"><h2><BarChart3/> Signal Statistics</h2><div className="grid"><div className="stat"><p>Total</p><div className="big">{signals.length}</div></div><div className="stat"><p>LONG</p><div className="big greenText">{long}</div></div><div className="stat"><p>SHORT</p><div className="big redText">{short}</div></div><div className="stat"><p>Pending</p><div className="big yellowText">{pending}</div></div></div></section>}
  {tab==='About'&&<section className="card"><h2>About PaschalisCrypto AI</h2><p>Η έκδοση αυτή κάνει αναζήτηση 50 κρυπτονομισμάτων και εμφανίζει ζωντανές τιμές/μεταβολές από Bybit public market data.</p><p>Το επόμενο βήμα είναι να προσθέσουμε πραγματικούς δείκτες RSI, MACD, ADX και ATR όπως στον Python scanner σου.</p><div className="notice">Τα σήματα είναι εκπαιδευτικά/βοηθητικά και όχι οικονομική συμβουλή.</div></section>}
 </main></>
}
