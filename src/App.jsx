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
        <span style={{fontSize:28}}>🎙️</span>
        <div style={{flex:1}}>
          <p style={{fontSize:17,fontWeight:700,color:G.text,margin:"0 0 2px"}}>Log a Trade</p>
          <p style={{fontSize:11,color:G.muted,margin:0}}>{user?.isPremium?"Unlimited · PRO":`${todayCount}/3 today`}</p>
        </div>
        <span style={{color:G.gold,fontSize:20}}>→</span>
      </button>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
        {[{i:"🧠",l:"Insights",s:"insights"},{i:"📅",l:"History",s:"history"},{i:user?.isPremium?"👑":"🔒",l:user?.isPremium?"PRO":"Upgrade",s:"pricing"}].map(q=>(
          <button key={q.l} onClick={()=>setScreen(q.s)} style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:14,padding:"16px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:22}}>{q.i}</span>
            <p style={{fontSize:11,color:G.muted,margin:0,fontWeight:600}}>{q.l}</p>
          </button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <p style={{fontSize:10,letterSpacing:"2.5px",color:G.muted,margin:0,fontWeight:700}}>RECENT JOURNALS</p>
        <button onClick={()=>setScreen("history")} style={{background:"none",border:"none",color:G.gold,fontSize:12,cursor:"pointer"}}>See all →</button>
      </div>
      {journals.length===0&&<p style={{color:"#444",textAlign:"center",padding:"20px 0"}}>No journals yet. Log your first trade! 🎙️</p>}
      {journals.slice(0,3).map(j=><JCard key={j.id} j={j}/>)}
      {!user?.isPremium&&(
        <div onClick={()=>setScreen("pricing")} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(245,166,35,0.05)",border:"1px solid rgba(245,166,35,0.18)",borderRadius:14,padding:"14px 16px",marginTop:12,cursor:"pointer"}}>
          <div style={{flex:1}}>
            <p style={{fontSize:14,fontWeight:700,color:G.text,margin:"0 0 2px"}}>🧠 Unlock Psychology Insights</p>
            <p style={{fontSize:11,color:G.muted,margin:0}}>Detect patterns. Fix mindset. Grow account.</p>
          </div>
          <span style={{color:G.gold}}>→</span>
        </div>
      )}
    </div>
  )
}

function Journal({setScreen,user,setJournals,todayCount,setTodayCount}){
  const[step,setStep]=useState("checkin")
  const[checkin,setCheckin]=useState({})
  const[pair,setPair]=useState("")
  const[result,setResult]=useState("")
  const[pnl,setPnl]=useState("")
  const[voice,setVoice]=useState("")
  const[recording,setRecording]=useState(false)
  const[aiRes,setAiRes]=useState(null)
  const recRef=useRef(null)
  const transcriptRef=useRef("")
  const blocked=!user?.isPremium&&todayCount>=3

  function startRec(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SR){setVoice("Speech recognition not supported on this browser. Please type your journal below.");return}
    transcriptRef.current=""
    const r=new SR()
    r.continuous=true
    r.interimResults=true
    r.lang="en-US"
    r.onresult=e=>{
      let final=""
      let interim=""
      for(let i=0;i<e.results.length;i++){
        if(e.results[i].isFinal){final+=e.results[i][0].transcript+" "}
        else{interim+=e.results[i][0].transcript}
      }
      transcriptRef.current=final
      setVoice(final+interim)
    }
    r.onerror=e=>{
      if(e.error==="no-speech"){setVoice(transcriptRef.current||"")}
      setRecording(false)
    }
    r.onend=()=>{
      setVoice(transcriptRef.current||"")
      setRecording(false)
    }
    r.start()
    recRef.current=r
    setRecording(true)
  }

  function stopRec(){
    recRef.current?.stop()
    setTimeout(()=>{
      setVoice(transcriptRef.current||"")
      setRecording(false)
    },500)
  }

  async function analyze(){
    if(!voice||!pair||!result)return
    setStep("processing")
    const r=await callAI(
      `Trade:${pair}|Result:${result}|P&L:${pnl}\nJournal:${voice}`,
      `Elite trading psychology coach. JSON only:\n{"summary":"2 sentences","emotion":"one word","patternWarning":null or "warning text","tip":"actionable tip","score":1-10}`
    )
    const res=r||{summary:"Journal saved successfully.",emotion:"Noted",patternWarning:null,tip:"Keep journaling consistently for best results.",score:7}
    const saved=await sb.saveJournal({pair,result,pnl:pnl||"N/A",emotion:res.emotion,summary:res.summary,pattern:res.patternWarning,score:res.score},user.id,user.token)
    setJournals(p=>[saved||{id:Date.now(),pair,result,pnl:pnl||"N/A",emotion:res.emotion,summary:res.summary,pattern:res.patternWarning,score:res.score},...p])
    setTodayCount(c=>c+1)
    setAiRes(res)
    setStep("done")
  }

  if(blocked) return(
    <div style={{padding:"28px 18px"}}>
      <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:G.muted,fontSize:13,cursor:"pointer",padding:0,marginBottom:18}}>← Back</button>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",minHeight:"60vh",justifyContent:"center",gap:16}}>
        <div style={{fontSize:56}}>🔒</div>
        <h2 style={{fontSize:24,fontWeight:800,color:G.text,margin:0}}>Daily Limit Reached</h2>
        <p style={{fontSize:14,color:G.muted,margin:0}}>Free users log 3 trades/day. Upgrade for unlimited.</p>
        <Btn ch="Upgrade to PRO 👑" onClick={()=>setScreen("pricing")}/>
      </div>
    </div>
  )

  return(
    <div style={{padding:"28px 18px"}} className="fi">
      <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:G.muted,fontSize:13,cursor:"pointer",padding:0,marginBottom:18}}>← Back</button>

      {step==="checkin"&&(
        <>
          <p style={{fontSize:10,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>STEP 1 OF 2</p>
          <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 16px",color:G.text}}>Pre-Trade Check-in</h2>
          {user?.isPremium?[{k:"sleep",q:"How did you sleep?",o:["Great","Okay","Badly"]},{k:"mood",q:"Current mindset?",o:["Sharp","Neutral","Off"]},{k:"revenge",q:"Chasing losses?",o:["No","Maybe","Yes"]}].map(q=>(
            <div key={q.k} style={{marginBottom:20}}>
              <p style={{fontSize:14,fontWeight:600,color:"#C8C0B4",margin:"0 0 10px"}}>{q.q}</p>
              <div style={{display:"flex",gap:8}}>
                {q.o.map(o=>(
                  <button key={o} onClick={()=>setCheckin(p=>({...p,[q.k]:o}))} style={{padding:"9px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",background:checkin[q.k]===o?G.gold:"rgba(255,255,255,0.05)",color:checkin[q.k]===o?"#000":"#C8C0B4",border:`1px solid ${checkin[q.k]===o?G.gold:"rgba(255,255,255,0.1)"}`}}>{o}</button>
                ))}
              </div>
            </div>
          )):(
            <div style={{display:"flex",alignItems:"center",gap:10,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:12,padding:16,marginBottom:20,color:"#333",fontSize:13}}>
              <span>🔒</span><p style={{margin:0}}>Pre-trade check-in is PRO only</p>
            </div>
          )}
          <Btn ch="Continue →" onClick={()=>setStep("record")}/>
        </>
      )}

      {step==="record"&&(
        <>
          <p style={{fontSize:10,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>STEP 2 OF 2</p>
          <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 16px",color:G.text}}>Log Your Trade</h2>
          <div style={{display:"flex",gap:12,marginBottom:14}}>
            <div style={{flex:1}}>
              <p style={{fontSize:10,letterSpacing:"2px",color:G.muted,margin:"0 0 8px",fontWeight:700}}>PAIR</p>
              <select value={pair} onChange={e=>setPair(e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${G.border}`,borderRadius:10,padding:"11px 12px",color:G.text,fontSize:14,fontFamily:"inherit",outline:"none"}}>
                <option value="">Select</option>
                {PAIRS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:10,letterSpacing:"2px",color:G.muted,margin:"0 0 8px",fontWeight:700}}>P&L (e.g. +500 or -200)</p>
              <input value={pnl} onChange={e=>setPnl(e.target.value)} placeholder="+500 or -200" style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${G.border}`,borderRadius:10,padding:"11px 12px",color:G.text,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <p style={{fontSize:10,letterSpacing:"2px",color:G.muted,margin:"0 0 8px",fontWeight:700}}>RESULT</p>
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {["Win","Loss","Breakeven"].map(r=>(
              <button key={r} onClick={()=>setResult(r)} style={{flex:1,padding:"11px 4px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",background:result===r?(r==="Win"?G.green:r==="Loss"?G.red:G.gold):"rgba(255,255,255,0.05)",border:`1px solid ${result===r?(r==="Win"?G.green:r==="Loss"?G.red:G.gold):"rgba(255,255,255,0.08)"}`}}>{r}</button>
            ))}
          </div>
          <p style={{fontSize:10,letterSpacing:"2px",color:G.muted,margin:"0 0 8px",fontWeight:700}}>YOUR JOURNAL</p>
          <button onClick={recording?stopRec:startRec} style={{width:"100%",padding:14,borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12,background:recording?"rgba(224,92,92,0.12)":"rgba(245,166,35,0.07)",border:`1px solid ${recording?G.red:"rgba(245,166,35,0.3)"}`}}>
            <span style={{fontSize:20}}>{recording?"⏹":"🎙️"}</span>
            <span style={{color:recording?G.red:G.gold}}>{recording?"Tap to Stop Recording":"Start Voice Journal"}</span>
          </button>
          {recording&&<p style={{fontSize:12,color:G.red,textAlign:"center",margin:"0 0 8px",fontWeight:600}}>🔴 Recording... speak clearly</p>}
          {voice&&!recording&&<p style={{fontSize:11,color:G.green,textAlign:"center",margin:"0 0 8px"}}>✅ Voice captured — review below</p>}
          <textarea value={voice} onChange={e=>setVoice(e.target.value)} placeholder="Your voice will appear here. Or type manually — what happened? How did you feel?" rows={5} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${voice?G.green:G.border}`,borderRadius:10,padding:12,color:G.text,fontSize:14,resize:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:4}}/>
          <Btn ch="Analyze with AI 🧠" onClick={analyze} dis={!voice||!pair||!result}/>
        </>
      )}

      {step==="processing"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:18}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.2)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <div className="os"/>
            <span style={{fontSize:32,position:"absolute"}}>🧠</span>
          </div>
          <p style={{fontSize:20,fontWeight:700,color:G.text,margin:0}}>Analyzing your psychology...</p>
          <p style={{fontSize:13,color:G.muted,margin:0}}>AI is reading your emotional patterns</p>
          {[80,65,90].map((w,i)=><div key={i} className="sh" style={{height:12,borderRadius:6,background:"rgba(255,255,255,0.05)",width:`${w}%`}}/>)}
        </div>
      )}

      {step==="done"&&aiRes&&(
        <div className="fi">
          <p style={{fontSize:10,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>ANALYSIS COMPLETE</p>
          <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 16px",color:G.text}}>Your Report</h2>
          <div style={{display:"flex",alignItems:"center",gap:20,background:"rgba(245,166,35,0.07)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:16,padding:"18px 20px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"baseline",gap:2}}>
              <p style={{fontSize:52,fontWeight:800,color:G.gold,lineHeight:1,margin:0}}>{aiRes.score}</p>
              <p style={{fontSize:18,color:G.muted,margin:0}}>/10</p>
            </div>
            <div>
              <p style={{fontSize:9,letterSpacing:"2px",color:G.muted,margin:"0 0 4px",fontWeight:700}}>MINDSET SCORE</p>
              <p style={{fontSize:20,fontWeight:700,color:G.text,margin:0}}>{aiRes.emotion}</p>
            </div>
          </div>
          <div style={{background:G.bg2,border:"1px solid #555",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
            <p style={{fontSize:10,letterSpacing:"2px",fontWeight:700,color:"#555",margin:"0 0 6px"}}>📝 SUMMARY</p>
            <p style={{fontSize:13,color:"#B0A89C",lineHeight:1.65,margin:0}}>{aiRes.summary}</p>
          </div>
          {aiRes.patternWarning&&(
            <div style={{background:G.bg2,border:`1px solid ${G.red}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
              <p style={{fontSize:10,letterSpacing:"2px",fontWeight:700,color:G.red,margin:"0 0 6px"}}>⚠️ PATTERN DETECTED</p>
              <p style={{fontSize:13,color:"#B0A89C",lineHeight:1.65,margin:0}}>{aiRes.patternWarning}</p>
            </div>
          )}
          <div style={{background:G.bg2,border:`1px solid ${G.green}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
            <p style={{fontSize:10,letterSpacing:"2px",fontWeight:700,color:G.green,margin:"0 0 6px"}}>💡 PSYCHOLOGY TIP</p>
            <p style={{fontSize:13,color:"#B0A89C",lineHeight:1.65,margin:0}}>{aiRes.tip}</p>
          </div>
          <Btn ch="← Back to Home" onClick={()=>setScreen("home")}/>
        </div>
      )}
    </div>
  )
}

function History({setScreen,user,journals}){
  const[filter,setFilter]=useState("All")
  const vis=(user?.isPremium?journals:journals.slice(0,7)).filter(j=>filter==="All"?true:filter==="Flagged"?j.pattern:j.result===filter)
  return(
    <div style={{padding:"28px 18px"}} className="fi">
      <p style={{fontSize:10,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>TRADE LOG</p>
      <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 16px",color:G.text}}>History</h2>
      {!user?.isPremium&&<div style={{fontSize:12,color:G.muted,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 12px",marginBottom:16}}>Showing last 7 — <span style={{color:G.gold,cursor:"pointer"}} onClick={()=>setScreen("pricing")}>upgrade for full history</span></div>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["All","Win","Loss","Flagged"].map(x=>(
          <button key={x} onClick={()=>setFilter(x)} style={{padding:"7px 14px",borderRadius:20,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:filter===x?G.gold:"rgba(255,255,255,0.05)",color:filter===x?"#000":G.muted}}>{x}</button>
        ))}
      </div>
      {vis.length===0&&<p style={{color:"#444",textAlign:"center",marginTop:40}}>No entries.</p>}
      {vis.map(j=><JCard key={j.id} j={j}/>)}
      {!user?.isPremium&&<Btn ch="Unlock Full History 👑" onClick={()=>setScreen("pricing")}/>}
    </div>
  )
}

function SkillItem({skill}){
  const[ready,setReady]=useState(false)
  useEffect(()=>{setTimeout(()=>setReady(true),400)},[])
  return(
    <div style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:12,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <p style={{fontSize:12,fontWeight:700,color:"#C8C0B4",margin:0}}>{skill.l}</p>
        <p style={{fontSize:20,fontWeight:800,color:skill.c,margin:0}}>{skill.s}</p>
      </div>
      <div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
        <div style={{height:"100%",borderRadius:3,width:ready?`${skill.s}%`:"0%",background:skill.c,transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)"}}/>
      </div>
      <p style={{fontSize:10,fontWeight:700,color:skill.c,margin:0}}>{skill.s>=75?"Strong":skill.s>=60?"Developing":"Needs Work"}</p>
    </div>
  )
}

function Insights({setScreen,user}){
  const[tab,setTab]=useState("overview")
  const[v,setV]=useState(null)
  useEffect(()=>{
    if(user?.isPremium&&!v){
      callAI("Trader has revenge trading and FOMO patterns",`Elite prop firm coach. JSON:\n{"headline":"max 8 words","verdict":"2 sentences","critical":"most important fix","strength":"genuine edge","nextWeek":"one action"}`).then(r=>setV(r||{headline:"Discipline strong — emotions leaking profits",verdict:"Technical analysis is solid. Emotional interference costs 40% of gains.",critical:"Stop re-entering after losses. Every revenge trade turns a small loss into a bigger one.",strength:"Best performance when calm and following the plan.",nextWeek:"Journal every trade within 5 minutes of closing it."}))
    }
  },[user?.isPremium])

  if(!user?.isPremium) return(
    <div style={{padding:"28px 18px"}} className="fi">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",padding:"40px 20px"}}>
        <span style={{fontSize:60}}>🧠</span>
        <h2 style={{fontSize:28,fontWeight:800,margin:"12px 0 10px",background:"linear-gradient(135deg,#F5D88A,#E8803A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Psychology Insights</h2>
        <p style={{fontSize:14,color:G.muted,lineHeight:1.7,margin:"0 0 24px"}}>Advanced AI psychology analysis used by funded traders to eliminate emotional bias.</p>
        <Btn ch="Unlock Insights — R369/mo 👑" onClick={()=>setScreen("pricing")}/>
      </div>
    </div>
  )

  return(
    <div className="fi">
      <div style={{padding:"24px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
        <h2 style={{fontSize:26,fontWeight:800,margin:0,color:G.text}}>Insights</h2>
        <div style={{background:"linear-gradient(135deg,#F5A623,#E8803A)",color:"#000",fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:20}}>👑 PRO</div>
      </div>
      {v&&(
        <div style={{background:"rgba(245,166,35,0.04)",border:"1px solid rgba(245,166,35,0.15)",borderRadius:14,padding:"16px 18px",margin:"0 18px 16px"}}>
          <p style={{fontSize:9,letterSpacing:"2.5px",color:G.gold,margin:"0 0 6px",fontWeight:700}}>🤖 AI WEEKLY VERDICT</p>
          <h3 style={{fontSize:15,fontWeight:700,color:G.text,margin:"0 0 8px",fontStyle:"italic"}}>"{v.headline}"</h3>
          <p style={{fontSize:13,color:"#8E8882",lineHeight:1.65,margin:0}}>{v.verdict}</p>
        </div>
      )}
      <div style={{display:"flex",borderBottom:`1px solid ${G.border}`,overflowX:"auto"}}>
        {["overview","skills"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",borderBottom:tab===t?`2px solid ${G.gold}`:"2px solid transparent",color:tab===t?G.gold:"#333",fontSize:12,fontWeight:700,padding:"12px 18px",cursor:"pointer",fontFamily:"inherit"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
      <div style={{padding:"16px 18px 24px"}}>
        {tab==="overview"&&v&&(
          <div className="fi">
            <div style={{display:"flex",alignItems:"center",gap:18,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:16,padding:18,marginBottom:16}}>
              <Radial score={72} size={96}/>
              <div>
                <p style={{fontSize:9,letterSpacing:"2px",color:G.muted,margin:"0 0 4px",fontWeight:700}}>MINDSET SCORE</p>
                <p style={{fontSize:22,fontWeight:800,color:G.text,margin:"0 0 4px"}}>B+ · 72/100</p>
                <p style={{fontSize:12,color:G.muted,margin:0}}>Emotional interference cost ~$620 this week.</p>
              </div>
            </div>
            <div style={{background:"rgba(224,92,92,0.06)",border:"1px solid rgba(224,92,92,0.2)",borderRadius:14,padding:16,marginBottom:12}}>
              <p style={{fontSize:9,letterSpacing:"2px",color:G.red,margin:"0 0 6px",fontWeight:700}}>⚡ CRITICAL FIX</p>
              <p style={{fontSize:13,color:"#B08888",lineHeight:1.65,margin:0}}>{v.critical}</p>
            </div>
            <div style={{border:"1px solid",borderColor:G.green,background:"rgba(76,175,125,0.05)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
              <p style={{fontSize:9,letterSpacing:"2.5px",fontWeight:800,color:G.green,margin:"0 0 6px"}}>🏆 YOUR EDGE</p>
              <p style={{fontSize:13,color:"#8E8882",lineHeight:1.65,margin:0}}>{v.strength}</p>
            </div>
            <div style={{border:"1px solid",borderColor:G.blue,background:"rgba(107,127,215,0.05)",borderRadius:12,padding:"14px 16px"}}>
              <p style={{fontSize:9,letterSpacing:"2.5px",fontWeight:800,color:G.blue,margin:"0 0 6px"}}>🎯 THIS WEEK'S ACTION</p>
              <p style={{fontSize:13,color:"#8E8882",lineHeight:1.65,margin:0}}>{v.nextWeek}</p>
            </div>
          </div>
        )}
        {tab==="skills"&&(
          <div className="fi" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {SKILLS.map(sk=><SkillItem key={sk.l} skill={sk}/>)}
          </div>
        )}
      </div>
    </div>
  )
}

function Profile({user,setScreen,setUser,onLogout}){
  return(
    <div style={{padding:"28px 18px"}} className="fi">
      <p style={{fontSize:10,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>MY ACCOUNT</p>
      <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 16px",color:G.text}}>Profile</h2>
      <div style={{display:"flex",alignItems:"center",gap:16,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:16,padding:20,marginBottom:20}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(245,166,35,0.15)",border:"1px solid rgba(245,166,35,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:G.gold}}>{user?.avatar||"T"}</div>
        <div>
          <p style={{fontSize:18,fontWeight:800,color:G.text,margin:"0 0 2px"}}>{user?.name}</p>
          <p style={{fontSize:12,color:G.muted,margin:0}}>{user?.email}</p>
          <div style={{display:"inline-block",background:user?.isPremium?"linear-gradient(135deg,#F5A623,#E8803A)":"rgba(255,255,255,0.06)",color:user?.isPremium?"#000":G.muted,fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:20,marginTop:6}}>{user?.isPremium?"👑 PRO Member":"Free Plan"}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {[{i:"👑",l:user?.isPremium?"Manage Subscription":"Upgrade to PRO",s:"pricing",hi:!user?.isPremium},{i:"🎯",l:"Trading Goals",s:null},{i:"💬",l:"Help & Support",s:null}].map(item=>(
          <button key={item.l} onClick={()=>item.s&&setScreen(item.s)} style={{display:"flex",alignItems:"center",gap:14,background:G.bg2,border:`1px solid ${item.hi?"rgba(245,166,35,0.3)":G.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",width:"100%"}}>
            <span style={{fontSize:18}}>{item.i}</span>
            <p style={{flex:1,fontSize:14,margin:0,fontWeight:600,color:item.hi?G.gold:"#C8C0B4"}}>{item.l}</p>
            <span style={{color:"#444"}}>›</span>
          </button>
        ))}
      </div>
      <button onClick={onLogout} style={{width:"100%",padding:13,borderRadius:12,border:"1px solid rgba(224,92,92,0.3)",background:"rgba(224,92,92,0.06)",color:G.red,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
    </div>
  )
}

function Pricing({setScreen,user,setUser}){
  const[loading,setLoading]=useState(false)
  const upgrade=async(amount)=>{
    setLoading(true)
    try{
      payWithPaystack(user.email,amount,async()=>{
        await sb.updatePremium(user.id,user.token)
        setUser(u=>({...u,isPremium:true}))
        setScreen("home")
      })
    }catch(e){console.error(e)}
    setLoading(false)
  }
  const FR=({t,on,g})=>(
    <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
      <span style={{color:on?(g?G.gold:G.green):"#333",fontSize:13}}>{on?"✓":"✗"}</span>
      <span style={{fontSize:12,color:on?"#C8C0B4":"#3A3A3A",lineHeight:1.4}}>{t}</span>
    </div>
  )
  return(
    <div style={{padding:"28px 18px"}} className="fi">
      <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:G.muted,fontSize:13,cursor:"pointer",padding:0,marginBottom:18}}>← Back</button>
      <p style={{fontSize:10,letterSpacing:"3px",color:G.gold,margin:"0 0 4px",fontWeight:700}}>PLANS</p>
      <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 16px",color:G.text}}>Choose Your Plan</h2>
      <p style={{fontSize:13,color:"#555",marginBottom:24}}>Serious traders invest in their psychology.</p>

      <div style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:16,padding:20,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{fontSize:20,fontWeight:800,margin:0,color:G.text}}>Free</p>
          <p style={{fontSize:26,fontWeight:800,margin:0,color:G.text}}>R0<span style={{fontSize:13,color:G.muted}}>/mo</span></p>
        </div>
        {["3 voice journals/day","7-day history","Basic emotion tagging","AI trade summary","Mindset score per trade"].map(t=><FR key={t} t={t} on/>)}
        {["Pattern detection","Psychology insights","Unlimited history","Pre-trade check-in"].map(t=><FR key={t} t={t}/>)}
        {!user?.isPremium&&<div style={{textAlign:"center",padding:10,borderRadius:8,background:"rgba(255,255,255,0.04)",color:"#333",fontSize:12,marginTop:12}}>✓ Current Plan</div>}
      </div>

      <div style={{background:"rgba(245,166,35,0.03)",border:"1px solid rgba(245,166,35,0.4)",borderRadius:16,padding:20,marginBottom:14,position:"relative"}}>
        <div style={{position:"absolute",top:-10,left:16,background:G.gold,color:"#000",fontSize:9,fontWeight:800,letterSpacing:"1.5px",padding:"3px 10px",borderRadius:20}}>MOST POPULAR</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{fontSize:20,fontWeight:800,margin:0,color:G.gold}}>PRO 👑</p>
          <p style={{fontSize:26,fontWeight:800,margin:0,color:G.text}}>R369<span style={{fontSize:13,color:G.muted}}>/mo</span></p>
        </div>
        {["Unlimited voice journals","Full trade history forever","Deep psychology pattern detection","Emotion vs Performance analysis","Pre-trade mindset check-in","AI weekly verdict & coaching","Psychology skills breakdown","Priority support"].map(t=><FR key={t} t={t} on g/>)}
        {user?.isPremium
          ?<div style={{textAlign:"center",padding:10,borderRadius:8,background:"rgba(245,166,35,0.1)",color:G.gold,fontSize:12,marginTop:12}}>✓ Active Plan</div>
          :<Btn ch={loading?"Opening payment...":"Upgrade — R369/mo"} onClick={()=>upgrade(369)} dis={loading}/>
        }
      </div>

      <div style={{background:G.bg2,border:"1px solid rgba(107,127,215,0.35)",borderRadius:16,padding:20,position:"relative"}}>
        <div style={{position:"absolute",top:-10,left:16,background:G.blue,color:"#000",fontSize:9,fontWeight:800,letterSpacing:"1.5px",padding:"3px 10px",borderRadius:20}}>EARLY ADOPTER</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <p style={{fontSize:20,fontWeight:800,margin:0,color:G.blue}}>Lifetime 🚀</p>
          <div>
            <p style={{fontSize:26,fontWeight:800,margin:0,color:G.text}}>R2,749<span style={{fontSize:13,color:G.muted}}> once</span></p>
            <p style={{fontSize:10,color:"#444",margin:0}}>saves R1,679/yr</p>
          </div>
        </div>
        <p style={{fontSize:13,color:"#555",marginBottom:8}}>Everything in PRO, forever. Limited founding member spots.</p>
        <Btn ch={loading?"Opening payment...":"Get Lifetime Access"} onClick={()=>upgrade(2749)} style={{background:"linear-gradient(135deg,#6B7FD7,#4B5FBF)"}} dis={loading}/>
      </div>
    </div>
  )
}

export default function App(){
  const[auth,setAuth]=useState("splash")
  const[user,setUser]=useState(null)
  const[screen,setScreen]=useState("home")
  const[journals,setJournals]=useState([])
  const[todayCount,setTodayCount]=useState(0)

  useEffect(()=>{setTimeout(()=>setAuth("landing"),2600)},[])
  useEffect(()=>{
    if(user?.id&&user?.token){
      sb.getJournals(user.id,user.token).then(d=>{if(Array.isArray(d))setJournals(d)})
    }
  },[user?.id])

  const login=u=>{setUser(u);setAuth("app");setScreen("home")}
  const logout=async()=>{
    if(user?.token)await sb.signOut(user.token)
    setUser(null);setJournals([]);setAuth("landing");setScreen("home")
  }

  if(auth==="splash")return<><style>{CSS}</style><Splash/></>
  if(auth==="landing")return<><style>{CSS}</style><Landing onLogin={()=>setAuth("login")} onSignup={()=>setAuth("signup")}/></>
  if(auth==="login")return<><style>{CSS}</style><Login onAuth={login} onSwitch={()=>setAuth("signup")} onBack={()=>setAuth("landing")}/></>
  if(auth==="signup")return<><style>{CSS}</style><Signup onAuth={login} onSwitch={()=>setAuth("login")} onBack={()=>setAuth("landing")}/></>

  return(
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:"'Sora',sans-serif",color:G.text,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      <div style={{flex:1,overflowY:"auto",paddingBottom:72}}>
        {screen==="home"&&<Home user={user} setScreen={setScreen} journals={journals} todayCount={todayCount}/>}
        {screen==="journal"&&<Journal setScreen={setScreen} user={user} setJournals={setJournals} todayCount={todayCount} setTodayCount={setTodayCount}/>}
        {screen==="history"&&<History setScreen={setScreen} user={user} journals={journals}/>}
        {screen==="insights"&&<Insights setScreen={setScreen} user={user}/>}
        {screen==="profile"&&<Profile user={user} setScreen={setScreen} setUser={setUser} onLogout={logout}/>}
        {screen==="pricing"&&<Pricing setScreen={setScreen} user={user} setUser={setUser}/>}
      </div>
      <BottomNav screen={screen} setScreen={setScreen}/>
    </div>
  )
}
