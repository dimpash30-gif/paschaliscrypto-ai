'use client'
import { useEffect, useState } from 'react'
import { BarChart3, LogOut, Play, Search, TrendingUp, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Signal={coin:string,pair:string,signal:string,timeframe:string,score:number,rsi:string,macd:string,adx:string,atr:string,status:string}
export default function Dashboard(){
 const [tab,setTab]=useState('Signals'); const [signals,setSignals]=useState<Signal[]>([]); const [loading,setLoading]=useState(false)
 async function load(){setLoading(true); const r=await fetch('/api/signals'); const j=await r.json(); setSignals(j.signals); setLoading(false)}
 async function logout(){await supabase.auth.signOut(); window.location.href='/'}
 useEffect(()=>{load()},[])
 const verified=signals.filter(s=>s.status==='Verified').length, failed=signals.filter(s=>s.status==='Failed').length, pending=signals.filter(s=>s.status==='Pending').length
 return <>
 <header className="top"><div className="brand"><TrendingUp/> PaschalisCrypto AI <span className="tag">Demo Mode</span></div><button onClick={logout} className="btn"><LogOut size={16}/> Έξοδος</button></header>
 <main className="wrap">
  <div className="tabs">{['Signals','Market','Chart','Statistics','About'].map(t=><button key={t} onClick={()=>setTab(t)} className={`tab ${tab===t?'active':''}`}>{t}</button>)}</div>
  {tab==='Signals'&&<section className="card"><h2><Zap/> Trading Signals</h2><button onClick={load} className="btn primary"><Play size={16}/> Αναζήτηση κρυπτονομισμάτων</button>{loading&&<p>Γίνεται ανάλυση...</p>}<div style={{overflowX:'auto',marginTop:18}}><table><thead><tr><th>Coin</th><th>Signal</th><th>TF</th><th>Score</th><th>RSI</th><th>MACD</th><th>Status</th></tr></thead><tbody>{signals.map(s=><tr key={s.coin}><td>{s.pair}</td><td><span className={`pill ${s.signal==='LONG'?'long':'short'}`}>{s.signal}</span></td><td>{s.timeframe}</td><td>{s.score}%</td><td>{s.rsi}</td><td>{s.macd}</td><td>{s.status}</td></tr>)}</tbody></table></div></section>}
  {tab==='Market'&&<section className="card"><h2><Search/> Live Market Data</h2><table><thead><tr><th>Coin</th><th>Price</th><th>24h</th></tr></thead><tbody>{signals.map((s,i)=><tr key={s.coin}><td>{s.coin}</td><td>${(1000+i*347.55).toFixed(2)}</td><td className={i%2?'redText':'greenText'}>{i%2?'-2.14%':'+3.62%'}</td></tr>)}</tbody></table></section>}
  {tab==='Chart'&&<section className="card mobile-card"><div><BarChart3 size={80}/><p>Εδώ θα μπει TradingView chart όταν επιλέγεις signal.</p></div></section>}
  {tab==='Statistics'&&<section className="card"><h2><BarChart3/> Signal Performance Statistics</h2><div className="grid"><div className="stat"><p>Total</p><div className="big">{signals.length}</div></div><div className="stat"><p>Verified</p><div className="big greenText">{verified}</div></div><div className="stat"><p>Failed</p><div className="big redText">{failed}</div></div><div className="stat"><p>Pending</p><div className="big yellowText">{pending}</div></div></div></section>}
  {tab==='About'&&<section className="card"><h2>About PaschalisCrypto AI</h2><p>Πλατφόρμα διαχείρισης και ανάλυσης crypto signals, βασισμένη στον δικό σου αλγόριθμο Python. Η έκδοση αυτή είναι αρχικό δημόσιο MVP.</p><p>Τα δεδομένα εδώ είναι demo. Το επόμενο βήμα είναι σύνδεση με πραγματικό scanner/API.</p></section>}
 </main></>
}
