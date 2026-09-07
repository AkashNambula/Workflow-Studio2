import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "User", email: "", role: "Viewer" });

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser({
        name: storedUser.name || "User",
        email: storedUser.email || "",
        role: storedUser.role || "Viewer"
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const initials = useMemo(() => {
    const name = user.name || "User";
    return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  }, [user.name]);

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: "#94a3b8" }}>Account</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 28 }}>My Profile</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #2a2a31", background: "#111116", color: "#f8fafc", cursor: "pointer" }}
          >
            Back to Dashboard
          </button>
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.1fr 0.9fr" }}>
          <div style={{ background: "#111116", border: "1px solid #2a2a31", borderRadius: 20, padding: 24, display: "grid", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</div>
                <div style={{ color: "#94a3b8", marginTop: 4 }}>{user.email}</div>
                <div style={{ color: "#22c55e", marginTop: 6, fontSize: 13, fontWeight: 600 }}>{user.role}</div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 14, background: "#0f0f12", border: "1px solid #2a2a31" }}>
                <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em" }}>Email</div>
                <div style={{ marginTop: 6 }}>{user.email || "Not available"}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 14, background: "#0f0f12", border: "1px solid #2a2a31" }}>
                <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em" }}>Role</div>
                <div style={{ marginTop: 6 }}>{user.role}</div>
              </div>
            </div>
          </div>

          <div style={{ background: "#111116", border: "1px solid #2a2a31", borderRadius: 20, padding: 24, display: "grid", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Quick actions</div>
            <button onClick={() => navigate("/dashboard")} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #2a2a31", background: "#0f0f12", color: "#f8fafc", cursor: "pointer", textAlign: "left" }}>Open workflow builder</button>
            <button onClick={() => navigate("/saved-workflows")} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #2a2a31", background: "#0f0f12", color: "#f8fafc", cursor: "pointer", textAlign: "left" }}>View saved workflows</button>
            <button onClick={() => navigate("/execution-history")} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #2a2a31", background: "#0f0f12", color: "#f8fafc", cursor: "pointer", textAlign: "left" }}>Check execution history</button>
          </div>
        </div>
      </div>
    </div>
  );
}
