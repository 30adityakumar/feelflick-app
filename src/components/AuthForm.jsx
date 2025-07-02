//  src/components/AuthForm.jsx
import { useState }    from "react";
import { useNavigate } from "react-router-dom";
import { supabase }    from "../supabaseClient";
import { FcGoogle }    from "react-icons/fc";

/* ────────────────────────────────────────── */
/*  One reusable input style                 */
const inputStyle = {
  margin: "8px 0",
  padding: "12px 11px",
  borderRadius: 8,
  border: "none",
  fontSize: 14.8,
  background: "#232330",
  color: "#fff",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  outline: "none",
  boxShadow: "0 1.5px 8px 0 #0004",
};
/* ────────────────────────────────────────── */

export default function AuthForm ({ mode = "sign-in", onSwitchMode }) {
  const isSignUp       = mode === "sign-up";
  const navigate       = useNavigate();

  /* form state */
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [name, setName]                   = useState("");
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [showReset, setShowReset]         = useState(false);
  const [resetEmail, setResetEmail]       = useState("");
  const [resetError, setResetError]       = useState("");
  const [resetSent,  setResetSent]        = useState(false);
  const [checkInbox, setCheckInbox]       = useState(false);   // 👉 new

  /* colours */
  const C = { accent:"#fe9245", accent2:"#eb423b" };

  /* ───────── sign-in / sign-up submit ───────── */
  async function handleSubmit (e) {
    e.preventDefault();
    setError(""); setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match."); setLoading(false); return;
      }

      /* ** KEY FIX ** → include emailRedirectTo */
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options : {
          data:{ name },
          emailRedirectTo:`${window.location.origin}/auth/confirm`
        }
      });

      setLoading(false);
      if (error) return setError(error.message);

      /* show “check your inbox” screen */
      setCheckInbox(true);
      return;
    }

    /* sign-in */
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else       navigate("/app");
  }

  /* ───────── google oauth ───────── */
  async function handleGoogle() {
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider:"google" });
    if (error) setError(error.message);
    setLoading(false);
  }

  /* ───────── forgot-password submit ───────── */
  async function handleResetSubmit(e){
    e.preventDefault(); setResetError(""); setResetSent(false);
    if (!resetEmail) return setResetError("Please enter your email.");
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      { redirectTo:`${window.location.origin}/auth/reset-password` }
    );
    if (error) setResetError(error.message); else setResetSent(true);
  }

  /* ──────────────────────────────────────────
     1️⃣  “Check your inbox” splash (after sign-up)
  ────────────────────────────────────────── */
  if (checkInbox) {
    return (
      <div style={{
        minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
        background:"#101015",color:"#fff",textAlign:"center",padding:"0 16px"
      }}>
        <div style={{maxWidth:480,background:"#18141c",padding:"42px 34px",
          borderRadius:18,boxShadow:"0 8px 38px #000c"}}>
          <div style={{fontSize:28,fontWeight:900,marginBottom:18,letterSpacing:"-0.02em"}}>
            Confirm your e-mail 📧
          </div>
          <p style={{lineHeight:1.6,fontSize:16.2,opacity:0.9}}>
            We just sent a verification link to <b>{email}</b>.<br/>
            Click the button in that e-mail to activate your account.
          </p>
          <button onClick={()=>setCheckInbox(false)}
            style={{marginTop:26,background:"#232330",border:"none",
              color:"#fff",fontSize:15.5,fontWeight:700,padding:"10px 26px",
              borderRadius:8,cursor:"pointer"}}>
            ‹ Back
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────
     2️⃣  Main sign-in / sign-up form
  ────────────────────────────────────────── */
  return (
    <>
      <form onSubmit={handleSubmit} style={{
        width:430,maxWidth:"98vw",margin:"9vh auto 0 auto",
        background:"rgba(24,22,32,0.94)",borderRadius:18,
        boxShadow:"0 8px 48px 0 #0008",padding:"33px 30px 26px 30px",
        display:"flex",flexDirection:"column"
      }}>
        <div style={{fontSize:23,fontWeight:900,color:"#fff",
          marginBottom:18,textAlign:"center",letterSpacing:"-0.03em"}}>
          {isSignUp?"Sign Up":"Sign In"}
        </div>

        {isSignUp &&
          <input style={inputStyle} placeholder="Your name" required
            value={name} onChange={e=>setName(e.target.value)} />}

        <input style={inputStyle} type="email"  placeholder="Email address" required
          value={email} onChange={e=>setEmail(e.target.value)} />

        <input style={inputStyle} type="password"
          placeholder="Password" required
          autoComplete={isSignUp?"new-password":"current-password"}
          value={password} onChange={e=>setPassword(e.target.value)} />

        {isSignUp &&
          <input style={inputStyle} type="password"
            placeholder="Confirm password" required
            value={confirmPassword} onChange={e=>setConfirm(e.target.value)} />}

        {!isSignUp && (
          <div style={{textAlign:"right",margin:"0 0 4px 0"}}>
            <span onClick={()=>{setShowReset(true)}}
              style={{color:C.accent,fontSize:13.5,fontWeight:600,cursor:"pointer"}}>
              Forgot your password?
            </span>
          </div>
        )}

        {error && <div style={{color:"#eb423b",fontSize:14,fontWeight:500,
          margin:"7px 0 1px 0",textAlign:"center"}}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          marginTop:13,background:`linear-gradient(90deg,${C.accent} 10%,${C.accent2} 90%)`,
          color:"#fff",border:"none",borderRadius:7,fontWeight:900,fontSize:16.2,
          padding:"9px 0",boxShadow:"0 2px 11px 0 #fe924522",
          cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1
        }}>
          {loading?(isSignUp?"Signing up…":"Signing in…"):(isSignUp?"Sign Up":"Sign In")}
        </button>

        {/* or divider */}
        <div style={{display:"flex",alignItems:"center",margin:"13px 0 7px 0"}}>
          <div style={{flex:1,height:1,background:"#333"}}/>
          <span style={{color:"#bbb",fontSize:11.6,padding:"0 12px",fontWeight:600}}>or</span>
          <div style={{flex:1,height:1,background:"#333"}}/>
        </div>

        <button type="button" disabled={loading} onClick={handleGoogle} style={{
          background:"#fff",color:"#222",fontWeight:700,fontSize:14.6,padding:"8px 0",
          border:"none",borderRadius:7,boxShadow:"0 1.5px 8px #0003",
          cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",
          justifyContent:"center",gap:10,marginBottom:8
        }}>
          <FcGoogle size={20}/>&nbsp;Continue with Google
        </button>

        {/* switch link */}
        <div style={{color:"#bbb",marginTop:7,textAlign:"center",fontSize:13.5}}>
          {isSignUp?(
            <>Already have an account?{" "}
              <span style={{color:C.accent,cursor:"pointer",fontWeight:700}}
                onClick={()=>onSwitchMode("sign-in")}>Sign&nbsp;in</span></>)
          :(
            <>New to FeelFlick?{" "}
              <span style={{color:C.accent,cursor:"pointer",fontWeight:700}}
                onClick={()=>onSwitchMode("sign-up")}>Sign up now.</span></>)}
        </div>
      </form>

      {/* ───────── modal: forgot-password ───────── */}
      {showReset && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:4000,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <form onSubmit={handleResetSubmit} style={{
            background:"#191924",borderRadius:17,padding:"32px 24px 24px",
            boxShadow:"0 8px 38px #0007",maxWidth:340,width:"93vw",
            display:"flex",flexDirection:"column"}}>
            <div style={{fontWeight:800,fontSize:18.5,marginBottom:16,color:"#fff",textAlign:"center"}}>
              Reset your password
            </div>
            <input style={inputStyle} type="email" placeholder="Your e-mail"
              value={resetEmail} onChange={e=>setResetEmail(e.target.value)} required/>
            {resetError && <div style={{color:"#eb423b",fontSize:14,marginTop:7,textAlign:"center"}}>{resetError}</div>}
            {resetSent  && <div style={{color:C.accent,fontWeight:600,marginTop:11,textAlign:"center"}}>
                              Reset link sent! Check your inbox.</div>}
            <button type="submit" style={{
              background:`linear-gradient(90deg,${C.accent} 10%,${C.accent2} 90%)`,
              color:"#fff",border:"none",borderRadius:8,fontWeight:700,
              fontSize:15.5,padding:"10px 0",marginTop:14,cursor:"pointer"}}>
              Send reset link
            </button>
            <button type="button" onClick={()=>setShowReset(false)} style={{
              background:"none",border:"none",color:"#aaa",fontWeight:500,
              fontSize:14,marginTop:13,cursor:"pointer"}}>Cancel</button>
          </form>
        </div>
      )}
    </>
  );
}
