import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginMessage, setLoginMessage] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginMessage("Please enter email and password");
      setLoginSuccess(false);
      return;
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/login",
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          role: res.data.role
        })
      );

      setLoginMessage("Successfully Logged In");
      setLoginSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (error) {
      setLoginMessage("Invalid Email or Password");
      setLoginSuccess(false);
      console.error(error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Subtle Background Glow Elements */}
      <div style={styles.glowOverlayLeft}></div>
      <div style={styles.glowOverlayRight}></div>

      <div style={styles.glassWrapperGrid}>
        
        {/* LEFT PANEL: MINIMALIST BRANDING BOX */}
        <div style={styles.brandingSection}>
          <div style={styles.brandingLogoContext}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span style={styles.brandBadgeText}>FAST AUTOMATION ENGINE</span>
          </div>
          
          <div>
            <h2 style={styles.brandingTitleText}>HR Automation</h2>
            <p style={styles.brandingSubText}>Streamlined onboarding workspace.</p>
          </div>
          
          <div style={styles.footerBrandingCode}>SECURE CONNECTION</div>
        </div>

        {/* RIGHT PANEL: DIRECT MINIMAL LOGIN FORM */}
        <div style={styles.formSection}>
          <h1 style={styles.titleText}>
            ADMIN HR AUTOMATION LOGIN
          </h1>

          {loginMessage && (
            <div
              style={{
                backgroundColor: loginSuccess ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
                color: loginSuccess ? "#4ade80" : "#f87171",
                border: loginSuccess ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "18px",
                fontWeight: "600",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center"
              }}
            >
              {loginMessage}
            </div>
          )}

          <div style={styles.inputContainer}>
            <label style={styles.inputLabelText}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputStyle}
            />
          </div>

          <div style={styles.inputContainer}>
            <label style={styles.inputLabelText}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.inputStyle}
            />
          </div>

          <button
            onClick={handleLogin}
            style={styles.actionSubmitBtn}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#030307",
    margin: 0,
    padding: 0,
    overflow: "hidden",
    position: "relative",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  glowOverlayLeft: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(0,0,0,0) 70%)",
    top: "-50px",
    left: "-50px",
    zIndex: 1
  },
  glowOverlayRight: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, rgba(0,0,0,0) 70%)",
    bottom: "-100px",
    right: "-50px",
    zIndex: 1
  },
  glassWrapperGrid: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.25fr",
    width: "840px",
    height: "460px",
    background: "rgba(13, 13, 23, 0.5)",
    backdropFilter: "blur(25px)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7)",
    overflow: "hidden",
    zIndex: 10
  },
  brandingSection: {
    background: "linear-gradient(145deg, #090910, #05050a)",
    borderRight: "1px solid rgba(255, 255, 255, 0.02)",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  brandingLogoContext: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  brandBadgeText: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#a855f7",
    letterSpacing: "1px",
    background: "rgba(168, 85, 247, 0.06)",
    padding: "4px 10px",
    borderRadius: "50px",
    border: "1px solid rgba(168, 85, 247, 0.12)"
  },
  brandingTitleText: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
    marginBottom: "8px",
    lineHeight: "1.2"
  },
  brandingSubText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.4",
    margin: 0
  },
  footerBrandingCode: {
    fontSize: "10px",
    color: "#1e293b",
    fontFamily: "monospace",
    letterSpacing: "0.5px"
  },
  formSection: {
    padding: "40px 45px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  titleText: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "25px",
    letterSpacing: "-0.3px"
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px"
  },
  inputLabelText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  inputStyle: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #1e293b",
    background: "#050508",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none"
  },
  actionSubmitBtn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 4px 15px rgba(124, 58, 237, 0.2)",
    marginTop: "8px",
    transition: "0.2s"
  }
};