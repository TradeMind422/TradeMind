import{useState,useEffect,useRef}from"react"
const U="https://jswdoliandcucnqzjflh.supabase.co"
const K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd2RvbGlhbmRjdWNucXpqZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTcxOTcsImV4cCI6MjA5MzI5MzE5N30.4ZvcytBkX1CPtUsxGbburoLh8srrz9oAfEmEFSlaUNE"
const PK="pk_test_a10d9eeacc050f75a9c83b07dd1534202c7c87c5"
const H={"Content-Type":"application/json","apikey":K,"Authorization":`Bearer ${K}`}
const sb={
  signUp:(e,p,n)=>fetch(`${U}/auth/v1/signup`,{method:"POST",headers:H,body:JSON.stringify({email:e,password:p,data:{name:n}})}).then(r=>r.json()),
  signIn:(e,p)=>fetch(`${U}/auth/v1/token?grant_type=password`,{method:"POST",headers:H,body:JSON.stringify({email:e,password:p})}).then(r=>r.json()),
  signOut:(t)=>fetch(`${U}/auth/v1/logout`,{method:"POST",headers:{...H,"Authorization":`Bearer ${t}`}}),
  getProfile:(id,t)=>fetch(`${U}/rest/v1/profiles?id=eq.${id}`,{headers:{...H,"Authorization":`Bearer ${t}`}}).then(r=>r.json()).then(d=>d[0]||null),
  createProfile:(id,n,e,t)=>fetch(`${U}/rest/v1/profiles`,{method:"POST",headers:{...H,"Authorization":`Bearer ${t}`,"Prefer":"return=minimal"},body:JSON.stringify({id,name:n,email:e,is_premium:false})}),
  getJournals:(id,t)=>fetch(`${U}/rest/v1/journals?user_id=eq.${id}&order=created_at.desc`,{headers:{...H,"Authorization":`Bearer ${t}`}}).then(r=>r.json()),
  saveJournal:(j,id,t)=>fetch(`${U}/rest/v1/journals`,{method:"POST",headers:{...H,"Authorization":`Bearer ${t}`,"Prefer":"return=representation"},body:JSON.stringify({...j,user_id:id})}).then(r=>r.json()).then(d=>d[0]),
  updatePremium:(id,t)=>fetch(`${U}/rest/v1/profiles?id=eq.${id}`,{method:"PATCH",headers:{...H,"Authorization":`Bearer ${t}`},body:JSON.stringify({is_premium:true})}),
}

async function callAI(u,s){
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:s,messages:[{role:"user",content:u}]})})
    const d=await r.json()
    return JSON.parse(d.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim())
  }catch{return null}
}

function payWithPaystack(email,amount,onSuccess){
  if(!window.PaystackPop){alert("Payment system loading, please try again.");return}
  const handler=window.PaystackPop.setup({
    key:PK,email,amount:amount*100,currency:"ZAR",
    ref:`TM_${Date.now()}`,
    callback:(response)=>{if(response.status==="success"||response.status==="completed")onSuccess(response)},
    onClose:()=>{}
  })
  handler.openIframe()
}

// ── Fix PnL calculation — handles -500, +500, 500 correctly
function calcPnl(journals){
  return journals.reduce((a,j)=>{
    const raw=(j.pnl||"0").toString().trim()
    const isNeg=raw.startsWith("-")||j.result==="Loss"
    const n=Math.abs(parseFloat(raw.replace(/[^0-9.]/g,""))||0)
    return a+(isNeg?-n:n)
  },0)
}

const G={gold:"#F5A623",green:"#4CAF7D",red:"#E05C5C",blue:"#6B7FD7",bg:"#07090E",bg2:"rgba(255,255,255,0.03)",border:"rgba(255,255,255,0.07)",text:"#E8E0D5",muted:"#6B6B7E"}
const PAIRS=["EUR/USD","GBP/USD","XAU/USD","NAS100","BTC/USD","US30","USD/JPY","Other"]
const SKILLS=[{l:"Discipline",s:74,c:"#4CAF7D"},{l:"Risk Mgmt",s:58,c:"#F5A623"},{l:"Patience",s:81,c:"#4CAF7D"},{l:"Execution",s:67,c:"#F5A623"},{l:"Psychology",s:53,c:"#E05C5C"},{l:"Consistency",s:70,c:"#4CAF7D"}]
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');*{box-sizing:border-box}body{margin:0;background:#07090E;font-family:'Sora',sans-serif}@keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi 0.4s ease forwards}@keyframes si{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}.si{animation:si 0.6s ease forwards}@keyframes sl{from{width:0}to{width:100%}}.sl{animation:sl 2.2s ease forwards}@keyframes pp{0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,0.3)}50%{box-shadow:0 0 0 18px rgba(245,166,35,0)}}.pp{animation:pp 2s ease-in-out infinite}@keyframes sh{0%,100%{opacity:0.4}50%{opacity:0.9}}.sh{animation:sh 1.4s ease-in-out infinite}.sh:nth-child(2){animation-delay:.2s}.sh:nth-child(3){animation-delay:.4s}@keyframes os{to{transform:rotate(360deg)}}.os{position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(245,166,35,0.2);border-top:2px solid #F5A623;animation:os 1s linear infinite}.btn{transition:all 0.2s ease}.btn:hover{opacity:0.88;transform:translateY(-2px)}input:focus{border-color:rgba(245,166,35,0.4)!important}::-webkit-scrollbar{width:0}select option{background:#0D0F14}`

function Btn({ch,onClick,style={},dis=false}){
  return <button onClick={onClick} disabled={dis} className="btn" style={{width:"100%",padding:"15px",borderRadius:12,border:"none",background:dis?"#333":"linear-gradient(135deg,#F5A623,#E8803A)",color:dis?"#666":"#000",fontSize:15,fontWeight:800,cursor:dis?"not-allowed":"pointer",fontFamily:"inherit",marginTop:12,...style}}>{ch}</button>
}

function JCard({j}){
  const d=j.created_at?new Date(j.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):j.date||"Today"
  const isLoss=j.result==="Loss"||(j.pnl||"").toString().startsWith("-")
  return(
    <div style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <p style={{fontSize:15,fontWeight:800,color:G.text,margin:0}}>{j.pair}</p>
          <span style={{fontSize:11,fontWeight:700,color:j.result==="Win"?G.green:j.result==="Loss"?G.red:G.gold}}>{j.result}</span>
        </div>
        <div style={{textAlign:"right"}}>
          <p style={{fontSize:15,fontWeight:800,color:isLoss?G.red:G.green,margin:"0 0 2px"}}>{j.pnl}</p>
          <p style={{fontSize:10,color:"#333",margin:0}}>{d}</p>
        </div>
      </div>
      <span style={{display:"inline-block",background:"rgba(255,255,255,0.05)",borderRadius:6,padding:"2px 8px",fontSize:11,color:G.muted,marginBottom:4}}>{j.emotion}</span>
      {j.score&&<div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,marginBottom:4,overflow:"hidden"}}><div style={{height:"100%",width:`${j.score*10}%`,background:j.score>=7?G.green:j.score>=5?G.gold:G.red}}/></div>}
      {j.summary&&<p style={{fontSize:13,color:"#7A7268",lineHeight:1.5,margin:0}}>{j.summary}</p>}
      {j.pattern&&<p style={{fontSize:12,color:G.red,margin:"4px 0 0"}}>{j.pattern}</p>}
    </div>
  )
}

function Radial({score,size=84}){
  const r=(size/2)-8,c=2*Math.PI*r,f=c*(score/100)
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#rg)" strokeWidth={6} strokeDasharray={`${f} ${c}`} strokeLinecap="round"/>
        <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#F5A623"/><stop offset="100%" stopColor="#E8803A"/></linearGradient></defs>
      </svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
        <p style={{fontSize:size>90?22:16,fontWeight:800,color:G.gold,margin:0,lineHeight:1}}>{score}</p>
      </div>
    </div>
  )
}

function BottomNav({screen,setScreen}){
  const T=[{id:"home",i:"🏠",l:"Home"},{id:"journal",i:"🎙️",l:"Journal"},{id:"history",i:"📅",l:"History"},{id:"insights",i:"🧠",l:"Insights"},{id:"profile",i:"👤",l:"Profile"}]
  return(
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(7,9,14,0.97)",borderTop:`1px solid ${G.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 18px",zIndex:100}}>
      {T.map(t=>(
        <button key={t.id} onClick={()=>setScreen(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:"4px 10px",fontFamily:"inherit",position:"relative"}}>
          <span style={{fontSize:20}}>{t.i}</span>
          <span style={{fontSize:9,marginTop:3,fontWeight:600,color:screen===t.id?G.gold:"#3A3A3A"}}>{t.l}</span>
          {screen===t.id&&<div style={{width:4,height:4,background:G.gold,borderRadius:"50%",position:"absolute",bottom:-6}}/>}
        </button>
      ))}
    </div>
  )
}

function Splash(){
  return(
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:400,height:400,background:"radial-gradient(circle,rgba(245,166,35,0.15),transparent 70%)",top:"30%",left:"50%",transform:"translate(-50%,-50%)"}}/>
      <div className="si" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,position:"relative"}}>
        <div className="pp" style={{width:96,height:96,borderRadius:"50%",background:"rgba(245,166,35,0.1)",border:"1px solid rgba(245,166,35,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:42}}>📈</span>
        </div>
        <h1 style={{fontSize:40,fontWeight:800,margin:0,background:"linear-gradient(135deg,#F5D88A,#E8803A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TradeMind</h1>
        <p style={{fontSize:11,letterSpacing:"4px",color:G.muted,margin:0}}>AI TRADING PSYCHOLOGY</p>
        <div style={{width:140,height:2,background:"rgba(255,255,255,0.06)",borderRadius:1,marginTop:20,overflow:"hidden"}}>
          <div className="sl" style={{height:"100%",background:"linear-gradient(90deg,#F5A623,#E8803A)"}}/>
        </div>
      </div>
    </div>
  )
}

function Landing({onLogin,onSignup}){
  return(
    <div style={{minHeight:"100vh",background:G.bg,overflowY:"auto"}}>
      <div style={{padding:"48px 22px 60px",maxWidth:480,margin:"0 auto"}} className="fi">
        <div style={{display:"inline-block",background:"rgba(245,166,35,0.1)",border:"1px solid rgba(245,166,35,0.3)",borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:700,color:G.gold,marginBottom:24}}>🔥 USED BY PROP FIRM TRADERS</div>
        <h1 style={{fontSize:34,fontWeight:800,lineHeight:1.15,margin:"0 0 16px",color:G.text}}>Stop Losing Money To Your <span style={{color:G.gold}}>Emotions</span></h1>
        <p style={{fontSize:15,color:G.muted,lineHeight:1.75,margin:"0 0 28px"}}>The first AI voice journal built for forex traders. Speak your trades, fix your psychology, grow your account.</p>
        <div style={{display:"flex",justifyContent:"space-around",background:G.bg2,border:`1px solid ${G.border}`,borderRadius:16,padding:"18px 10px",marginBottom:24}}>
          {[{v:"2,400+",l:"Active Traders"},{v:"94%",l:"Improved Win Rate"},{v:"$1.2M",l:"Losses Prevented"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <p style={{fontSize:22,fontWeight:800,color:G.gold,margin:"0 0 2px"}}>{s.v}</p>
              <p style={{fontSize:10,color:G.muted,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
        <Btn ch="Start Free — No Card Needed →" onClick={onSignup}/>
        <button onClick={onLogin} style={{width:"100%",background:"none",border:"none",color:G.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8,marginBottom:32}}>Already have an account? Sign in</button>
        <div style={{background:"rgba(245,166,35,0.04)",border:"1px solid rgba(245,166,35,0.15)",borderRadius:14,padding:18,marginBottom:28}}>
          <p style={{fontSize:14,color:"#C8C0B4",lineHeight:1.7,margin:"0 0 10px",fontStyle:"italic"}}>"I was revenge trading every week and didn't realise it until TradeMind showed me. Drawdown dropped 60% in 3 weeks."</p>
          <p style={{fontSize:11,color:G.muted,margin:0,fontWeight:700}}>— Marcus T. · FTMO Funded Trader · $200K</p>
        </div>
        <Btn ch="Join 2,400+ Traders →" onClick={onSignup}/>
        <p style={{color:"#333",fontSize:11,textAlign:"center",marginTop:10}}>Free forever · Cancel PRO anytime</p>
      </div>
    </div>
  )
}

function AuthWrap({title,sub,onBack,children}){
  return(
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div className="fi" style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:20,padding:"32px 24px",width:"100%",maxWidth:400}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:G.muted,fontSize:13,cursor:"pointer",padding:0,marginBottom:20}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <span style={{fontSize:26}}>📈</span>
          <span style={{fontSize:20,fontWeight:800,background:"linear-gradient(135deg,#F5D88A,#E8803A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TradeMind</span>
        </div>
        <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 4px",color:G.text}}>{title}</h2>
        <p style={{fontSize:13,color:G.muted,margin:"0 0 24px"}}>{sub}</p>
        {children}
      </div>
    </div>
  )
}

function FInput({label,type,value,onChange,placeholder}){
  return(
    <div style={{marginBottom:16}}>
      <p style={{fontSize:10,letterSpacing:"1.5px",color:G.muted,margin:"0 0 6px",fontWeight:700}}>{label}</p>
      <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${G.border}`,borderRadius:10,padding:"12px 14px",color:G.text,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>
    </div>
  )
}

function Login({onAuth,onSwitch,onBack}){
  const[email,setEmail]=useState("")
  const[pw,setPw]=useState("")
  const[loading,setLoading]=useState(false)
  const[err,setErr]=useState("")
  const go=async()=>{
    if(!email||!pw){setErr("Fill in all fields.");return}
    setLoading(true);setErr("")
    const r=await sb.signIn(email,pw)
    if(r.error||!r.access_token){setErr(r.error?.message||"Invalid credentials.");setLoading(false);return}
    const prof=await sb.getProfile(r.user.id,r.access_token)
    onAuth({id:r.user.id,name:prof?.name||email.split("@")[0],email,avatar:(prof?.name||email)[0].toUpperCase(),token:r.access_token,isPremium:prof?.is_premium||false})
  }
  return(
    <AuthWrap title="Welcome back" sub="Sign in to your account" onBack={onBack}>
      <FInput label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@email.com"/>
      <FInput label="PASSWORD" type="password" value={pw} onChange={setPw} placeholder="••••••••"/>
      {err&&<p style={{color:G.red,fontSize:12,margin:"0 0 10px",textAlign:"center"}}>{err}</p>}
      <Btn ch={loading?"Signing in...":"Sign In →"} onClick={go} dis={loading}/>
      <p style={{fontSize:13,color:G.muted,textAlign:"center",margin:"12px 0 0"}}>No account? <span style={{color:G.gold,cursor:"pointer",fontWeight:700}} onClick={onSwitch}>Sign up free</span></p>
    </AuthWrap>
  )
}

function Signup({onAuth,onSwitch,onBack}){
  const[name,setName]=useState("")
  const[email,setEmail]=useState("")
  const[pw,setPw]=useState("")
  const[loading,setLoading]=useState(false)
  const[err,setErr]=useState("")
  const go=async()=>{
    if(!name||!email||!pw){setErr("Fill in all fields.");return}
    if(pw.length<6){setErr("Password min 6 chars.");return}
    setLoading(true);setErr("")
    const r=await sb.signUp(email,pw,name)
    if(r.error){setErr(r.error.message);setLoading(false);return}
    if(r.user){
      const t=r.session?.access_token||r.access_token
      if(t)await sb.createProfile(r.user.id,name,email,t)
      onAuth({id:r.user.id,name,email,avatar:name[0].toUpperCase(),token:t||"",isPremium:false})
    }else{setErr("Check your email to confirm then sign in.");setLoading(false)}
  }
  return(
    <AuthWrap title="Create account" sub="Join 2,400+ traders" onBack={onBack}>
      <FInput label="NAME" type="text" value={name} onChange={setName} placeholder="Your name"/>
      <FInput label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@email.com"/>
      <FInput label="PASSWORD" type="password" value={pw} onChange={setPw} placeholder="Min 6 characters"/>
      {err&&<p style={{color:G.red,fontSize:12,margin:"0 0 10px",textAlign:"center"}}>{err}</p>}
      <Btn ch={loading?"Creating...":"Create Account →"} onClick={go} dis={loading}/>
      <p style={{fontSize:13,color:G.muted,textAlign:"center",margin:"12px 0 0"}}>Have account? <span style={{color:G.gold,cursor:"pointer",fontWeight:700}} onClick={onSwitch}>Sign in</span></p>
    </AuthWrap>
  )
}

function Home({user,setScreen,journals,todayCount}){
  const wins=journals.filter(j=>j.result==="Win").length
  const wr=journals.length?Math.round(wins/journals.length*100):0
  const pnl=calcPnl(journals)
  return(
    <div style={{padding:"28px 18px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <p style={{fontSize:10,letterSpacing:"2.5px",color:G.muted,margin:"0 0 2px",fontWeight:700}}>GOOD MORNING 🌅</p>
          <h2 style={{fontSize:28,fontWeight:800,margin:0,background:"linear-gradient(135deg,#F5D88A,#E8803A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Hey, {user?.name?.split(" ")[0]||"Trader"}</h2>
        </div>
        <div onClick={()=>setScreen("profile")} style={{width:44,height:44,borderRadius:"50%",background:"rgba(245,166,35,0.15)",border:"1px solid rgba(245,166,35,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
          <span style={{fontSize:18,fontWeight:800,color:G.gold}}>{user?.avatar||"T"}</span>
          {user?.isPremium&&<div style={{position:"absolute",top:-8,right:-6,fontSize:14}}>👑</div>}
        </div>
      </div>
      <div className="fi" style={{background:"linear-gradient(135deg,rgba(245,166,35,0.08),rgba(232,128,58,0.04))",border:"1px solid rgba(245,166,35,0.2)",borderRadius:18,padding:20,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden"}}>
        <div>
          <p style={{fontSize:9,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>TODAY'S MINDSET SCORE</p>
          <p style={{fontSize:48,fontWeight:800,color:G.gold,lineHeight:1,margin:"0 0 2px"}}>72<span style={{fontSize:18,color:G.muted,fontWeight:400}}>/100</span></p>
          <p style={{fontSize:12,color:G.muted,margin:0}}>B+ · Above Average</p>
        </div>
        <Radial score={72} size={84}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {[
          {v:`${wr}%`,l:"Win Rate",c:G.green},
          {v:pnl>=0?`+$${Math.round(pnl)}`:`-$${Math.abs(Math.round(pnl))}`,l:"P&L",c:pnl>=0?G.green:G.red},
          {v:`${journals.length}🔥`,l:"Streak",c:G.gold},
          {v:journals.length,l:"Journals",c:G.blue}
        ].map(s=>(
          <div key={s.l} style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:12,padding:"12px 6px",textAlign:"center"}}>
            <p style={{fontSize:14,fontWeight:800,color:s.c,margin:"0 0 2px"}}>{s.v}</p>
            <p style={{fontSize:9,color:G.muted,margin:0}}>{s.l}</p>
          </div>
        ))}
      </div>
      <button onClick={()=>setScreen("journal")} className="btn" style={{width:"100%",background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.25)",borderRadius:16,padding:18,display:"flex",alignItems:"center",gap:14,cursor:"pointer",marginBottom:16,textAlign:"left"}}>
        <span style={{fontSize:28}
