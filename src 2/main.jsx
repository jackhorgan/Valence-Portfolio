import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  Activity, ArrowDownLeft, ArrowUpRight, BarChart3, Bell, CalendarDays,
  ChevronDown, CircleDollarSign, ClipboardList, Download, FileText, LayoutDashboard,
  Menu, Plus, RefreshCw, Settings, ShieldCheck, Smartphone, Trash2, TrendingDown,
  TrendingUp, Upload, Wallet, X
} from 'lucide-react';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import './styles.css';

const STORAGE = 'valence_state_v1';
const demoHoldings = [
  { id:'1', ticker:'AAPL', name:'Apple Inc.', assetType:'Stock', sector:'Technology', shares:15, avgCost:170, price:233.74, dividendYield:0.42 },
  { id:'2', ticker:'VOO', name:'Vanguard S&P 500 ETF', assetType:'ETF', sector:'US Equity', shares:25, avgCost:410, price:621.77, dividendYield:1.18 },
  { id:'3', ticker:'NVDA', name:'NVIDIA Corporation', assetType:'Stock', sector:'Technology', shares:5, avgCost:118.5, price:182.27, dividendYield:0.03 },
  { id:'4', ticker:'BTC', name:'Bitcoin', assetType:'Crypto', sector:'Crypto', shares:0.18, avgCost:72000, price:115000, dividendYield:0 }
];
const demoTransactions = [
  { id:'t1', date:'2026-09-15', type:'Buy', ticker:'NVDA', quantity:5, price:118.5, fee:0, notes:'Weekly DCA contribution' },
  { id:'t2', date:'2026-09-01', type:'Buy', ticker:'VOO', quantity:1, price:614.12, fee:0, notes:'Monthly index contribution' },
  { id:'t3', date:'2026-08-29', type:'Div', ticker:'VOO', quantity:0, price:0, fee:0, notes:'Quarterly dividend' }
];
const demoSnapshots = [
  { date:'2026-08-17', value:23800, deposits:0 }, { date:'2026-08-24', value:24250, deposits:500 },
  { date:'2026-08-31', value:25800, deposits:500 }, { date:'2026-09-07', value:26900, deposits:0 },
  { date:'2026-09-14', value:28760, deposits:500 }
];
const fmtMoney = (n, currency='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(n || 0);
const fmtPct = n => `${n >= 0 ? '+' : ''}${(n||0).toFixed(2)}%`;
const fmtNZD = n => fmtMoney(n,'NZD');
const FX_API='https://api.frankfurter.dev/v2/rate/usd/nzd';
function loadState(){ try { const raw=localStorage.getItem(STORAGE); return raw?JSON.parse(raw):{holdings:demoHoldings,transactions:demoTransactions,snapshots:demoSnapshots,cash:1240,currency:'USD'}; } catch { return {holdings:demoHoldings,transactions:demoTransactions,snapshots:demoSnapshots,cash:1240,currency:'USD'}; } }
function App(){
 const [state,setState]=useState(loadState);
 const [page,setPage]=useState('dashboard');
 const [modal,setModal]=useState(null);
 const [menuOpen,setMenuOpen]=useState(false);
 const updateState=(next)=>{setState(next); localStorage.setItem(STORAGE,JSON.stringify(next));};
 const currency=state.currency;
 const positions=useMemo(()=>state.holdings.map(h=>{const value=h.shares*h.price; const cost=h.shares*h.avgCost; return {...h,value,cost,pl:value-cost,plPct:cost?((value-cost)/cost)*100:0,weight:0}}),[state.holdings]);
 const totalInvested=positions.reduce((a,p)=>a+p.cost,0);
 const totalValue=positions.reduce((a,p)=>a+p.value,0)+state.cash;
 const unrealized=positions.reduce((a,p)=>a+p.pl,0);
 const dayMove=useMemo(()=>positions.reduce((a,p)=>a+(p.price*(p.shares*0.012)),0),[positions]);
 const annualIncome=positions.reduce((a,p)=>a+p.value*((p.dividendYield||0)/100),0);
 const allocation=positions.map(p=>({...p,weight:totalValue?p.value/totalValue*100:0})).sort((a,b)=>b.weight-a.weight);
 const chartData=state.snapshots.length?state.snapshots:[];
 const perfPct=totalInvested?unrealized/totalInvested*100:0;
 const netDeposits=state.transactions.reduce((sum,t)=>sum + (t.type==='Buy'?t.quantity*t.price + t.fee : t.type==='Sell'?-(t.quantity*t.price - t.fee) : 0),0);
 const saveJSON=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='valence-backup.json';a.click();URL.revokeObjectURL(a.href)};
 const importJSON=(file)=>{const r=new FileReader();r.onload=()=>{try{const next=JSON.parse(r.result);updateState(next);alert('Valence data imported.');}catch{alert('That file is not a valid Valence backup.')}};r.readAsText(file)};
 const nav=(p)=>{setPage(p);setMenuOpen(false)};
 const reset=()=>{if(confirm('Reset to the demo portfolio?')) updateState({holdings:demoHoldings,transactions:demoTransactions,snapshots:demoSnapshots,cash:1240,currency:'USD'});};
 return <div className="app">
  <aside className={`sidebar ${menuOpen?'open':''}`}>
   <div className="brand"><div className="brandmark">V</div><div><div className="brandname">VALENCE</div><div className="brandtag">PORTFOLIO OS</div></div></div>
   <nav>
    <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={page==='dashboard'} onClick={()=>nav('dashboard')}/>
    <NavItem icon={<Wallet size={18}/>} label="Holdings" active={page==='holdings'} onClick={()=>nav('holdings')}/>
    <NavItem icon={<ClipboardList size={18}/>} label="Transactions" active={page==='transactions'} onClick={()=>nav('transactions')}/>
    <NavItem icon={<CalendarDays size={18}/>} label="Reports" active={page==='reports'} onClick={()=>nav('reports')}/>
   </nav>
   <div className="sidebar-bottom">
     <button className="side-link"><Settings size={18}/>Settings</button>
     <div className="sync-card"><ShieldCheck size={17}/><div><b>Local-first</b><span>Your data stays in this browser.</span></div></div>
   </div>
  </aside>
  <main className="main">
   <header className="topbar">
    <button className="iconbtn menu-btn" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={20}/></button>
    <div className="crumb"><span>Portfolio</span><ChevronDown size={15}/><b>{page[0].toUpperCase()+page.slice(1)}</b></div>
    <div className="top-actions"><div className="date-pill"><Activity size={15}/> Week of Sep 15, 2026</div><button className="iconbtn"><Bell size={18}/></button><button className="add-btn" onClick={()=>setModal('transaction')}><Plus size={17}/>Add</button></div>
   </header>
   <div className="content">
    {page==='dashboard' && <Dashboard {...{state,positions,totalValue,totalInvested,unrealized,perfPct,annualIncome,dayMove,allocation,chartData,currency,setModal,setPage,fxRate,fxDate}}/>}
    {page==='holdings' && <Holdings {...{state,positions,totalValue,currency,updateState,setModal,fxRate,fxDate}}/>}
    {page==='transactions' && <Transactions {...{state,currency,setModal,updateState}}/>}
    {page==='reports' && <Reports {...{state,currency,positions,totalValue,totalInvested,unrealized,allocation,chartData,setModal,updateState}}/>}
   </div>
  </main>
  {modal==='transaction' && <TransactionModal state={state} currency={currency} onClose={()=>setModal(null)} onSave={(tx)=>{let holdings=[...state.holdings];if(tx.type==='Buy'){const i=holdings.findIndex(h=>h.ticker===tx.ticker);if(i>=0){const h=holdings[i];const oldCost=h.shares*h.avgCost;const newCost=oldCost+tx.usdValue+tx.fee;holdings[i]={...h,shares:h.shares+tx.quantity,avgCost:(newCost/(h.shares+tx.quantity)),price:tx.price};}else holdings.push({id:crypto.randomUUID(),ticker:tx.ticker,name:tx.ticker,assetType:'Stock',sector:'Unknown',shares:tx.quantity,avgCost:(tx.usdValue+tx.fee)/(tx.quantity||1),price:tx.price,dividendYield:0});}if(tx.type==='Sell'){const i=holdings.findIndex(h=>h.ticker===tx.ticker);if(i>=0)holdings[i]={...holdings[i],shares:Math.max(0,holdings[i].shares-tx.quantity),price:tx.price};}updateState({...state,holdings,transactions:[tx,...state.transactions]});setModal(null)}}/>}
  {modal==='holding' && <HoldingModal onClose={()=>setModal(null)} onSave={(h)=>{updateState({...state,holdings:[...state.holdings,h]});setModal(null)}}/>}
 </div>
}
function NavItem({icon,label,active,onClick}){return <button className={`nav-item ${active?'active':''}`} onClick={onClick}>{icon}<span>{label}</span></button>}
function Stat({label,value,sub,positive,negative,icon}){return <div className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className={`stat-sub ${positive?'pos':''} ${negative?'neg':''}`}>{sub}</div></div>}
function Dashboard(p){
 const [range,setRange]=useState('1M');
 const colors=['#e8eef7','#7f93af','#4f6686','#bcc8d8','#95a5b9','#687a93'];
 const donut=p.allocation.slice(0,6).map((x,i)=>({name:x.ticker,value:Number(x.weight.toFixed(2)),color:colors[i]||'#526274'}));
 return <>
  <div className="page-head"><div><div className="eyebrow">LIVE PORTFOLIO</div><h1>Good evening.</h1><p>Here’s the latest view of your portfolio.</p></div><button className="outline-btn" onClick={()=>p.setModal('transaction')}><Plus size={16}/> Log update</button></div>
  <section className="stats-grid">
   <Stat label="Portfolio value" value={fmtMoney(p.totalValue,p.currency)} sub={`${fmtPct(p.perfPct)} all-time`} positive={p.perfPct>=0} negative={p.perfPct<0} icon={<CircleDollarSign size={16}/>}/>
   <Stat label="Net invested" value={fmtMoney(p.totalInvested,p.currency)} sub={`${p.positions.length} open positions`} icon={<Wallet size={16}/>}/>
   <Stat label="Unrealized P/L" value={fmtMoney(p.unrealized,p.currency)} sub={`${p.unrealized>=0?'+':''}${fmtPct(p.perfPct)} return`} positive={p.unrealized>=0} negative={p.unrealized<0} icon={p.unrealized>=0?<TrendingUp size={16}/>:<TrendingDown size={16}/>}/>
   <Stat label="Projected dividends" value={fmtMoney(p.annualIncome,p.currency)} sub="annualized" icon={<ArrowDownLeft size={16}/>}/>
  </section>
  <div className="grid-2">
   <section className="panel chart-panel"><div className="panel-head"><div><h2>Portfolio growth</h2><span>Ending value by snapshot</span></div><div className="range"><button className={range==='1M'?'selected':''} onClick={()=>setRange('1M')}>1M</button><button className={range==='3M'?'selected':''} onClick={()=>setRange('3M')}>3M</button><button className={range==='1Y'?'selected':''} onClick={()=>setRange('1Y')}>1Y</button></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={290}><AreaChart data={p.chartData}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bfcce0" stopOpacity=".35"/><stop offset="100%" stopColor="#bfcce0" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#202832"/><XAxis dataKey="date" tickFormatter={x=>x.slice(5)} stroke="#667180" fontSize={11}/><YAxis stroke="#667180" fontSize={11} tickFormatter={x=>`$${Math.round(x/1000)}k`}/><Tooltip contentStyle={{background:'#10161d',border:'1px solid #29313b',borderRadius:12}} formatter={(v)=>fmtMoney(v,p.currency)}/><Area type="monotone" dataKey="value" stroke="#dce5f1" strokeWidth={2.5} fill="url(#g)"/></AreaChart></ResponsiveContainer></div></section>
   <section className="panel"><div className="panel-head"><div><h2>Allocation</h2><span>By position</span></div><button className="link-btn" onClick={()=>p.setModal('holding')}>+ Position</button></div><div className="allocation"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={donut} dataKey="value" nameKey="name" innerRadius={72} outerRadius={102} paddingAngle={2}>{donut.map((x,i)=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip formatter={(v)=>`${v}%`}/></PieChart></ResponsiveContainer><div className="donut-center"><b>{p.allocation.length}</b><span>positions</span></div></div><div className="legend">{p.allocation.slice(0,6).map((x,i)=><div className="legend-row" key={x.id}><span className="dot" style={{background:donut[i]?.color}}></span><span>{x.ticker}</span><b>{x.weight.toFixed(1)}%</b></div>)}</div></div></section>
  </div>
  <section className="panel fx-panel"><div className="panel-head"><div><h2>NZD overview</h2><span>Current USD values translated using Frankfurter's daily reference rate</span></div><span className={`badge ${p.fxRate?'div':'sell'}`}>{p.fxRate?'FX UPDATED':'FX UNAVAILABLE'}</span></div><div className="fx-overview"><div><span>Portfolio (USD)</span><b>{fmtMoney(p.totalValue,'USD')}</b></div><div><span>Portfolio (NZD)</span><b>{p.fxRate?fmtNZD(p.totalValue*p.fxRate):'—'}</b></div><div><span>USD/NZD</span><b>{p.fxRate?p.fxRate.toFixed(4):'—'}</b></div><div><span>Rate date</span><b>{p.fxDate||'—'}</b></div></div><div className="note">{p.fxRate?`Daily reference rate from Frankfurter. Last published rate: ${p.fxDate}. This is a reference rate, not the exact Sharesies execution rate.`:'Current NZD valuation is unavailable until the daily Frankfurter FX rate is retrieved.'}</div></section>
  <section className="panel table-panel"><div className="panel-head"><div><h2>Open holdings</h2><span>Current portfolio positions</span></div><button className="link-btn" onClick={()=>p.setPage('holdings')}>View all →</button></div><div className="table-scroll"><table><thead><tr><th>Position</th><th>Price</th><th>Value</th><th>P/L</th><th>Weight</th></tr></thead><tbody>{p.allocation.slice(0,6).map(x=><tr key={x.id}><td><div className="ticker"><span>{x.ticker}</span><small>{x.name}</small></div></td><td>{fmtMoney(x.price,p.currency)}</td><td>{fmtMoney(x.value,p.currency)}</td><td className={x.pl>=0?'positive':'negative'}>{x.pl>=0?'+':''}{fmtMoney(x.pl,p.currency)}<small>{fmtPct(x.plPct)}</small></td><td><div className="weight"><div className="bar"><i style={{width:`${Math.min(x.weight,100)}%`}}></i></div><span>{x.weight.toFixed(1)}%</span></div></td></tr>)}</tbody></table></div></section>
  <div className="quick-grid"><button onClick={()=>p.setModal('transaction')}><Plus size={18}/><div><b>Add transaction</b><span>Buy, sell, dividend or deposit</span></div></button><button onClick={()=>p.setModal('holding')}><Wallet size={18}/><div><b>Add existing holding</b><span>Set up an investment you already owned</span></div></button><button onClick={()=>p.setModal('snapshot')}><CalendarDays size={18}/><div><b>Log weekly snapshot</b><span>Capture your end-of-week value</span></div></button></div>
 </>
}
function Holdings({state,positions,totalValue,currency,updateState,setModal,fxRate,fxDate}){return <><div className="page-head"><div><div className="eyebrow">POSITIONS</div><h1>Open holdings</h1><p>Everything you currently own in one place.</p></div><button className="outline-btn" onClick={()=>setModal('holding')}><Plus size={16}/> Add existing holding</button></div><section className="panel"><div className="panel-head"><div><h2>Current positions</h2><span>{fxRate?`NZD values use USD/NZD ${fxRate.toFixed(4)} · ${fxDate}`:'NZD values unavailable until the daily FX rate updates'}</span></div></div><div className="table-scroll"><table><thead><tr><th>Position</th><th>Shares</th><th>Avg cost (USD)</th><th>Current price</th><th>Value (USD)</th><th>Value (NZD)</th><th>P/L</th><th>Weight</th><th></th></tr></thead><tbody>{positions.map(x=>{const nz=fxRate?x.value*fxRate:null;return <tr key={x.id}><td><div className="ticker"><span>{x.ticker}</span><small>{x.name} · {x.sector}</small></div></td><td>{x.shares}</td><td>{fmtMoney(x.avgCost,'USD')}</td><td>{fmtMoney(x.price,'USD')}</td><td>{fmtMoney(x.value,'USD')}</td><td>{nz===null?'—':fmtNZD(nz)}</td><td className={x.pl>=0?'positive':'negative'}>{x.pl>=0?'+':''}{fmtMoney(x.pl,'USD')}<small>{fmtPct(x.plPct)}</small>{nz!==null&&<small>{x.pl>=0?'+':''}{fmtNZD(x.pl*fxRate)} FX-translated</small>}</td><td>{totalValue?`${(x.value/totalValue*100).toFixed(1)}%`:'0%'}</td><td><button className="danger-mini" onClick={()=>{if(confirm(`Delete ${x.ticker}?`)) updateState({...state,holdings:state.holdings.filter(h=>h.id!==x.id)})}}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div></section><section className="panel"><div className="note"><b>How to add investments:</b> For new Sharesies purchases, use <b>Add transaction → Buy</b>. Use <b>Add existing holding</b> only for positions you already owned before starting Valence.</div></section></>}
function Transactions({state,currency,setModal,updateState}){return <><div className="page-head"><div><div className="eyebrow">JOURNAL</div><h1>Transactions</h1><p>Record what Sharesies actually charged or paid you.</p></div><button className="outline-btn" onClick={()=>setModal('transaction')}><Plus size={16}/> Add transaction</button></div><section className="panel"><div className="table-scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Ticker</th><th>Quantity</th><th>USD value</th><th>NZD actual</th><th>Broker FX</th><th>Fees</th><th>Notes</th><th></th></tr></thead><tbody>{state.transactions.map(t=>{const usd=t.usdValue??(t.quantity*t.price);const nz=t.nzdValue;return <tr key={t.id}><td>{t.date}</td><td><span className={`badge ${(t.type||'').toLowerCase()}`}>{t.type}</span></td><td><b>{t.ticker||'—'}</b></td><td>{t.quantity||'—'}</td><td>{usd?fmtMoney(usd,'USD'):'—'}</td><td>{nz?fmtNZD(nz):'—'}</td><td>{t.fxRate?t.fxRate.toFixed(4):'—'}</td><td>{t.fee?fmtMoney(t.fee,'USD'):''}{t.fxFeeNzd?` ${fmtNZD(t.fxFeeNzd)}`:''}</td><td className="notes">{t.notes||'—'}</td><td><button className="danger-mini" onClick={()=>updateState({...state,transactions:state.transactions.filter(x=>x.id!==t.id)})}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div></section></>}
function Reports({state,currency,positions,totalValue,totalInvested,unrealized,allocation,chartData,setModal,updateState}){const monthly=useMemo(()=>{const m={}; state.snapshots.forEach(s=>{const k=s.date.slice(0,7);m[k]=s}); return Object.entries(m).map(([k,s])=>({month:k,value:s.value,deposits:s.deposits||0}))},[state.snapshots]); const top=allocation.slice(0,5).map(x=>({name:x.ticker,pl:Number(x.pl.toFixed(0))})); return <><div className="page-head"><div><div className="eyebrow">PERFORMANCE</div><h1>Weekly & monthly reports</h1><p>Turn your updates into a simple investing record.</p></div><button className="outline-btn" onClick={()=>setModal('snapshot')}><Plus size={16}/> Log snapshot</button></div><div className="report-grid"><section className="panel report-card"><div className="panel-head"><div><h2>Current period</h2><span>Compared with invested capital</span></div></div><div className="report-kpis"><div><span>Portfolio value</span><b>{fmtMoney(totalValue,currency)}</b></div><div><span>Net invested</span><b>{fmtMoney(totalInvested,currency)}</b></div><div><span>Unrealized P/L</span><b className={unrealized>=0?'positive':'negative'}>{fmtMoney(unrealized,currency)}</b></div></div><div className="insight"><Activity size={18}/><div><b>Investor note</b><p>{unrealized>=0?'Your portfolio is above its current cost basis. Keep contributions consistent and judge performance against a benchmark.':'Your portfolio is below its current cost basis. Review position sizing and thesis before reacting to short-term moves.'}</p></div></div></section><section className="panel chart-panel"><div className="panel-head"><div><h2>P/L by position</h2><span>Current unrealized return</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={240}><BarChart data={top}><CartesianGrid strokeDasharray="3 3" stroke="#202832"/><XAxis dataKey="name" stroke="#667180"/><YAxis stroke="#667180"/><Tooltip formatter={(v)=>fmtMoney(v,currency)}/><Bar dataKey="pl" fill="#aebdce" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section></div><section className="panel table-panel"><div className="panel-head"><div><h2>Snapshot history</h2><span>Use this at the end of each week or month</span></div></div><div className="table-scroll"><table><thead><tr><th>Period</th><th>Ending value</th><th>Deposits</th><th>Change vs prior</th><th></th></tr></thead><tbody>{state.snapshots.slice().reverse().map((s,i,arr)=>{const prev=arr[i+1];const diff=prev?s.value-prev.value:0;return <tr key={s.date}><td>{s.date}</td><td>{fmtMoney(s.value,currency)}</td><td>{fmtMoney(s.deposits||0,currency)}</td><td className={diff>=0?'positive':'negative'}>{prev?`${diff>=0?'+':''}${fmtMoney(diff,currency)}`:'—'}</td><td></td></tr>})}</tbody></table></div></section></>}
function Modal({title,children,onClose,footer}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="iconbtn" onClick={onClose}><X size={18}/></button></div>{children}{footer&&<div className="modal-footer">{footer}</div>}</div></div>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function TransactionModal({state,currency,onClose,onSave}){const [f,setF]=useState({date:new Date().toISOString().slice(0,10),type:'Buy',ticker:'',quantity:'',price:'',usdValue:'',nzdValue:'',fxRate:'',fee:'',fxFeeNzd:'',notes:''});const set=(k,v)=>setF({...f,[k]:v});const trade=['Buy','Sell'].includes(f.type);const cash=['Deposit','Withdrawal'].includes(f.type);return <Modal title="Add transaction" onClose={onClose} footer={<><button className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={()=>{if(trade&&!f.ticker)return;if((trade||f.type==='Div')&&!f.nzdValue&&!f.usdValue)return;onSave({...f,id:crypto.randomUUID(),ticker:f.ticker.toUpperCase(),quantity:Number(f.quantity||0),price:Number(f.price||0),usdValue:Number(f.usdValue||((Number(f.quantity||0)*Number(f.price||0))||0)),nzdValue:Number(f.nzdValue||0),fxRate:Number(f.fxRate||0),fee:Number(f.fee||0),fxFeeNzd:Number(f.fxFeeNzd||0)})}}>Save transaction</button></>}><div className="form-grid"><Field label="Date"><input type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></Field><Field label="Type"><select value={f.type} onChange={e=>set('type',e.target.value)}><option>Buy</option><option>Sell</option><option>Div</option><option>Deposit</option><option>Withdrawal</option></select></Field>{!cash&&<Field label="Ticker"><input placeholder="NVDA" value={f.ticker} onChange={e=>set('ticker',e.target.value.toUpperCase())}/></Field>}{!cash&&<Field label="Quantity / shares"><input type="number" step="any" value={f.quantity} onChange={e=>set('quantity',e.target.value)}/></Field>}{trade&&<Field label="Price per share (USD)"><input type="number" step="any" value={f.price} onChange={e=>set('price',e.target.value)}/></Field>}<Field label={cash?'NZD amount':'USD trade / dividend value'}><input type="number" step="any" value={cash?f.nzdValue:f.usdValue} onChange={e=>set(cash?'nzdValue':'usdValue',e.target.value)}/></Field>{trade&&<><Field label="NZD amount actually paid / received"><input type="number" step="any" value={f.nzdValue} onChange={e=>set('nzdValue',e.target.value)}/></Field><Field label="Sharesies broker FX rate"><input type="number" step="any" value={f.fxRate} onChange={e=>set('fxRate',e.target.value)}/></Field><Field label="Sharesies fee (USD)"><input type="number" step="any" value={f.fee} onChange={e=>set('fee',e.target.value)}/></Field><Field label="FX fee (NZD)"><input type="number" step="any" value={f.fxFeeNzd} onChange={e=>set('fxFeeNzd',e.target.value)}/></Field></>}{!trade&&!cash&&<Field label="NZD received"><input type="number" step="any" value={f.nzdValue} onChange={e=>set('nzdValue',e.target.value)}/></Field>}<Field label="Notes / strategy"><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Weekly DCA contribution"/></Field></div><div className="note">For Sharesies trades, enter the actual NZD amount shown by Sharesies and the FX rate used for that transaction. Valence will never replace historical broker FX with today's reference rate.</div></Modal>}

function HoldingModal({onClose,onSave}){const [f,setF]=useState({ticker:'',name:'',assetType:'Stock',sector:'Technology',shares:'',avgCost:'',price:'',dividendYield:'0'});const set=(k,v)=>setF({...f,[k]:v});return <Modal title="Add position" onClose={onClose} footer={<><button className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={()=>{if(!f.ticker)return;onSave({...f,id:crypto.randomUUID(),ticker:f.ticker.toUpperCase(),shares:Number(f.shares||0),avgCost:Number(f.avgCost||0),price:Number(f.price||0),dividendYield:Number(f.dividendYield||0)})}}>Add position</button></>}><div className="form-grid"><Field label="Ticker"><input placeholder="MSFT" value={f.ticker} onChange={e=>set('ticker',e.target.value.toUpperCase())}/></Field><Field label="Company / asset"><input placeholder="Microsoft" value={f.name} onChange={e=>set('name',e.target.value)}/></Field><Field label="Type"><select value={f.assetType} onChange={e=>set('assetType',e.target.value)}><option>Stock</option><option>ETF</option><option>Crypto</option><option>Fund</option></select></Field><Field label="Sector"><input placeholder="Technology" value={f.sector} onChange={e=>set('sector',e.target.value)}/></Field><Field label="Shares / units"><input type="number" step="any" value={f.shares} onChange={e=>set('shares',e.target.value)}/></Field><Field label="Average cost"><input type="number" step="any" value={f.avgCost} onChange={e=>set('avgCost',e.target.value)}/></Field><Field label="Current price"><input type="number" step="any" value={f.price} onChange={e=>set('price',e.target.value)}/></Field><Field label="Dividend yield %"><input type="number" step="any" value={f.dividendYield} onChange={e=>set('dividendYield',e.target.value)}/></Field></div></Modal>}
function SnapshotModal({onClose,onSave}){const [f,setF]=useState({date:new Date().toISOString().slice(0,10),value:'',deposits:'0'});return <Modal title="Log portfolio snapshot" onClose={onClose} footer={<><button className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={()=>{if(!f.value)return;onSave({...f,id:crypto.randomUUID(),value:Number(f.value),deposits:Number(f.deposits||0)})}}>Save snapshot</button></>}><div className="form-grid"><Field label="Period end date"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><Field label="Ending portfolio value"><input type="number" value={f.value} onChange={e=>setF({...f,value:e.target.value})}/></Field><Field label="Net deposits"><input type="number" value={f.deposits} onChange={e=>setF({...f,deposits:e.target.value})}/></Field></div></Modal>}
// Patch snapshot opening through a global helper button is avoided by keeping Dashboard callbacks minimal.
// A lightweight effect-like interception is implemented below by wrapping the dashboard page action.
const _OriginalApp=App;
function Root(){const [key,setKey]=useState(0); return <AppWithSnapshot key={key}/>}
function AuthScreen({onReady}){
 const [mode,setMode]=useState('login');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const submit=async e=>{
  e.preventDefault(); setBusy(true); setMessage('');
  const result=mode==='login'
   ? await supabase.auth.signInWithPassword({email,password})
   : await supabase.auth.signUp({email,password});
  setBusy(false);
  if(result.error){setMessage(result.error.message); return;}
  if(mode==='signup' && !result.data.session) setMessage('Account created. Check your email to confirm it, then sign in.');
  else onReady(result.data.session);
 };
 return <div className="auth-screen"><div className="auth-card"><div className="brand auth-brand"><div className="brandmark">V</div><div><div className="brandname">VALENCE</div><div className="brandtag">PORTFOLIO OS</div></div></div><h1>{mode==='login'?'Welcome back':'Create your Valence account'}</h1><p className="auth-copy">Your portfolio is securely synced across your devices.</p><form onSubmit={submit}><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></Field><Field label="Password"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" minLength="6" required/></Field>{message&&<div className="auth-message">{message}</div>}<button className="primary-btn auth-submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form><button className="auth-switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>{mode==='login'?'Create a new account':'Already have an account? Sign in'}</button></div></div>
}

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase=(supabaseUrl && supabaseKey) ? createClient(supabaseUrl,supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;

function AppWithSnapshot(){
 const [snapshotOpen,setSnapshotOpen]=useState(false);
 const [state,setState]=useState(loadState);
 const [page,setPage]=useState('dashboard');
 const [modal,setModal]=useState(null);
 const [menuOpen,setMenuOpen]=useState(false);
 const [session,setSession]=useState(null);
 const [authLoading,setAuthLoading]=useState(Boolean(supabase));
 const [syncing,setSyncing]=useState(false);
 const [fxRate,setFxRate]=useState(null);
 const [fxDate,setFxDate]=useState(null);
 const currency=state.currency;
 useEffect(()=>{let cancelled=false;
 async function fetchFX(){
  const cacheKey='valence_fx_usd_nzd_v1';
  const today=new Date().toISOString().slice(0,10);
  try{
   const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
   if(cached?.rate && cached?.date){
    setFxRate(Number(cached.rate)); setFxDate(cached.date);
    if(cached.date===today) return;
   }
  }catch{}
  const urls=[
   'https://api.frankfurter.dev/v2/rate/usd/nzd',
   'https://api.frankfurter.dev/v1/latest?base=USD&symbols=NZD'
  ];
  for(const url of urls){
   try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    const r=await fetch(url,{cache:'no-store',signal:controller.signal});
    clearTimeout(timer);
    if(!r.ok) continue;
    const d=await r.json();
    const rate=Number(d?.rate ?? d?.rates?.NZD);
    const date=d?.date;
    if(Number.isFinite(rate)&&rate>0){
      if(!cancelled){setFxRate(rate);setFxDate(date||today);}
      localStorage.setItem(cacheKey,JSON.stringify({rate,date:date||today,source:'Frankfurter'}));
      return;
    }
   }catch{}
  }
  console.error('Valence FX update failed: both Frankfurter endpoints were unavailable.');
 }
 fetchFX();
 const timer=setInterval(fetchFX,6*60*60*1000);
 return()=>{cancelled=true;clearInterval(timer)}
},[]);

 useEffect(()=>{
  if(!supabase){setAuthLoading(false);return;}
  let active=true;
  supabase.auth.getSession().then(async ({data})=>{
   if(!active)return;
   setSession(data.session);
   if(data.session) await loadCloud(data.session.user.id);
   setAuthLoading(false);
  });
  const {data:{subscription}}=supabase.auth.onAuthStateChange(async (_event,next)=>{
   if(!active)return;
   setSession(next);
   if(next) await loadCloud(next.user.id);
  });
  return()=>{active=false;subscription.unsubscribe()};
 },[]);

 async function loadCloud(userId){
  try{
   const [h,t,s,d]=await Promise.all([
    supabase.from('holdings').select('*').eq('user_id',userId).order('id'),
    supabase.from('transactions').select('*').eq('user_id',userId).order('transaction_date',{ascending:false}),
    supabase.from('portfolio_snapshots').select('*').eq('user_id',userId).order('snapshot_date'),
    supabase.from('dividends').select('*').eq('user_id',userId).order('payment_date',{ascending:false})
   ]);
   const err=[h,t,s,d].find(x=>x.error)?.error;
   if(err) throw err;
   const hasCloud=h.data?.length||t.data?.length||s.data?.length||d.data?.length;
   if(hasCloud){
    const next={
     holdings:(h.data||[]).map(x=>({id:String(x.id),ticker:x.ticker,name:x.company_name||x.ticker,assetType:x.asset_type||'Stock',sector:x.sector||'',shares:Number(x.shares),avgCost:Number(x.average_purchase_price),price:Number(x.current_price),dividendYield:Number(x.dividend_yield||0),notes:x.notes||''})),
     transactions:(t.data||[]).map(x=>({id:String(x.id),date:x.transaction_date,type:x.transaction_type,ticker:x.ticker,quantity:Number(x.quantity||0),price:Number(x.price_per_share||0),fee:Number(x.fee||0),usdValue:Number(x.usd_value||0),nzdValue:Number(x.nzd_value||0),fxRate:Number(x.fx_rate||0),fxFeeNzd:Number(x.fx_fee_nzd||0),notes:x.notes||''})),
     snapshots:(s.data||[]).map(x=>({id:String(x.id),date:x.snapshot_date,value:Number(x.portfolio_value||0),deposits:Number(x.net_invested||0)})),
     cash:1240,currency:state.currency||'USD',fxRate:state.fxRate||null,fxDate:state.fxDate||null
    };
    setState(next);localStorage.setItem(STORAGE,JSON.stringify(next));
   } else {
    await syncCloud(state,userId);
   }
  }catch(err){console.error('Valence cloud load failed',err);}
 }
 async function syncCloud(next,userId=session?.user?.id){
  if(!supabase||!userId)return;
  setSyncing(true);
  try{
   await Promise.all([
    supabase.from('holdings').delete().eq('user_id',userId),
    supabase.from('transactions').delete().eq('user_id',userId),
    supabase.from('portfolio_snapshots').delete().eq('user_id',userId),
    supabase.from('dividends').delete().eq('user_id',userId)
   ]);
   const jobs=[];
   if(next.holdings.length) jobs.push(supabase.from('holdings').insert(next.holdings.map(h=>({user_id:userId,ticker:h.ticker,company_name:h.name,asset_type:h.assetType||'Stock',sector:h.sector||'',shares:h.shares,average_purchase_price:h.avgCost,current_price:h.price,dividend_yield:h.dividendYield||0,notes:h.notes||''}))));
   if(next.transactions.length) jobs.push(supabase.from('transactions').insert(next.transactions.map(t=>({user_id:userId,transaction_date:t.date,transaction_type:t.type,ticker:t.ticker,quantity:t.quantity,price_per_share:t.price,fee:t.fee||0,total_value:t.usdValue||((t.quantity||0)*(t.price||0)),usd_value:t.usdValue||((t.quantity||0)*(t.price||0)),nzd_value:t.nzdValue||0,fx_rate:t.fxRate||0,fx_fee_nzd:t.fxFeeNzd||0,notes:t.notes||''}))));
   if(next.snapshots.length) jobs.push(supabase.from('portfolio_snapshots').insert(next.snapshots.map(s=>({user_id:userId,snapshot_date:s.date,portfolio_value:s.value,net_invested:s.deposits||0,total_return:0,notes:''}))));
   const result=await Promise.all(jobs); const err=result.find(x=>x.error)?.error; if(err) throw err;
  }catch(err){console.error('Valence cloud sync failed',err);}
  finally{setSyncing(false);}
 }
 const updateState=(next)=>{setState(next);localStorage.setItem(STORAGE,JSON.stringify(next));if(session)syncCloud(next)};
 const signOut=()=>supabase?.auth.signOut();
 const positions=useMemo(()=>state.holdings.map(h=>{const value=h.shares*h.price,cost=h.shares*h.avgCost;return {...h,value,cost,pl:value-cost,plPct:cost?((value-cost)/cost)*100:0}}),[state.holdings]);
 const totalInvested=positions.reduce((a,p)=>a+p.cost,0), totalValue=positions.reduce((a,p)=>a+p.value,0)+state.cash, unrealized=positions.reduce((a,p)=>a+p.pl,0), perfPct=totalInvested?unrealized/totalInvested*100:0, annualIncome=positions.reduce((a,p)=>a+p.value*((p.dividendYield||0)/100),0), allocation=positions.map(p=>({...p,weight:totalValue?p.value/totalValue*100:0})).sort((a,b)=>b.weight-a.weight);
 const saveJSON=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='valence-backup.json';a.click();URL.revokeObjectURL(a.href)};
 const importJSON=file=>{const r=new FileReader();r.onload=()=>{try{updateState(JSON.parse(r.result));alert('Imported.')}catch{alert('Invalid backup')}};r.readAsText(file)};
 const nav=p=>{setPage(p);setMenuOpen(false)};
 if(authLoading)return <div className="auth-screen"><div className="auth-card"><div className="brand auth-brand"><div className="brandmark">V</div><div><div className="brandname">VALENCE</div><div className="brandtag">PORTFOLIO OS</div></div></div><p>Connecting securely…</p></div></div>;
 if(!supabase)return <div className="auth-screen"><div className="auth-card"><h1>Valence configuration needed</h1><p>Supabase environment variables are missing from this deployment.</p></div></div>;
 if(!session)return <AuthScreen onReady={setSession}/>;
 return <div className="app"><aside className={`sidebar ${menuOpen?'open':''}`}><div className="brand"><div className="brandmark">V</div><div><div className="brandname">VALENCE</div><div className="brandtag">PORTFOLIO OS</div></div></div><nav><NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={page==='dashboard'} onClick={()=>nav('dashboard')}/><NavItem icon={<Wallet size={18}/>} label="Holdings" active={page==='holdings'} onClick={()=>nav('holdings')}/><NavItem icon={<ClipboardList size={18}/>} label="Transactions" active={page==='transactions'} onClick={()=>nav('transactions')}/><NavItem icon={<CalendarDays size={18}/>} label="Reports" active={page==='reports'} onClick={()=>nav('reports')}/></nav><div className="sidebar-bottom"><label className="side-link file-link"><Upload size={18}/>Import backup<input type="file" accept="application/json" onChange={e=>e.target.files[0]&&importJSON(e.target.files[0])}/></label><button className="side-link" onClick={saveJSON}><Download size={18}/>Export backup</button><button className="side-link" onClick={()=>{if(confirm('Reset to demo data?'))updateState({holdings:demoHoldings,transactions:demoTransactions,snapshots:demoSnapshots,cash:1240,currency:'USD'})}}><RefreshCw size={18}/>Reset demo</button><button className="side-link" onClick={signOut}><X size={18}/>Sign out</button><div className="sync-card"><ShieldCheck size={17}/><div><b>{syncing?'Syncing…':'Cloud synced'}</b><span>Portfolio saved to your Valence account.</span></div></div></div></aside><main className="main"><header className="topbar"><button className="iconbtn menu-btn" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={20}/></button><div className="crumb"><span>Portfolio</span><ChevronDown size={15}/><b>{page[0].toUpperCase()+page.slice(1)}</b></div><div className="top-actions"><div className="date-pill"><Activity size={15}/> Week of Sep 15, 2026</div><button className="iconbtn"><Bell size={18}/></button><button className="add-btn" onClick={()=>setModal('transaction')}><Plus size={17}/>Add</button></div></header><div className="content">{page==='dashboard'&&<Dashboard state={state} positions={positions} totalValue={totalValue} totalInvested={totalInvested} unrealized={unrealized} perfPct={perfPct} annualIncome={annualIncome} dayMove={0} allocation={allocation} chartData={state.snapshots} currency={currency} setModal={m=>m==='snapshot'?setSnapshotOpen(true):setModal(m)}/>} {page==='holdings'&&<Holdings state={state} positions={positions} totalValue={totalValue} currency={currency} updateState={updateState} setModal={setModal}/>} {page==='transactions'&&<Transactions state={state} currency={currency} setModal={setModal} updateState={updateState}/>} {page==='reports'&&<Reports state={state} currency={currency} positions={positions} totalValue={totalValue} totalInvested={totalInvested} unrealized={unrealized} allocation={allocation} chartData={state.snapshots} setModal={m=>m==='snapshot'?setSnapshotOpen(true):setModal(m)} updateState={updateState}/>}</div></main>{modal==='transaction'&&<TransactionModal state={state} currency={currency} onClose={()=>setModal(null)} onSave={tx=>{updateState({...state,transactions:[tx,...state.transactions]});setModal(null)}}/>}{modal==='holding'&&<HoldingModal onClose={()=>setModal(null)} onSave={h=>{updateState({...state,holdings:[...state.holdings,h]});setModal(null)}}/>}{snapshotOpen&&<SnapshotModal onClose={()=>setSnapshotOpen(false)} onSave={s=>{updateState({...state,snapshots:[...state.snapshots,s].sort((a,b)=>a.date.localeCompare(b.date))});setSnapshotOpen(false)}}/>}</div>
}
createRoot(document.getElementById('root')).render(<AppWithSnapshot/>);
