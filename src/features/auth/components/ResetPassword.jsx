// src/components/ResetPassword.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

export default function ResetPassword() {
  const { hash }   = useLocation();
  const navigate   = useNavigate();

  // 🔐 1. Parse the hash **once** (initialState function runs only on mount)
  const [tokens] = useState(() => (
    Object.fromEntries(new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash))
  ));
  const { access_token: accessToken, refresh_token: refreshToken } = tokens;

  // 🔐 2. Session exchange (runs once – deps include the memoised tokens)
  useEffect(() => {
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .catch(err => console.error("setSession failed:", err));
    }
  }, [accessToken, refreshToken]);

  /* ───────── local form state ───────── */
  const [password, setPassword] = useState("");
  const [confirm , setConfirm ] = useState("");
  const [error   , setError   ] = useState("");
  const [success , setSuccess ] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8)      return setError("Password must be at least 8 characters.");
    if (password !== confirm)     return setError("Passwords do not match.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate("/auth/sign-in"), 2000);
    }
  }

  /* ───────── UI ───────── */
  if (!accessToken || !refreshToken) {
    return (
      <Screen>
        <Msg>Invalid or expired reset link.</Msg>
      </Screen>
    );
  }

  return (
    <Screen>
      <Form onSubmit={handleSubmit}>
        <Heading>Set a&nbsp;new&nbsp;password</Heading>

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />

        {error   && <Error>{error}</Error>}
        {success && <Success>Password updated! Redirecting…</Success>}

        {!success && <Primary>Reset password</Primary>}
      </Form>
    </Screen>
  );
}

/* ───── tiny inline “styled-component” helpers ───── */
const Screen  = ({children}) => <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#101015",fontFamily:"Inter,sans-serif"}}>{children}</div>;
const Form    = (p) => <form {...p} style={{background:"#18141c",padding:"38px 32px",borderRadius:16,minWidth:360,boxShadow:"0 8px 38px #000c",color:"#fff",display:"flex",flexDirection:"column"}}/>;
const Heading = ({children}) => <div style={{fontSize:24,fontWeight:900,marginBottom:20,textAlign:"center"}}>{children}</div>;
const Input   = (p) => <input {...p} style={{margin:"10px 0",padding:"13px 12px",borderRadius:8,border:"none",background:"#232330",color:"#fff",fontSize:16}}/>;
const Error   = ({children}) => <div style={{color:"#eb423b",marginTop:6,textAlign:"center"}}>{children}</div>;
const Success = ({children}) => <div style={{color:"#fe9245",marginTop:6,textAlign:"center"}}>{children}</div>;
const Primary = ({children}) => <button type="submit" style={{marginTop:18,background:"linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:17,padding:"11px 0",cursor:"pointer"}}>{children}</button>;
const Msg     = ({children}) => <div style={{color:"#fff",fontSize:18,textAlign:"center"}}>{children}</div>;
