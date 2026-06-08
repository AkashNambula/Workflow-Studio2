import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import axios from "axios";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import UserManagement from "./UserManagement";
import ConditionNodeCustom from "./ConditionNodeCustom"; // 🟢 FIXED: Importing custom dual-branch handle template node

let nodeId = 1;

// 🟢 FIXED: Registering unique conditional custom visual node handle matrix identifiers inside ReactFlow layout
const nodeTypes = {
  condition_node_custom: ConditionNodeCustom
};

function WorkflowBuilder() {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [workflowName, setWorkflowName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [role, setRole] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [history, setHistory] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(true); 
  const [showWorkflowControls, setShowWorkflowControls] = useState(false);
  const [showSavedWorkflows, setShowSavedWorkflows] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [showUserManagement, setShowUserManagement] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role?.toLowerCase();

  const [showWelcome, setShowWelcome] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchHistory();
    fetchSavedWorkflows();
    const timer = setTimeout(() => setShowWelcome(false), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://127.0.0.1:8000/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchSavedWorkflows = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://127.0.0.1:8000/workflows", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedWorkflows(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const loadWorkflow = async (name) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:8000/workflow/${name}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWorkflowName(res.data.name || "");
      setNodes((res.data.nodes || []).map((node) => ({
        id: node.id,
        // 🟢 FIXED: Persist rendering structures types logic for custom components layout sets
        type: node.type === "condition" ? "condition_node_custom" : "default",
        position: node.position || { x: 200, y: 100 },
        data: {
          label: node.type === "email" 
            ? "📧 Email Node" 
            : node.type === "delay" 
            ? `⏳ Delay (${node.delay || 5}s)` 
            : node.type === "pdf" 
            ? "📄 PDF Node" 
            : node.type === "condition"
            ? `🔀 Condition`
            : "📱 SMS Node",
          subject: node.subject || "",
          message: node.message || "",
          delay: node.delay || 0,
          pdfTitle: node.pdf_title || "",
          smsMessage: node.message || "",
          expectedName: node.expectedName || "",
          expectedEmail: node.expectedEmail || ""
        }
      })));

      setEdges((res.data.edges || []).map((e, i) => ({
        ...e,
        id: e.id || `edge-${i}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: isDarkTheme ? "#ffffff" : "#0f172a" },
        style: { stroke: isDarkTheme ? "#ffffff" : "#0f172a", strokeWidth: 2 }
      })));
    } catch (e) {}
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params, type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: isDarkTheme ? "#ffffff" : "#0f172a" },
    style: { stroke: isDarkTheme ? "#ffffff" : "#0f172a", strokeWidth: 2 }
  }, eds)), [setEdges, isDarkTheme]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const createNodeConfig = (type, existingData = {}) => {
    if (type === "email") {
      return {
        label: "📧 Email Node",
        subject: prompt("Enter email subject:", existingData.subject || ""),
        message: prompt("Enter email message:", existingData.message || "")
      };
    }
    if (type === "delay") {
      const seconds = prompt("Enter delay in seconds:", existingData.delay || "5");
      if (!seconds) return null;
      return { label: `⏳ Delay (${seconds}s)`, delay: Number(seconds) };
    }
    if (type === "pdf") {
      return { label: "📄 PDF Node", pdfTitle: prompt("Enter PDF title:", existingData.pdfTitle || "Welcome Letter") };
    }
    if (type === "condition") { return { label: "🔀 Employee Validation Node" }; }
    return { label: "📱 SMS Node", smsMessage: prompt("Enter SMS message:", existingData.smsMessage || "") };
  };

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    if (!type || !reactFlowInstance) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const config = createNodeConfig(type);
    if (!config) return;
    
    // 🟢 FIXED: Appends specialized branching custom node type directly upon drop matching signals
    const isCondition = type === "condition";
    setNodes((nds) => nds.concat({ 
      id: String(nodeId++), 
      type: isCondition ? "condition_node_custom" : "default", 
      position, 
      data: config 
    }));
  };

  const editNode = (node) => {
    let type = "sms";
    if (node.data.label.includes("Email")) type = "email";
    else if (node.data.label.includes("Delay")) type = "delay";
    else if (node.data.label.includes("PDF")) type = "pdf";
    else if (node.type === "condition_node_custom") type = "condition";
    const updated = createNodeConfig(type, node.data);
    if (!updated) return;
    setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: updated } : n)));
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return alert("Select a node first");
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
  };

  const saveWorkflow = async () => {
    if (!workflowName || !employeeName || !employeeEmail || !employeePhone) { alert("Please complete form specifications execution tracking metrics layers."); return; }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:8000/create-workflow",
        {
          name: workflowName || "Notification Workflow",
          nodes: nodes.map((node) => ({
            id: node.id,
            // 🟢 FIXED: Normalizing custom types structures back cleanly to support backend DB parsing schemas definitions checks
            type: node.type === "condition_node_custom" ? "condition" : (node.data.label.includes("Email") ? "email" : node.data.label.includes("Delay") ? "delay" : node.data.label.includes("PDF") ? "pdf" : "sms"),
            delay: node.data.delay || 0,
            subject: node.data.subject || "",
            message: node.data.message || node.data.smsMessage || "",
            pdf_title: node.data.pdfTitle || "",
            expectedName: node.data.expectedName || "",
            expectedEmail: node.data.expectedEmail || "",
            position: node.position
          })),
          edges: edges.map((edge) => ({ 
            source: edge.source, 
            target: edge.target, 
            id: edge.id,
            // 🟢 FIXED: Save edge handles routing parameters to identify True/False selections
            sourceHandle: edge.sourceHandle || null 
          }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Workflow saved successfully!");
      fetchSavedWorkflows();
    } catch(e) {}
  };

  const runWorkflow = async () => {
    if (isRunning) return;
    if (!workflowName || !employeeName || !employeeEmail || !employeePhone) { alert("Form entries are incomplete validation criteria sequence loop triggers block."); return; }

    const token = localStorage.getItem("token");
    setIsRunning(true);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/run-workflow/${workflowName || "Notification Workflow"}`,
        { employees: [{ name: employeeName, email: employeeEmail, phone: employeePhone, role: role, joining_date: joiningDate }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExecutionLogs(response.data.logs || []);
      alert("Workflow executed successfully!");
      fetchHistory();
    } catch (e) {
      console.error(e);
      alert("Workflow execution failed. Please verify configurations.");
    } finally {
      setIsRunning(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) { alert("Please fill all fields"); return; }
    if (newPassword !== confirmPassword) { alert("Passwords do not match"); return; }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch("http://127.0.0.1:8000/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, old_password: oldPassword, new_password: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Password updated successfully");
        setShowChangePassword(false);
        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      } else { alert(data.detail || "Password update failed"); }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const activeTheme = {
    mainBg: isDarkTheme ? "#09090b" : "#f8fafc",
    panelBg: isDarkTheme ? "#111118" : "#ffffff",
    boxBg: isDarkTheme ? "#18181b" : "#f1f5f9",
    border: isDarkTheme ? "#27272a" : "#cbd5e1",
    textTitle: isDarkTheme ? "#ffffff" : "#0f172a",
    textSub: isDarkTheme ? "#71717a" : "#64748b",
    canvasBg: isDarkTheme ? "#0c0c12" : "#f8fafc",
    canvasBorder: isDarkTheme ? "#1f1f2e" : "#e2e8f0",
    nodeBg: isDarkTheme ? "#27272a" : "#e2e8f0",
    nodeText: isDarkTheme ? "#ffffff" : "#0f172a",
    dotColor: isDarkTheme ? "#c084fc" : "#a855f7",
    dropdownBg: isDarkTheme ? "#111118" : "#ffffff",
    dropdownHover: isDarkTheme ? "#18181b" : "#f1f5f9"
  };

  return (
    <div style={{ ...styles.main, background: activeTheme.mainBg }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      <div style={{ ...styles.topBar, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
        <div style={styles.headerLeftSpacer}></div>
        <div style={styles.brandTitleWrap}>
          <h1 style={{ ...styles.heroTitle, color: activeTheme.textTitle }}>HR AUTOMATION WORKFLOW STUDIO</h1>
          <p style={{ ...styles.heroSub, color: activeTheme.textSub }}>Streamline HR processes by automating onboarding, notifications, document generation, and workflow execution in one platform.</p>
        </div>

        <div style={styles.topRightSection}>
          <button onClick={() => setIsDarkTheme(!isDarkTheme)} style={{ ...styles.themeToggleBtn, backgroundColor: isDarkTheme ? "#27272a" : "#e2e8f0", color: activeTheme.textTitle, borderColor: activeTheme.border, display: "flex", alignItems: "center" }}>
            {isDarkTheme ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: "6px" }}>
                  <path d="M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path d="M8 0a.5.5 0 0 1 .5.5V2a.5.5 0 0 1-1 0V.5A.5.5 0 0 1 8 0zm0 12a.5.5 0 0 1 .5.5V14a.5.5 0 0 1-1 0v-1.5A.5.5 0 0 1 8 12zm8-4a.5.5 0 0 1-.5.5H14a.5.5 0 0 1 0-1h1.5A.5.5 0 0 1 16 8zM2 8a.5.5 0 0 1-.5.5H0a.5.5 0 0 1 0-1h1.5A.5.5 0 0 1 2 8z"/>
                </svg>Light Theme
              </div>
            ) : "🌙 Dark Theme"}
          </button>

          <div style={{ position: "relative" }}>
            <button style={{ ...styles.accountButton, backgroundColor: activeTheme.boxBg, borderColor: activeTheme.border, color: activeTheme.textTitle, display: "flex", alignItems: "center" }} onClick={() => setShowAccountMenu(!showAccountMenu)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: "6px" }}>
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1c-2.667 0-8 1.333-8 4v1h16v-1c0-2.667-5.333-4-8-4z"/>
              </svg>My Account ▼
            </button>

            {showAccountMenu && (
              <div style={{ ...styles.accountDropdown, backgroundColor: activeTheme.dropdownBg, borderColor: activeTheme.border }}>
                <button style={{ ...styles.dropdownItem, color: activeTheme.textTitle, borderBottom: `1px solid ${activeTheme.border}` }} onClick={() => { setShowProfile(!showProfile); setShowAccountMenu(false); }}>My Profile</button>
                <button style={{ ...styles.dropdownItem, color: activeTheme.textTitle, borderBottom: `1px solid ${activeTheme.border}` }} onClick={() => { setShowChangePassword(true); setShowAccountMenu(false); }}>Change Password</button>
                <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <div style={{ background: "#3f3f46", padding: "14px", borderRadius: "14px", marginBottom: "16px", color: "#ffffff", fontWeight: "700", fontSize: "24px", textAlign: "center", border: "1px solid #6b7280", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 16 16" style={{ marginRight: "10px" }}><path d="M4 1h8a1 1 0 0 1 1 1v2h1a1 1 0 0 1 1 1v2h-2V5H3v8h5v2H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h1V2a1 1 0 0 1 1-1zm1 3h6V2H5v2z"/></svg>
              <span>Canvas Tool Box</span>
            </div>
          </div>

          {userRole !== "viewer" && (
            <button style={{ ...styles.sectionBtn, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: showEmployeeDetails ? "#a855f7" : (isDarkTheme ? "#e2e8f0" : "#0f172a") }} onClick={() => setShowEmployeeDetails(!showEmployeeDetails)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.364 4.56 9 9 0 015.12 17.804z" /></svg>
                <span>Employee Details</span>
              </div><span>{showEmployeeDetails ? "▲" : "▼"}</span>
            </button>
          )}

          {(userRole === "admin" || userRole === "operator") && (
            <button style={{ ...styles.sectionBtn, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: showWorkflowControls ? "#a855f7" : (isDarkTheme ? "#e2e8f0" : "#0f172a") }} onClick={() => setShowWorkflowControls(!showWorkflowControls)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l1.45.63a1 1 0 00.8 0l1.45-.63a1 1 0 011.35.936l.16 1.57a1 1 0 00.57.81l1.39.7a1 1 0 01.44 1.34l-.73 1.4a1 1 0 000 .92l.73 1.4a1 1 0 01-.44 1.34l-1.39.7a1 1 0 00-.57.81l-.16 1.57a1 1 0 01-1.35.936l-1.45-.63a1 1 0 00-.8 0l-1.45.63a1 1 0 01-1.35-.936l-.16-1.57a1 1 0 00-.57-.81l-1.39-.7a1 1 0 01-.44-1.34l.73-1.4a1 1 0 000-.92l-.73-1.4a1 1 0 01.44-1.34l1.39-.7a1 1 0 00.57-.81l.16-1.57z" /></svg>
                <span>Workflow Controls</span>
              </div><span>{showWorkflowControls ? "▲" : "▼"}</span>
            </button>
          )}
          
          {(userRole === "admin" || userRole === "operator") && showWorkflowControls && (
            <div style={{ ...styles.box, backgroundColor: activeTheme.boxBg, borderColor: activeTheme.border }}>
              <p style={{ ...styles.helperText, color: activeTheme.textSub }}>Drag blocks into the workspace canvas panel:</p>
              {["email", "pdf", "delay", "sms", "condition"].map((t)=>(
                <div key={t} draggable onDragStart={(e)=>onDragStart(e,t)} style={{ ...styles.drag, backgroundColor: activeTheme.nodeBg, color: activeTheme.nodeText, borderColor: activeTheme.border }}>
                  {t === "email" ? "📧 Email Node" : t === "pdf" ? "📄 PDF Node" : t === "delay" ? "⏳ Delay Node" : t === "condition" ? "🔀 Condition Node" : "📱 SMS Node"}
                </div>
              ))}
              <div style={{ ...styles.actionDivider, backgroundColor: activeTheme.border }}></div>
              
              {(userRole === "admin" || userRole === "operator") && ( 
                <button onClick={saveWorkflow} style={styles.action}>Save Workflow</button> 
              )}
              
              {(userRole === "admin" || userRole === "operator") && (
                <button onClick={runWorkflow} disabled={isRunning} style={{ ...styles.action, opacity: isRunning ? 0.6 : 1, cursor: isRunning ? "not-allowed" : "pointer" }}>
                  {isRunning ? "⏳ Executing Loop..." : "Run Workflow"}
                </button>
              )}
              <button onClick={deleteSelectedNode} style={styles.delete}>Delete Selected Node</button>
            </div>
          )}

          {userRole === "admin" && (
            <button style={{ ...styles.sectionBtn, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: showSavedWorkflows ? "#a855f7" : (isDarkTheme ? "#e2e8f0" : "#0f172a") }} onClick={() => setShowSavedWorkflows(!showSavedWorkflows)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                <span>Saved Workflows</span>
              </div><span>{showSavedWorkflows ? "▲" : "▼"}</span>
            </button>
          )}
          
          {userRole === "admin" && showSavedWorkflows && (
            <div style={{ ...styles.box, backgroundColor: activeTheme.boxBg, borderColor: activeTheme.border }}>
              {savedWorkflows.length === 0 ? <p style={styles.emptyText}>No saved flows detected.</p> :
                savedWorkflows.map((wf,i)=><div key={i} style={{ ...styles.card, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} onClick={()=>loadWorkflow(wf.name)}>📁 {wf.name}</div>)
              }
            </div>
          )}

          {/* User Management Privilege Button Trigger */}
          {userRole === "admin" && (
            <button
              style={{ ...styles.sectionBtn, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: showUserManagement ? "#a855f7" : (isDarkTheme ? "#e2e8f0" : "#0f172a") }}
              onClick={() => setShowUserManagement(!showUserManagement)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>👥 <span>User Management</span></div>
              <span>{showUserManagement ? "▲" : "▼"}</span>
            </button>
          )}

          {userRole === "admin" && (
            <button style={{ ...styles.sectionBtn, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: showHistory ? "#a855f7" : (isDarkTheme ? "#e2e8f0" : "#0f172a") }} onClick={() => setShowHistory(!showHistory)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h13v6M9 5v6h13V5M4 5h.01M4 11h.01M4 17h.01" /></svg>
                <span>Execution History</span>
              </div><span>{showHistory ? "▲" : "▼"}</span>
            </button>
          )}
          
          {userRole === "admin" && showHistory && (
            <div style={{ ...styles.box, backgroundColor: activeTheme.boxBg, borderColor: activeTheme.border }}>
              {history.length === 0 ? <p style={styles.emptyText}>No execution tracking available.</p> :
                history.map((item,i)=><div key={i} style={{ ...styles.card, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }}><strong>{item.workflow_name}</strong><br/><span style={{ fontSize: "11px", color: "#a855f7" }}>{item.status}</span></div>)
              }
            </div>
          )}

          {/* Redirection Navigation Box */}
          {userRole === "admin" && showUserManagement && (
            <div style={{ ...styles.box, backgroundColor: activeTheme.boxBg, borderColor: activeTheme.border }}>
              <button style={styles.action} onClick={() => navigate("/user-management")}>
                Create / Manage Users
              </button>
            </div>
          )}
        </div>

        {/* WORKSPACE CANVAS PANEL */}
        <div ref={reactFlowWrapper} style={{ ...styles.canvas, backgroundColor: activeTheme.canvasBg, borderColor: activeTheme.canvasBorder, display: "flex", flexDirection: "column" }}>
          {showEmployeeDetails && userRole !== "viewer" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", padding: "15px", marginBottom: "0px" }}>
              <input placeholder="Workflow Name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} />
              <input placeholder="Employee Name" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} />
              <div>
                <input placeholder="Employee Email" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, border: employeeEmail && !employeeEmail.includes("@gmail.com") ? "1px solid red" : `1px solid ${activeTheme.border}` }} />
                {employeeEmail && !employeeEmail.includes("@gmail.com") && ( <p style={{ color: "red", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>Enter valid Gmail address</p> )}
              </div>
              <div>
                <input placeholder="Employee Phone" value={employeePhone} onChange={(e) => { setEmployeePhone(e.target.value.replace(/\D/g, "")); }} maxLength={10} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, border: employeePhone && employeePhone.length !== 10 ? "1px solid red" : `1px solid ${activeTheme.border}` }} />
                {employeePhone && employeePhone.length !== 10 && ( <p style={{ color: "red", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>Phone number must be 10 digits</p> )}
              </div>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border, cursor: "pointer" }}>
                <option value="">Select Role</option>
                <option value="Python Developer">Python Developer</option>
                <option value="AI/ML">AI/ML</option>
                <option value="SAP ABAP">SAP ABAP</option>
                <option value="SAP BASIS">SAP BASIS</option>
              </select>
              <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} />
            </div>
          )}

          <div style={{ flex: 1, position: "relative" }}>
            <div style={styles.canvasBadge}>WORKFLOW PLAYGROUND CANVAS</div>
            {isRunning && (
              <div style={styles.canvasLoaderOverlay}>
                <div style={styles.spinner}></div>
                <div style={styles.loaderText}>Processing Automation Chain...</div>
              </div>
            )}
            {showWelcome && nodes.length === 0 && (
              <div style={styles.welcome}>
                <h1 style={{ fontSize: "32px", margin: 0, fontWeight: "800", color: "#d4d4d8", letterSpacing: "0.5px" }}>Workspace Canvas Panel</h1>
                <p style={{ fontSize: "14px", marginTop: "10px", color: "#a1a1aa" }}>Drag action components from the Workflow Controls menu to arrange visual loops</p>
              </div>
            )}

            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={setReactFlowInstance} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver}
              onNodeClick={(e,node)=>{setSelectedNode(node.id); if(window.confirm("Edit this node configuration?")) editNode(node);}}
              onEdgeClick={(e,edge)=>{if(window.confirm("Remove this link pathway?")) setEdges((eds)=>eds.filter((x)=>x.id!==edge.id));}}
              fitView
            >
              <Controls style={{ backgroundColor: isDarkTheme ? '#1e1e2e' : '#ffffff', border: `1px solid ${activeTheme.border}`, borderRadius: '4px', color: activeTheme.textTitle }} />
              <Background color={activeTheme.dotColor} gap={20} size={1} variant="dots" />
            </ReactFlow>

            <div style={{ background: "#18181b", color: "#fff", padding: "15px", margin: "10px", borderRadius: "8px", maxHeight: "180px", overflowY: "auto" }}>
              <h3>Execution Logs</h3>
              {executionLogs.length === 0 ? ( <p>No logs available</p> ) : ( executionLogs.map((log, index) => ( <div key={index}>{log}</div> )) )}
            </div>
          </div>
        </div>
      </div>

      {showChangePassword && (
        <div style={{ position: "absolute", top: "90px", right: "20px", zIndex: 1000 }}>
          <div style={{ ...styles.passwordModal, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
            <h2 style={{ marginBottom: "10px", color: activeTheme.textTitle, fontSize: "20px", fontWeight: "700" }}>Change Password</h2>
            <input type="password" placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ ...styles.modalInput, backgroundColor: activeTheme.mainBg, borderColor: activeTheme.border, color: activeTheme.textTitle }} />
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ ...styles.modalInput, backgroundColor: activeTheme.mainBg, borderColor: activeTheme.border, color: activeTheme.textTitle }} />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ ...styles.modalInput, backgroundColor: activeTheme.mainBg, borderColor: activeTheme.border, color: activeTheme.textTitle }} />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={handlePasswordChange} style={styles.saveButton}>Update Password</button>
              <button onClick={() => setShowChangePassword(false)} style={{ ...styles.cancelButton, backgroundColor: isDarkTheme ? "#27272a" : "#cbd5e1", color: activeTheme.textTitle }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  main: { width: "100vw", height: "100vh", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: "background-color 0.3s ease" },
  topBar: { height: "90px", borderBottom: "1px solid", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 30px", boxSizing: "border-box", transition: "background-color 0.3s ease, border-color 0.3s ease" },
  headerLeftSpacer: { width: "220px", display: "flex" },
  brandTitleWrap: { display: "flex", flexDirection: "column", textAlign: "center", alignItems: "center", justifyContent: "center", flex: 1 },
  heroTitle: { fontSize: "22px", margin: 0, fontWeight: "900", letterSpacing: "0.8px", transition: "color 0.3s ease" },
  heroSub: { margin: "4px 0 0 0", fontSize: "12px", fontWeight: "400", transition: "color 0.3s ease" },
  themeToggleBtn: { border: "1px solid", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.3s ease" },
  topRightSection: { display: "flex", alignItems: "center", gap: "12px" },
  accountButton: { border: "1px solid", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.3s ease" },
  accountDropdown: { position: "absolute", top: "45px", right: 0, border: "1px solid", borderRadius: "8px", width: "200px", overflow: "hidden", zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  dropdownItem: { width: "100%", padding: "12px", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontSize: "13px", transition: "background-color 0.2s" },
  logoutButton: { width: "100%", padding: "12px", background: "#ef4444", border: "none", color: "#ffffff", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  content: { display: "flex", height: "calc(100vh - 90px)", padding: "20px", gap: "20px", boxSizing: "border-box" },
  sidebar: { width: "320px", paddingRight: "4px", overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px" },
  sectionBtn: { width: "100%", padding: "14px", border: "1px solid", borderRadius: "8px", fontWeight: "600", textAlign: "left", cursor: "pointer", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.3s ease" },
  box: { padding: "16px", borderRadius: "8px", border: "1px solid", display: "flex", flexDirection: "column", gap: "10px", transition: "all 0.3s ease" },
  helperText: { margin: "0 0 4px 0", fontSize: "12px" },
  emptyText: { margin: 0, fontSize: "12px", color: "#71717a", textAlign: "center", padding: "10px 0" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid", fontSize: "13px", boxSizing: "border-box", outline: "none" },
  drag: { padding: "12px", borderRadius: "6px", textAlign: "center", cursor: "grab", fontSize: "13px", fontWeight: "500", border: "1px solid" },
  actionDivider: { height: "1px", margin: "8px 0" },
  action: { width: "100%", padding: "10px", border: "1px solid #3b82f6", borderRadius: "6px", background: "transparent", color: "#3b82f6", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" },
  delete: { width: "100%", padding: "10px", border: "1px solid #ef4444", borderRadius: "6px", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  card: { padding: "12px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontSize: "13px" },
  canvas: { flex: 1, position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid", transition: "all 0.3s ease" },
  canvasBadge: { position: "absolute", top: "15px", left: "15px", zIndex: 10, background: "#52525b", border: "1px solid #3f3f46", color: "#a1a1aa", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" },
  canvasLoaderOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(9, 9, 11, 0.75)", zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" },
  spinner: { border: "4px solid rgba(168, 85, 247, 0.2)", borderTop: "4px solid #a855f7", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", marginBottom: "16px" },
  loaderText: { color: "#ffffff", fontSize: "14px", fontWeight: "600", letterSpacing: "0.5px" },
  welcome: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10, textAlign: "center", width: "80%", pointerEvents: "none" },
  passwordModal: { padding: "24px", borderRadius: "12px", width: "360px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid" },
  modalInput: { padding: "10px 14px", borderRadius: "6px", border: "1px solid", outline: "none", fontSize: "13px" },
  saveButton: { flex: 1, padding: "10px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  cancelButton: { flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }
};

export default function App() {
  return (
    <ReactFlowProvider>
      <Routes>
        <Route path="/" element={<WorkflowBuilder />} />
        <Route path="/dashboard" element={<WorkflowBuilder />} />
        <Route path="/user-management" element={<UserManagement />} />
      </Routes>
    </ReactFlowProvider>
  );
}