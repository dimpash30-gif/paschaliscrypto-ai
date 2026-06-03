'use client'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Register(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState('')
 async function submit(e:any){e.preventDefault(); const {error}=await supabase.auth.signUp({email,password}); if(error)setMsg(error.message); else setMsg('Έγινε εγγραφή. Έλεγξε το email σου για επιβεβαίωση.')}
 return <main className="wrap"><div className="form card"><h1>Εγγραφή</h1><form onSubmit={submit}><input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="input" type="password" placeholder="Κωδικός" value={password} onChange={e=>setPassword(e.target.value)}/><button className="btn primary" style={{width:'100%'}}>Δημιουργία λογαριασμού</button></form><p>{msg}</p><p>Έχεις λογαριασμό; <Link href="/login">Σύνδεση</Link></p></div></main>
}
