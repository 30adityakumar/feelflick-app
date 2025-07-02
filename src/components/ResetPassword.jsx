// src/components/ResetPassword.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const { hash } = useLocation();  // <-- This gives you the # fragment!
  const navigate = useNavigate();

  // Debug logging
  console.log("ResetPassword loaded. location.hash:", hash);

  // Parse #access_token=...&refresh_token=... into an object
  const params = Object.fromEntries(
    new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash)
  );
  console.log("Parsed tokens:", params);

  const accessToken  = params.access_token;
  const refreshToken = params.refresh_token;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  // Set session on mount if tokens are present
  useEffect(() => {
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) console.error("setSession error:", error.message);
          else console.log("Session set successfully");
        })
        .catch((err) => console.error("setSession failed:", err));
    }
  }, [accessToken, refreshToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8)    return setError("Password must be at least 8 characters.");
    if (password !== confirm)   return setError("Passwords do not match.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error)  setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate("/auth/sign-in"), 2000);
    }
  }

  if (!accessToken || !refreshToken) {
    return (
      <ScreenWrapper>
        <Notice>Invalid or expired reset link.</Notice>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
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
        {error   && <ErrorMsg>{error}</ErrorMsg>}
        {success && <SuccessMsg>Password updated! You’ll be redirected…</SuccessMsg>}
        {!success && <PrimaryBtn>Reset password</PrimaryBtn>}
      </Form>
    </ScreenWrapper>
  );
}

/* Styled helpers */
const ScreenWrapper = ({ children }) => (
  <div style={{
    minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
    background:"#101015",fontFamily:"Inter,sans-serif"
  }}>{children}</div>
);
const Form = (props) => (
  <form {...props} style={{
    background:"#18141c",padding:"38px 32px",borderRadius:16,minWidth:360,
    boxShadow:"0 8px 38px #000c",color:"#fff",display:"flex",flexDirection:"column"
  }}/>
);
const Heading   = ({ children }) => <div style={{fontSize:24,fontWeight:900,marginBottom:20,textAlign:"center"}}>{children}</div>;
const Input     = (p) => <input {...p} style={{margin:"10px 0",padding:"13px 12px",borderRadius:8,border:"none",background:"#232330",color:"#fff",fontSize:16}} />;
const ErrorMsg  = ({children}) => <div style={{color:"#eb423b",margin:"6px 0 0 0",textAlign:"center"}}>{children}</div>;
const SuccessMsg= ({children}) => <div style={{color:"#fe9245",margin:"6px 0 0 0",textAlign:"center"}}>{children}</div>;
const PrimaryBtn= ({children}) => <button type="submit" style={{
  marginTop:18,background:"linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
  border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:17,padding:"11px 0",cursor:"pointer"
}}>{children}</button>;
const Notice    = ({children}) => <div style={{color:"#fff",padding:50,textAlign:"center"}}>{children}</div>;
