import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  
  // Form Input States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Operator");

  // Inline Message Handlers States
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Accordion Open/Close State Tracker Map Index Linked
  const [openUserScopeId, setOpenUserScopeId] = useState(null);
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load staff list dashboard mapping.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    
    try {
      await axios.post(
        "http://127.0.0.1:8000/admin/create-user",
        { 
          name: name, 
          email: email, 
          // 🟢 FIXED: Pushing both validation keys into schema payload to clear structural requirements bounds seamlessly
          password: password,
          access_token: password, 
          phone: phone, 
          role: role 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsSuccess(true);
      setStatusMessage(`${role} account provisioned successfully.`);
      setName(""); setEmail(""); setPassword(""); setPhone("");
      fetchUsers();

      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      setIsSuccess(false);
      
      let errorData = err.response?.data?.detail;
      if (typeof errorData === "object") {
        errorData = JSON.stringify(errorData); // Protects and safely marshals complex data dictionaries strings to block blank screen drops
      }
      
      setStatusMessage(errorData || "Could not validate credentials structure access token matrix");
    }
  };

  const handleDeleteUser = async (userEmail) => {
    if (!window.confirm("Are you sure you want to terminate this user access token setup?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/user/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSuccess(true);
      setStatusMessage("Account access context dropped from registry loops.");
      fetchUsers();
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      setIsSuccess(false);
      let errorData = err.response?.data?.detail;
      if (typeof errorData === "object") errorData = JSON.stringify(errorData);
      setStatusMessage(errorData || "Failed to delete user configuration properties.");
    }
  };

  // Toggle function to open/close Accordion structure safely
  const toggleAccordion = (userId) => {
    if (openUserScopeId === userId) {
      setOpenUserScopeId(null);
    } else {
      setOpenUserScopeId(userId);
    }
  };

  // Render Access details with structured matrix logic map parameters
  const renderAccessControlScope = (userRole) => {
    const roleNormalized = userRole?.toLowerCase();
    
    const specs = [
      { name: "Workspace Canvas Access", admin: true, operator: true, viewer: true },
      { name: "Workflow Node Building / Custom Loops Configuration Trigger", admin: true, operator: true, viewer: false },
      { name: "Execution Control Orchestrator (Run automation chain loops)", admin: true, operator: true, viewer: false },
      { name: "Global Account System Directories Provisioning (User Management Grid)", admin: true, operator: false, viewer: false }
    ];

    return (
      <div style={styles.specBox}>
        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>LIVE ACCESS CONFIGURATION SCOPE:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {specs.map((spec, idx) => {
            const hasAccess = spec[roleNormalized];
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", padding: "6px 8px", background: "#05050a", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8" }}>{spec.name}</span>
                {hasAccess ? (
                  <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Allowed
                  </span>
                ) : (
                  <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Blocked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: "1300px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "35px", alignItems: "start" }}>
        
        {/* LEFT PANEL: REGISTER STAFF NODE FORM */}
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "-0.3px", color: "#f8fafc" }}>Register Staff Node</h2>
            </div>
            <button onClick={() => navigate("/")} style={styles.backBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "4px" }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Exit
            </button>
          </div>
          
          {statusMessage && (
            <div style={{ backgroundColor: isSuccess ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)", color: isSuccess ? "#34d399" : "#f87171", border: isSuccess ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div style={{ wordBreak: "break-all" }}>{statusMessage}</div>
            </div>
          )}

          <form onSubmit={handleCreateUser} style={styles.form}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
            <input type="email" placeholder="Corporate Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
            <input type="password" placeholder="Access Authentication Token / Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
            <input type="text" placeholder="Phone Link Parameters" value={phone} onChange={(e) => setPhone(e.target.value)} style={styles.input} required />
            
            <div style={{ marginTop: "6px" }}>
              <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", display: "block", marginBottom: "6px" }}>Designated Permission Role Context</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
                <option value="Operator">Operator</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <button type="submit" style={styles.submitBtn}>Provision Identity Context</button>
          </form>
        </div>

        {/* RIGHT PANEL: LIVE ACCESS CONTROL MANAGEMENT */}
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "-0.3px", color: "#f8fafc" }}>Live Access Control Management</h2>
          </div>

          <div style={{ overflowY: "auto", maxHeight: "550px", borderRadius: "10px", border: "1px solid #1e293b", background: "#0c0c14" }}>
            {users.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "30px", fontSize: "14px", margin: 0 }}>No active profiles indexed inside database schema registry.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#11111e", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: "12px", fontWeight: "700" }}>
                    <th style={{ padding: "14px 16px" }}>Identity Attributes</th>
                    <th style={{ padding: "14px 16px" }}>Context Matrix Assignment Scope</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Operational Trigger</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isCurrentAccordionOpen = openUserScopeId === u.id;
                    const isUserAdmin = u.role?.toLowerCase() === "admin";
                    const isUserOperator = u.role?.toLowerCase() === "operator";

                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #1e293b", background: "transparent" }}>
                        <td style={{ padding: "16px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: "700", color: "#f1f5f9", fontSize: "14px" }}>{u.name}</div>
                          <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{u.email}</div>
                          <div style={{ color: "#475569", fontSize: "11px", marginTop: "2px" }}>📱 {u.phone}</div>
                        </td>
                        
                        <td style={{ padding: "16px", width: "45%", verticalAlign: "top" }}>
                          <div style={{ marginBottom: "4px" }}>
                            <button 
                              type="button"
                              onClick={() => toggleAccordion(u.id)}
                              style={{ 
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px", 
                                fontWeight: "800", 
                                padding: "6px 12px", 
                                borderRadius: "6px",
                                background: isUserAdmin ? "rgba(168, 85, 247, 0.12)" : isUserOperator ? "rgba(59, 130, 246, 0.12)" : "rgba(148, 163, 184, 0.12)",
                                color: isUserAdmin ? "#c084fc" : isUserOperator ? "#60a5fa" : "#cbd5e1",
                                border: isUserAdmin ? "1px solid rgba(168, 85, 247, 0.3)" : isUserOperator ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <span>{u.role}</span>
                              <svg 
                                width="12" 
                                height="12" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                                style={{ 
                                  transform: isCurrentAccordionOpen ? "rotate(180deg)" : "rotate(0deg)", 
                                  transition: "transform 0.2s ease" 
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>

                          {isCurrentAccordionOpen && (
                            <div style={{ marginTop: "10px" }}>
                              {renderAccessControlScope(u.role)}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "16px", textAlign: "right", verticalAlign: "top" }}>
                          {!isUserAdmin ? (
                            <button onClick={() => handleDeleteUser(u.email)} style={styles.deleteBtn}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "4px" }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              Terminate
                            </button>
                          ) : (
                            <span style={{ color: "#475569", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Protected Node</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { padding: "50px 30px", background: "#040408", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  card: { background: "#0e0e16", border: "1px solid #1e293b", borderRadius: "16px", padding: "30px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" },
  backBtn: { display: "inline-flex", alignItems: "center", background: "#1e293b", border: "1px solid #334155", color: "#f8fafc", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "0.2s" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: { padding: "14px", borderRadius: "8px", border: "1px solid #1e293b", background: "#05050a", color: "#fff", outline: "none", fontSize: "14px" },
  select: { padding: "14px", borderRadius: "8px", border: "1px solid #1e293b", background: "#05050a", color: "#fff", outline: "none", fontSize: "14px", cursor: "pointer", width: "100%" },
  submitBtn: { padding: "14px", borderRadius: "8px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer", marginTop: "10px", fontSize: "14px", boxShadow: "0 4px 20px rgba(124, 58, 237, 0.3)" },
  deleteBtn: { display: "inline-flex", alignItems: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
  specBox: { background: "#0f0f18", padding: "12px", borderRadius: "10px", border: "1px solid #1e293b", marginTop: "4px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)" }
};