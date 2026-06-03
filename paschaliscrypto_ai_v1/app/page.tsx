import Link from 'next/link'
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react'

export default function Home() {
  return (
    <>
      <header className="top">
        <div className="brand"><TrendingUp/> PaschalisCrypto AI <span className="tag">Public Beta</span></div>
        <div><Link className="btn" href="/login">Σύνδεση</Link> <Link className="btn primary" href="/register">Εγγραφή</Link></div>
      </header>
      <main className="wrap">
        <section className="hero">
          <div>
            <h1>Έξυπνη ανάλυση crypto σημάτων σε μαύρο επαγγελματικό dashboard.</h1>
            <p>Εγγραφή με email, αναζήτηση κρυπτονομισμάτων, LONG/SHORT σήματα, στατιστικά και μελλοντική σύνδεση με Telegram alerts.</p>
            <Link className="btn primary" href="/register">Ξεκίνα δωρεάν</Link>
          </div>
          <div className="card">
            <h2>Τι περιλαμβάνει</h2>
            <p><Zap/> Signals με Score, RSI, MACD, ADX, ATR</p>
            <p><TrendingUp/> Market data και καρτέλες dashboard</p>
            <p><ShieldCheck/> Login χρηστών μέσω Supabase</p>
            <div className="notice">Προσοχή: Τα σήματα είναι εκπαιδευτικά/βοηθητικά και όχι οικονομική συμβουλή.</div>
          </div>
        </section>
      </main>
    </>
  )
}
