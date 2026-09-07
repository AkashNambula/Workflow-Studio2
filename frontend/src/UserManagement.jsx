import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const palette = {
  bg: "#0B0B0F",
  panel: "#14141A",
  sidebar: "#101014",
  card: "#14141A",
  border: "#3B3E47",
  text: "#F5F5F5",
  textMuted: "#B8B8C2",
  textSoft: "#8A8D98",
  hover: "#454852",
  button: "#3F424C",
  buttonHover: "#575B66",
  input: "#1C1D24",
  inputBorder: "#3B3E47",
  inputFocus: "#575B66",
  danger: "#ef4444",
  success: "#22c55e"
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Operator");

  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [openUserScopeId, setOpenUserScopeId] = useState(null);

  const token = localStorage.getItem("token");

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "" });

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };

    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    try {
      await axios.post(
        "http://127.0.0.1:8000/admin/create-user",
        { name, email, password, phone, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSuccess(true);
      setStatusMessage(`${role} account provisioned successfully.`);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      fetchUsers();
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      setIsSuccess(false);
      let errorData = err.response?.data?.detail;
      if (typeof errorData === "object") {
        errorData = JSON.stringify(errorData);
      }
      setStatusMessage(errorData || "Could not create the requested user account.");
    }
  };

  const handleDeleteUser = async (userEmail) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/user/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return null;
    } catch (err) {
      let errorData = err.response?.data?.detail;
      if (typeof errorData === "object") errorData = JSON.stringify(errorData);
      return errorData || "Failed to terminate user access.";
    }
  };

  const openDeleteModal = (user) => {
    setDeleteUser(user);
    setShowDeleteModal(true);
    setToast({ message: "", type: "" });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteUser(null);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUser) return;

    const error = await handleDeleteUser(deleteUser.email);
    if (!error) {
      fetchUsers();
      setToast({ message: "User deleted successfully!", type: "error" });
      closeDeleteModal();
      setTimeout(() => setToast({ message: "", type: "" }), 2500);
    } else {
      setToast({ message: error, type: "error" });
      setTimeout(() => setToast({ message: "", type: "" }), 2500);
    }
  };

  const toggleAccordion = (userId) => {
    setOpenUserScopeId((current) => (current === userId ? null : userId));
  };

  const openResetModal = (user) => {
    setModalUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setModalMessage("");
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setModalUser(null);
    setModalMessage("");
  };

  // Close modal on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showResetModal) closeResetModal();
        if (showDeleteModal) closeDeleteModal();
      }
    };
    if (showResetModal || showDeleteModal) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResetModal, showDeleteModal]);

 const handleResetSubmit = async (e) => {
  e.preventDefault();

  if (newPassword !== confirmPassword) {
    setModalMessage("Passwords do not match.");
    return;
  }

  try {
    await axios.put(
      "http://127.0.0.1:8000/admin/reset-password",
      {
        email: modalUser.email,
        new_password: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setModalMessage("Password reset successfully.");

    fetchUsers();

    setTimeout(() => {
      closeResetModal();
    }, 1000);

  } catch (err) {
    setModalMessage(
      err.response?.data?.detail || "Failed to reset password."
    );
  }
};

  const renderAccessControlScope = (userRole) => {
    const roleNormalized = userRole?.toLowerCase();

    const specs = [
      { name: "Workspace Canvas Access", admin: true, operator: true, viewer: true },
      { name: "Workflow Node Building / Custom Loops Configuration", admin: true, operator: true, viewer: false },
      { name: "Execution Control Orchestrator", admin: true, operator: true, viewer: false },
      { name: "User Management Provisioning", admin: true, operator: false, viewer: false }
    ];

    return (
      <div style={styles.specBox}>
        <div style={{ fontSize: "11px", color: palette.textSoft, fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>
          LIVE ACCESS CONFIGURATION SCOPE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {specs.map((spec, idx) => {
            const hasAccess = spec[roleNormalized];
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", padding: "6px 8px", background: palette.input, borderRadius: "6px", border: `1px solid ${palette.border}` }}>
                <span style={{ color: palette.textMuted }}>{spec.name}</span>
                {hasAccess ? (
                  <span style={{ color: palette.success, display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Allowed
                  </span>
                ) : (
                  <span style={{ color: palette.danger, display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
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
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <h2 style={styles.title}>Register Staff</h2>
            </div>
            <button onClick={() => navigate("/")} style={styles.backBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "4px" }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Exit
            </button>
          </div>

          {statusMessage && (
            <div style={{ backgroundColor: isSuccess ? "rgba(34, 197, 94, 0.10)" : "rgba(239, 68, 68, 0.10)", color: isSuccess ? palette.success : palette.danger, border: `1px solid ${isSuccess ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}`, padding: "12px", borderRadius: "8px", marginBottom: "20px", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div style={{ wordBreak: "break-all" }}>{statusMessage}</div>
            </div>
          )}

          <form onSubmit={handleCreateUser} style={styles.form}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
            <input type="email" placeholder="Corporate Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
            <input type="password" placeholder="Access Authentication Token / Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
            <input type="text" placeholder="Phone Link Parameters" value={phone} onChange={(e) => { const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 10); setPhone(digits); }} maxLength={10} pattern="\d{10}" style={styles.input} required />

            <div style={{ marginTop: "6px" }}>
              <label style={{ fontSize: "12px", color: palette.textSoft, fontWeight: "600", display: "block", marginBottom: "6px" }}>Designated Permission Role Context</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
                <option value="Operator">Operator</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <button type="submit" style={styles.submitBtn}>Register Staff</button>
          </form>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <h2 style={styles.title}>User Directory</h2>
            </div>
          </div>

          <div style={styles.tableShell}>
            {users.length === 0 ? (
              <p style={{ color: palette.textSoft, textAlign: "center", padding: "30px", fontSize: "14px", margin: 0 }}>No active profiles are currently indexed.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: palette.sidebar, borderBottom: `1px solid ${palette.border}`, color: palette.textSoft, fontSize: "12px", fontWeight: "700" }}>
                    <th style={{ padding: "14px 16px" }}>Identity</th>
                    <th style={{ padding: "14px 16px" }}>Access Scope</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isCurrentAccordionOpen = openUserScopeId === u.id;
                    const isUserAdmin = u.role?.toLowerCase() === "admin";
                    const isUserOperator = u.role?.toLowerCase() === "operator";

                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${palette.border}`, background: "transparent" }}>
                        <td style={{ padding: "16px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: "700", color: palette.text, fontSize: "14px" }}>{u.name}</div>
                          <div style={{ color: palette.textSoft, fontSize: "12px", marginTop: "2px" }}>{u.email}</div>
                          <div style={{ color: palette.textSoft, fontSize: "11px", marginTop: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.textSoft} strokeWidth="2" style={{ flex: "0 0 12px" }}>
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12 1.01.38 2 .77 2.94a2 2 0 0 1-.45 2.11L9.91 11.09a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.94.39 1.93.65 2.94.77A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span>{u.phone}</span>
                          </div>
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
                                background: isUserAdmin ? "rgba(255,255,255,0.06)" : isUserOperator ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
                                color: palette.textMuted,
                                border: `1px solid ${palette.border}`,
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <span>{u.role}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isCurrentAccordionOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                          </div>

                          {isCurrentAccordionOpen && (
                            <div style={{ marginTop: "10px" }}>
                              {renderAccessControlScope(u.role)}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "16px", textAlign: "center", verticalAlign: "top" }}>
                          {!isUserAdmin ? (
                            <>
                              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                  onClick={() => openResetModal(u)}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = palette.buttonHover)}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = palette.button)}
                                  style={{ ...styles.actionBtn, ...styles.resetBtn }}
                                  aria-label={`Reset password for ${u.email}`}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", color: palette.text }}>
                                    <path d="M21 10v6a2 2 0 0 1-2 2h-6" stroke={palette.text}></path>
                                    <path d="M7 10a5 5 0 1 1 10 0v1" stroke={palette.text}></path>
                                    <circle cx="12" cy="16" r="1" fill={palette.text}></circle>
                                  </svg>
                                  <span style={{ color: palette.text }}>Reset</span>
                                </button>

                                <button onClick={() => openDeleteModal(u)} style={{ ...styles.actionBtn, ...styles.deleteBtn }} aria-label={`Delete ${u.email}`}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", color: palette.danger }}>
                                    <polyline points="3 6 5 6 21 6" stroke={palette.danger}></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={palette.danger}></path>
                                    <path d="M10 11v6" stroke={palette.danger}></path>
                                    <path d="M14 11v6" stroke={palette.danger}></path>
                                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={palette.danger}></path>
                                  </svg>
                                  <span style={{ color: palette.danger }}>Delete</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <span style={{ color: palette.textSoft, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Protected</span>
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
        {showResetModal && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(11,11,15,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
            onClick={closeResetModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{ width: "420px", background: palette.panel, borderRadius: "10px", padding: "20px", border: `1px solid ${palette.border}`, boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: palette.text }}>Reset Password</div>
                  <div style={{ fontSize: "12px", color: palette.textSoft, marginTop: "6px" }}>User</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: palette.text, marginTop: "4px" }}>{modalUser?.name}</div>
                </div>
                <button onClick={closeResetModal} style={{ background: "transparent", border: "none", color: palette.textSoft, cursor: "pointer", fontSize: "14px" }}>✕</button>
              </div>

              <form onSubmit={handleResetSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ ...styles.input, marginBottom: 0 }}
                    required
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ ...styles.input, marginBottom: 0 }}
                    required
                  />

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: palette.textSoft, fontSize: "13px" }}>
                    <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                    Show Password
                  </label>

                  {modalMessage && <div style={{ color: palette.success, fontWeight: "700", fontSize: "13px" }}>{modalMessage}</div>}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
                    <button type="button" onClick={closeResetModal} style={{ ...styles.actionBtn, background: "transparent", border: `1px solid ${palette.border}`, color: palette.textSoft }}>Cancel</button>

                    <button
                      type="submit"
                      disabled={!(newPassword.length >= 8 && newPassword === confirmPassword)}
                      style={{ ...styles.actionBtn, ...styles.resetBtn, opacity: newPassword.length >= 8 && newPassword === confirmPassword ? 1 : 0.5 }}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        {showDeleteModal && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(11,11,15,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
            onClick={closeDeleteModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{ width: "420px", background: palette.panel, borderRadius: "10px", padding: "20px", border: `1px solid ${palette.border}`, boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: palette.text }}>Confirm Delete</div>
                </div>
                <button onClick={closeDeleteModal} style={{ background: "transparent", border: "none", color: palette.textSoft, cursor: "pointer", fontSize: "14px" }}>✕</button>
              </div>

              <div style={{ color: palette.text, fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
                Are you sure you want to delete this user?
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={closeDeleteModal} style={{ ...styles.actionBtn, background: "transparent", border: `1px solid ${palette.border}`, color: palette.textSoft }}>Cancel</button>
                <button type="button" onClick={confirmDeleteUser} style={{ ...styles.actionBtn, ...styles.deleteBtn }}>Delete</button>
              </div>
            </div>
          </div>
        )}
        {toast.message && (
          <div style={{ position: "fixed", right: "24px", bottom: "24px", zIndex: 10000, width: "320px" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.16)", border: `1px solid rgba(239, 68, 68, 0.3)`, color: palette.danger, borderRadius: "12px", padding: "14px 16px", boxShadow: "0 16px 40px rgba(0,0,0,0.25)", fontWeight: 700, fontSize: "14px" }}>
              {toast.message}
            </div>
          </div>
        )}
    </div>
  );
}

const styles = {
  container: { padding: "40px 24px", background: palette.bg, minHeight: "100vh", color: palette.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  grid: { maxWidth: "1320px", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(420px, 1.4fr)", gap: "24px", alignItems: "start" },
  card: { background: palette.card, border: `1px solid ${palette.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 12px 36px rgba(0,0,0,0.24)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" },
  title: { margin: 0, fontSize: "18px", fontWeight: "700", letterSpacing: "-0.2px", color: palette.text },
  backBtn: { display: "inline-flex", alignItems: "center", background: palette.button, border: `1px solid ${palette.border}`, color: palette.text, padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "0.2s ease" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  input: { padding: "12px 14px", borderRadius: "8px", border: `1px solid ${palette.inputBorder}`, background: palette.input, color: palette.text, outline: "none", fontSize: "14px" },
  select: { padding: "12px 14px", borderRadius: "8px", border: `1px solid ${palette.inputBorder}`, background: palette.input, color: palette.text, outline: "none", fontSize: "14px", cursor: "pointer", width: "100%" },
  submitBtn: { padding: "12px 14px", borderRadius: "8px", background: palette.button, color: palette.text, border: `1px solid ${palette.border}`, fontWeight: "700", cursor: "pointer", marginTop: "6px", fontSize: "14px", transition: "0.2s ease" },
  actionBtn: { display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.15s ease", border: `1px solid ${palette.border}` },
  deleteBtn: { display: "inline-flex", alignItems: "center", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: palette.danger, padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "all 0.15s ease" },
  resetBtn: { display: "inline-flex", alignItems: "center", background: palette.button, border: `1px solid ${palette.border}`, color: palette.text, padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "all 0.15s ease" },
  specBox: { background: palette.panel, padding: "12px", borderRadius: "10px", border: `1px solid ${palette.border}`, marginTop: "4px" },
  tableShell: { overflowY: "auto", maxHeight: "560px", borderRadius: "10px", border: `1px solid ${palette.border}`, background: palette.panel }
};