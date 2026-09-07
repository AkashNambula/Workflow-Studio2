import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
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
import ConditionNodeCustom from "./ConditionNodeCustom";
import AdminDashboard from "./AdminDashboard";
import SavedWorkflowsPage from "./SavedWorkflowsPage";
import ExecutionHistoryPage from "./ExecutionHistoryPage";
import MyProfile from "./MyProfile";
import AnalyticsPage from "./AnalyticsPage";
import ChatWidget from "./components/chat/ChatWidget";
import { getValidAuthToken, handleUnauthorized } from "./authSession";

let nodeId = 1;

const nodeTypes = {
  condition_node_custom: ConditionNodeCustom
};

function WorkflowBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const reactFlowWrapper = useRef(null);
  const joiningDateInputRef = useRef(null);
  
  // 🟢 FIXED 1: Keeping state bindings matched with use context parameters
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
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
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
  const [, setLastSavedAt] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const notificationIdRef = useRef(0);
  const [confirmState, setConfirmState] = useState({ open: false, message: "", resolve: null });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchHistory = async () => {
    const token = getValidAuthToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    try {
      const res = await axios.get("http://127.0.0.1:8000/history", { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data);
    } catch (e) {
      if (handleUnauthorized(e, navigate)) return;
      console.error(e);
    }
  };

  const fetchSavedWorkflows = async () => {
    const token = getValidAuthToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    try {
      const res = await axios.get("http://127.0.0.1:8000/workflows", { headers: { Authorization: `Bearer ${token}` } });
      setSavedWorkflows(res.data);
    } catch (e) {
      if (handleUnauthorized(e, navigate)) return;
      console.error(e);
    }
  };

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) { navigate("/login"); return; }
    
    (async () => {
      await fetchHistory();
      await fetchSavedWorkflows();
    })();

    const timer = setTimeout(() => setShowWelcome(false), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const openJoiningDatePicker = () => {
    const input = joiningDateInputRef.current;
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  const loadWorkflow = async (name) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:8000/workflow/${name}`, { headers: { Authorization: `Bearer ${token}` } });
      setWorkflowName(res.data.name || "");
      setNodes((res.data.nodes || []).map((node) => ({
        id: node.id,
        type: node.type === "condition" ? "condition_node_custom" : "default",
        position: node.position || { x: 200, y: 100 },
        data: {
          label: node.type === "email" ? "📧 Email Node"
            : node.type === "delay" ? `⏳ Delay (${node.delay || 5}s)`
            : node.type === "pdf" ? "📄 PDF Node"
            : node.type === "condition" ? "🔀 Employee Validation Node"
            : "📱 SMS Node",
          subject: node.subject || "",
          message: node.message || "",
          delay: node.delay || 0,
          pdfTitle: node.pdf_title || "",
          pdfBody: node.pdf_body || "",
          smsMessage: node.message || "",
          toAddress: node.toAddress || "",
          phoneNumber: node.phoneNumber || "",
          expectedName: "",
          expectedEmail: ""
        },
        style: {
          background: isDarkTheme ? "#1f1f2e" : "#ffffff",
          color: isDarkTheme ? "#ffffff" : "#0f172a",
          border: "1px solid #3f3f46",
          borderRadius: "8px",
          padding: "10px"
        }
      })));
      setEdges((res.data.edges || []).map((e, i) => ({
        ...e,
        id: e.id || `edge-${i}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: isDarkTheme ? "#ffffff" : "#0f172a" },
        style: { stroke: isDarkTheme ? "#ffffff" : "#0f172a", strokeWidth: 2 }
      })));
    } catch (e) {
      console.error(e);
    }
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params, type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: isDarkTheme ? "#ffffff" : "#0f172a" },
    style: { stroke: isDarkTheme ? "#ffffff" : "#0f172a", strokeWidth: 2 }
  }, eds)), [setEdges, isDarkTheme]);

  // Track if we've already loaded workflow from navigation state to avoid infinite loops
  const hasLoadedFromHistory = useRef(false);

  // Load workflow from navigation state when coming from Execution History
  useEffect(() => {
    const workflowNameFromHistory = location.state?.workflowName;
    if (workflowNameFromHistory && !hasLoadedFromHistory.current) {
      hasLoadedFromHistory.current = true;
      loadWorkflow(workflowNameFromHistory);
      // Clear the navigation state to prevent reloading on re-renders
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const createDefaultNodeData = (type) => {
    if (type === "email") return { label: "📧 Email Node", toAddress: "", subject: "", message: "" };
    if (type === "delay") return { label: "⏳ Delay (5s)", delay: 5 };
    if (type === "pdf") return { label: "📄 PDF Node", pdfTitle: "" };
    if (type === "condition") return { label: "🔀 Employee Validation Node", expectedName: "", expectedEmail: "" };
    if (type === "http") return { label: "🌐 HTTP Request Node", method: "GET", url: "", payload: "" };
    return { label: "📱 SMS Node", phoneNumber: "", smsMessage: "" };
  };

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    if (!type || !reactFlowInstance) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const data = createDefaultNodeData(type);
    const isCondition = type === "condition";
    const newNode = {
      id: String(nodeId++),
      type: isCondition ? "condition_node_custom" : "default",
      position,
      data,
      style: {
        background: isDarkTheme ? "#1e1e2e" : "#ffffff",
        color: isDarkTheme ? "#ffffff" : "#0f172a",
        border: "1px solid #3f3f46",
        borderRadius: "8px",
        padding: "10px"
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode.id);
    setSelectedNodeData(newNode);
    setShowConfigPanel(true);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return addNotification("Select a node first", "error");
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
    setShowConfigPanel(false);
    setSelectedNodeData(null);
  };

  const saveWorkflow = async () => {
    if (hasOrphans) { addNotification("Cannot save: some nodes are not connected.", "error"); return; }
    if (!workflowName || !employeeName || !employeeEmail || !employeePhone) { addNotification("Please complete required workflow and employee fields.", "error"); return; }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:8000/create-workflow",
        {
          name: workflowName || "Notification Workflow",
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type === "condition_node_custom" ? "condition"
              : node.data.label.includes("Email") ? "email"
              : node.data.label.includes("Delay") ? "delay"
              : node.data.label.includes("PDF") ? "pdf"
              : node.data.label.includes("HTTP") ? "http"
              : "sms",
            delay: node.data.delay || 0,
            subject: node.data.subject || "",
            message: node.data.message || node.data.smsMessage || "",
            pdf_title: node.data.pdfTitle || "",
            pdf_body: node.data.pdfBody || "",
            toAddress: node.data.toAddress || "",
            phoneNumber: node.data.phoneNumber || "",
            expectedName: "",
            expectedEmail: "",
            method: node.data.method || "",
            url: node.data.url || "",
            payload: node.data.payload || "",
            position: node.position
          })),
          edges: edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            id: edge.id,
            sourceHandle: edge.sourceHandle || null
          }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addNotification("Workflow saved successfully", "success");
      setLastSavedAt(new Date().toISOString());
      fetchSavedWorkflows();
    } catch (e) {
      console.error(e);
    }
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedNodeData(null);
    setShowConfigPanel(false);
  };

  const exportWorkflow = () => {
    const payload = {
      name: workflowName || "exported-workflow",
      nodes: nodes.map((node) => ({ id: node.id, type: node.type, position: node.position, data: node.data })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, id: e.id }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.name || 'workflow'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const runWorkflow = async () => {
    if (isRunning) return;
    if (!workflowName || !employeeName || !employeeEmail || !employeePhone) { addNotification("Please fill workflow and employee fields before running.", "error"); return; }
    const token = getValidAuthToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    setIsRunning(true);
    setExecutionLogs([]);
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/run-workflow/${workflowName || "Notification Workflow"}`,
        { employees: [{ name: employeeName, email: employeeEmail, phone: employeePhone, role: role, joining_date: joiningDate }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { run_id } = response.data;
      setExecutionLogs([`🚀 Run initialized with unique Trace ID: ${run_id}`]);
      setIsRunning(false);
      if (run_id) {
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/runs/${run_id}`);
        ws.onmessage = (event) => {
          const logData = JSON.parse(event.data);
          const currentStatus = String(logData.status).toUpperCase();
          setExecutionLogs((prev) => [...prev, `[Live Event Log] Node ${logData.node_id} execution state turned -> ${currentStatus}`]);
          setNodes((nds) => {
            const updatedNodes = nds.map((node) => {
              if (String(node.id) === String(logData.node_id)) {
                let borderStrokeColor = "#3b82f6";
                if (currentStatus === "COMPLETED") borderStrokeColor = "#22c55e";
                if (currentStatus === "FAILED") borderStrokeColor = "#ef4444";
                return {
                  ...node,
                  style: {
                    ...node.style,
                    border: `3px solid ${borderStrokeColor}`,
                    boxShadow: `0 0 20px ${borderStrokeColor}`,
                    background: isDarkTheme ? "#1f1f2e" : "#ffffff",
                    transition: "all 0.2s ease-in-out"
                  }
                };
              }
              return node;
            });
            return [...updatedNodes];
          });
        };
        ws.onclose = () => { setExecutionLogs((prev) => [...prev, "🔌 Live execution background tracking closed."]); };
      }
      addNotification("Workflow execution kicked off live!", "success");
      fetchHistory();
    } catch (e) {
      setIsRunning(false);
      if (handleUnauthorized(e, navigate)) return;
      console.error(e);
      const detail = e.response?.data?.detail;
      addNotification(
        detail ? `Workflow execution failed: ${detail}` : "Workflow execution failed. Please verify configurations.",
        "error"
      );
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) { addNotification("Please fill all fields", "error"); return; }
    if (newPassword !== confirmPassword) { addNotification("Passwords do not match", "error"); return; }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch("http://127.0.0.1:8000/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, old_password: oldPassword, new_password: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        addNotification("Password updated successfully", "success");
        setShowChangePassword(false);
        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      } else { addNotification(data.detail || "Password update failed", "error"); }
    } catch (error) { console.error(error); addNotification("Server error", "error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const addNotification = (message, type = "info") => {
    const id = ++notificationIdRef.current;
    setNotifications((n) => [...n, { id, message, type }]);
    setTimeout(() => setNotifications((n) => n.filter((x) => x.id !== id)), 3000);
  };

  useEffect(() => {
    const handler = (e) => {
      const { message, resolve } = e.detail || {};
      setConfirmState({ open: true, message: message || "Confirm?", resolve });
    };
    window.addEventListener("app-confirm", handler);
    window.appConfirm = (message) => new Promise((resolve) => {
      window.dispatchEvent(new CustomEvent("app-confirm", { detail: { message, resolve } }));
    });
    return () => {
      window.removeEventListener("app-confirm", handler);
      // 🟢 FIXED 3: Removed catch blocks parameters
     try {
  delete window.appConfirm;
} catch {
  console.error("Unable to remove appConfirm");
}
    };
  }, []);

  const handleConfirm = (ok) => {
    if (confirmState.resolve) confirmState.resolve(ok);
    setConfirmState({ open: false, message: "", resolve: null });
  };

  const handleConfigSave = () => {
    if (!selectedNodeData) return;
    let updatedData = { ...selectedNodeData.data };
    const type = getNodeType(selectedNodeData);

    if (updatedData.label.includes("Delay") || updatedData.delay !== undefined) {
      updatedData.label = `⏳ Delay (${updatedData.delay || 0}s)`;
    }

    const errors = validateNodeData({ ...selectedNodeData, data: updatedData });
    if (errors.length > 0) {
      setSelectedNodeErrors(errors);

      if (type === "email") {
        addNotification(
          !updatedData.toAddress?.trim()
            ? "Please enter an email address first."
            : "Please enter a valid email address first.",
          "error"
        );
      } else if (type === "sms") {
        const phoneDigits = (updatedData.phoneNumber || "").replace(/\D/g, "");
        if (!phoneDigits) {
          addNotification("Please enter a phone number first.", "error");
        } else if (phoneDigits.length !== 10) {
          addNotification("Please enter a valid phone number first.", "error");
        } else {
          addNotification("Please enter a message first.", "error");
        }
      } else if (type === "pdf") {
        addNotification("Please complete the required PDF details first.", "error");
      } else if (type === "delay") {
        addNotification("Please enter a valid delay value first.", "error");
      }

      return;
    }
    setSelectedNodeErrors([]);

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeData.id ? { ...n, data: updatedData } : n
      )
    );
    setSelectedNodeData((prev) => (prev ? { ...prev, data: updatedData } : prev));

    const successMessages = {
      email: "Email node saved successfully.",
      sms: "SMS node saved successfully.",
      pdf: "PDF node saved successfully.",
      delay: "Delay node saved successfully."
    };
    if (successMessages[type]) addNotification(successMessages[type], "success");

    setShowConfigPanel(false);
  };

  const handleNodeClick = (e, node) => {
    const currentNode = nodes.find((n) => n.id === node.id) || node;
    setSelectedNode(node.id);
    setSelectedNodeData(currentNode);
    setShowConfigPanel(true);
  };

  // Save handler for Employee Details panel (UI-only: validates and closes panel)
  const handleEmployeeSave = () => {
    const requiredDetails = [workflowName, employeeName, employeeEmail, employeePhone, role, joiningDate];
    if (requiredDetails.some((detail) => !detail.trim())) {
      addNotification("Please fill in all required employee details before saving.", "error");
      return;
    }

    // Basic validation: email must contain '@' and phone (if present) should be 10 digits
    const emailOk = !employeeEmail || employeeEmail.includes("@");
    const phoneDigits = (employeePhone || "").replace(/\D/g, "");
    const phoneOk = !employeePhone || phoneDigits.length === 10;
    if (!emailOk) {
      addNotification("Please enter a valid email address.", "error");
      return;
    }
    if (!phoneOk) {
      addNotification("Phone number must contain exactly 10 digits.", "error");
      return;
    }

    // UI-only save: show success and close the panel. Do not call backend.
    addNotification("Employee details saved.", "success");
    setShowEmployeeDetails(false);
  };

  const getNodeType = (nodeData) => {
    if (!nodeData) return "sms";
    const label = nodeData.data?.label || "";
    if (label.includes("Email")) return "email";
    if (label.includes("Delay")) return "delay";
    if (label.includes("PDF")) return "pdf";
    if (label.includes("Condition") || label.includes("Validation")) return "condition";
    if (label.includes("HTTP")) return "http";
    return "sms";
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

  const updateField = (field, value) => {
    setSelectedNodeData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, data: { ...prev.data, [field]: value } };
      const errs = validateNodeData(updated);
      setSelectedNodeErrors(errs);
      return updated;
    });
  };

  const nodeType = getNodeType(selectedNodeData);

  const [selectedNodeErrors, setSelectedNodeErrors] = useState([]);

  const validateNodeData = (node) => {
    if (!node) return [];
    const updatedData = node.data || {};
    const type = getNodeType(node);
    const errors = [];
    if (type === "email") {
      if (!updatedData.toAddress || !updatedData.toAddress.includes("@")) errors.push("To Address must be a valid email");
    }
    if (type === "delay") {
      if (updatedData.delay === undefined || Number.isNaN(updatedData.delay) || updatedData.delay < 1) errors.push("Delay must be at least 1 second");
    }
    if (type === "sms") {
      const digits = (updatedData.phoneNumber || "").replace(/\D/g, "");
      if (!digits || digits.length !== 10) errors.push("Phone number must contain exactly 10 digits");
      if (!updatedData.smsMessage) errors.push("Message is required");
    }
    if (type === "http") {
      if (!updatedData.url || !/^https?:\/\//.test(updatedData.url)) errors.push("URL must start with http:// or https://");
      if (updatedData.payload) {
        try {
  JSON.parse(updatedData.payload);
} catch {
  errors.push("JSON payload is invalid");
}
      }
    }
    if (type === "pdf") {
      if (!updatedData.pdfTitle) errors.push("Document title is required");
    }
    return errors;
  };

  const getFieldError = (field) => {
    if (!selectedNodeErrors || selectedNodeErrors.length === 0) return null;
    const map = {
      toAddress: ["To Address", "email", "recipient", "To Address"],
      delay: ["Delay must"],
      phoneNumber: ["Phone number"],
      smsMessage: ["Message is required"],
      url: ["URL must"],
      payload: ["JSON payload"],
      pdfTitle: ["Document title"]
    };
    for (const err of selectedNodeErrors) {
      const tests = map[field] || [];
      for (const t of tests) if (err.toLowerCase().includes(t.toLowerCase())) return err;
    }
    return null;
  };

  useEffect(() => {
    setSelectedNodeErrors(validateNodeData(selectedNodeData));
  }, [selectedNodeData]);

  const [hasOrphans, setHasOrphans] = useState(false);
  const [orphanTooltip, setOrphanTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

  useEffect(() => {
    const connected = new Set();
    edges.forEach((e) => { if (e.source) connected.add(String(e.source)); if (e.target) connected.add(String(e.target)); });
    const updated = nodes.map((n) => {
      const isOrphan = !connected.has(String(n.id));
      const baseStyle = n.style || {};
      let label = n.data?.label || "";
      if (isOrphan && !label.includes("Not connected")) label = `${label} — ⚠ Not connected`;
      if (!isOrphan && label.includes("Not connected")) label = label.replace(/\s*—\s*⚠?\s*Not connected/g, "");
      return {
        ...n,
        style: {
          ...baseStyle,
          border: isOrphan ? "2px dashed #ef4444" : (baseStyle.border || "1px solid #3f3f46")
        },
        data: {
          ...n.data,
          label,
          __isOrphan: isOrphan
        }
      };
    });
    
    setNodes(() => updated);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasOrphans(updated.some((n) => n.data && n.data.__isOrphan));
  }, [nodes.length, edges]);

  const handleNodeMouseEnter = (e) => {
    if (e?.data?.__isOrphan) {
      setOrphanTooltip({ visible: true, x: e.clientX, y: e.clientY, text: 'Not connected' });
    }
  };
  const handleNodeMouseMove = (e) => {
    if (orphanTooltip.visible) setOrphanTooltip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
  };
  const handleNodeMouseLeave = () => {
    if (orphanTooltip.visible) setOrphanTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  return (
    <div style={{ ...styles.main, background: activeTheme.mainBg }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      {/* TOP BAR */}
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
                {userRole === "admin" && (
                  <button style={{ ...styles.dropdownItem, color: activeTheme.textTitle, borderBottom: `1px solid ${activeTheme.border}` }} onClick={() => { setShowAccountMenu(false); window.location.href = "/admin-dashboard"; }}>Dashboard</button>
                )}
                <button style={{ ...styles.dropdownItem, color: activeTheme.textTitle, borderBottom: `1px solid ${activeTheme.border}` }} onClick={() => { setShowProfile(!showProfile); setShowAccountMenu(false); }}>My Profile</button>
                <button style={{ ...styles.dropdownItem, color: activeTheme.textTitle, borderBottom: `1px solid ${activeTheme.border}` }} onClick={() => { setShowChangePassword(true); setShowAccountMenu(false); }}>Change Password</button>
                <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* SIDEBAR */}
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
              {["email", "pdf", "delay", "sms", "condition"].map((t) => (
                <div key={t} draggable onDragStart={(e) => onDragStart(e, t)} style={{ ...styles.drag, backgroundColor: activeTheme.nodeBg, color: activeTheme.nodeText, borderColor: activeTheme.border }}>
                  {t === "email" ? "📧 Email Node" : t === "pdf" ? "📄 PDF Node" : t === "delay" ? "⏳ Delay Node" : t === "condition" ? "🔀 Condition Node" : "📱 SMS Node"}
                </div>
              ))}
              <div style={{ ...styles.actionDivider, backgroundColor: activeTheme.border }}></div>
              {(userRole === "admin" || userRole === "operator") && (
                <button onClick={saveWorkflow} disabled={hasOrphans} style={{ ...styles.action, marginBottom: 8 }}>Save Workflow</button>
              )}
              {(userRole === "admin" || userRole === "operator") && (
                <button onClick={runWorkflow} disabled={isRunning} style={{ ...styles.action, marginBottom: 8 }}>{isRunning ? "⏳ Executing Loop..." : "Run Workflow"}</button>
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
                savedWorkflows.map((wf, i) => (
                  <div key={i} style={{ ...styles.card, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} onClick={() => loadWorkflow(wf.name)}>📁 {wf.name}</div>
                ))
              }
            </div>
          )}

          {userRole === "admin" && (
            <button style={{ ...styles.sectionBtn, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: showUserManagement ? "#a855f7" : (isDarkTheme ? "#e2e8f0" : "#0f172a") }} onClick={() => setShowUserManagement(!showUserManagement)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h4a4 4 0 014 4v2H9zm0-10a4 4 0 100-8 4 4 0 000 8zm8 2a3 3 0 100-6 3 3 0 000 6z" /></svg>
                <span>User Management</span>
              </div>
              <span>{showUserManagement ? "▲" : "▼"}</span>
            </button>
          )}

          {userRole === "admin" && showUserManagement && (
            <div style={{ ...styles.box, backgroundColor: activeTheme.boxBg, borderColor: activeTheme.border }}>
              <button style={styles.action} onClick={() => navigate("/user-management")}>Create / Manage Users</button>
            </div>
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
                history.map((item, i) => (
                  <div key={i} style={{ ...styles.card, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }}>
                    <strong>{item.workflow_name}</strong><br/>
                    <span style={{ fontSize: "11px", color: "#a855f7" }}>{item.status}</span>
                  </div>
                ))
              }
            </div>
          )}

        </div>

        {/* WORKSPACE CANVAS PANEL */}
        <div ref={reactFlowWrapper} style={{ ...styles.canvas, backgroundColor: activeTheme.canvasBg, borderColor: activeTheme.canvasBorder, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={styles.canvasBadge}>WORKFLOW PLAYGROUND CANVAS</div>

            {/* Orphan tooltip */}
            {orphanTooltip.visible && (
              <div style={{ position: 'fixed', left: orphanTooltip.x + 12, top: orphanTooltip.y + 12, zIndex: 11000, background: '#ef4444', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, pointerEvents: 'none' }}>
                {orphanTooltip.text}
              </div>
            )}
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
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onInit={setReactFlowInstance} onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange} onConnect={onConnect}
              onDrop={onDrop} onDragOver={onDragOver}
              onNodeClick={handleNodeClick}
              onNodeMouseEnter={handleNodeMouseEnter}
              onNodeMouseMove={handleNodeMouseMove}
              onNodeMouseLeave={handleNodeMouseLeave}
              onEdgeClick={async (e, edge) => {
                const ok = await window.appConfirm?.("Remove this link pathway?");
                if (ok) setEdges((eds) => eds.filter((x) => x.id !== edge.id));
              }}
              fitView
            >
              <Controls style={{ backgroundColor: isDarkTheme ? "#1e1e2e" : "#ffffff", border: `1px solid ${activeTheme.border}`, borderRadius: "4px", color: activeTheme.textTitle }} />
              <Background color={activeTheme.dotColor} gap={20} size={1} variant="dots" />
            </ReactFlow>

            {/* Top-right fixed Clear / Export buttons */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 80, display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={clearCanvas} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 700, minWidth: 96 }}>Clear</button>
              <button onClick={exportWorkflow} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #64748b', background: 'rgba(148,163,184,0.08)', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, minWidth: 96 }}>Export</button>
            </div>

            {/* Notifications stack */}
            <div style={{ position: "fixed", top: 24, right: 24, zIndex: 10000, display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ minWidth: "220px", padding: "10px 12px", borderRadius: "8px", color: "#fff", background: n.type === 'error' ? '#ef4444' : n.type === 'success' ? '#16a34a' : '#2563eb', boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }}>
                  {n.message}
                </div>
              ))}
            </div>

            {/* Confirm modal */}
            {confirmState.open && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 420, background: isDarkTheme ? '#0f1724' : '#ffffff', padding: 20, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.6)', color: isDarkTheme ? '#fff' : '#0f172a' }}>
                  <div style={{ marginBottom: 12, fontWeight: 800 }}>{confirmState.message}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => handleConfirm(false)} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: `1px solid ${isDarkTheme ? '#374151' : '#cbd5e1'}`, color: isDarkTheme ? '#a1a1aa' : '#374151' }}>Cancel</button>
                    <button onClick={() => handleConfirm(true)} style={{ padding: '8px 12px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none' }}>Confirm</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "#18181b", color: "#fff", padding: "15px", margin: "10px", borderRadius: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid #27272a" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#a855f7" }}>Execution Log Stream</h3>
              {executionLogs.length === 0
                ? <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>Waiting for execution loop trace mapping vectors...</p>
                : executionLogs.map((log, index) => (
                  <div key={index} style={{ fontSize: "12px", fontFamily: "monospace", margin: "3px 0" }}>{log}</div>
                ))
              }
            </div>
          </div>
        </div>

        {showEmployeeDetails && userRole !== "viewer" && (
          <div style={{ ...styles.employeeDetailsPanel, backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ color: activeTheme.textTitle, fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Employee Details</div>
            <div style={{ padding: "0 0 12px 0", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              <input placeholder="Workflow Name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} />
              <input placeholder="Employee Name" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border }} />
              <div>
                <input placeholder="Employee Email" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, border: employeeEmail && !employeeEmail.includes("@gmail.com") ? "1px solid red" : `1px solid ${activeTheme.border}` }} />
                {employeeEmail && !employeeEmail.includes("@gmail.com") && (<p style={{ color: "red", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>Enter valid Gmail address</p>)}
              </div>
              <div>
                <input placeholder="Employee Phone" value={employeePhone} onChange={(e) => { const digits = (e.target.value || "").replace(/\D/g, "").slice(0,10); setEmployeePhone(digits); }} maxLength={10} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, border: employeePhone && employeePhone.length !== 10 ? "1px solid red" : `1px solid ${activeTheme.border}` }} />
                {employeePhone && employeePhone.length !== 10 && (<p style={{ color: "red", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>Phone number must be 10 digits</p>)}
              </div>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...styles.input, backgroundColor: activeTheme.mainBg, color: activeTheme.textTitle, borderColor: activeTheme.border, cursor: "pointer" }}>
                <option value="">Select Role</option>
                <option value="Python Developer">Python Developer</option>
                <option value="AI/ML">AI/ML</option>
                <option value="SAP ABAP">SAP ABAP</option>
                <option value="SAP BASIS">SAP BASIS</option>
              </select>
              <div style={{ ...styles.datePickerWrap, backgroundColor: activeTheme.mainBg, borderColor: activeTheme.border }}>
                <input
                  ref={joiningDateInputRef}
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="joining-date-input"
                  style={{ ...styles.dateInput, color: activeTheme.textTitle, colorScheme: isDarkTheme ? "dark" : "light" }}
                  aria-label="Joining Date"
                />
                <button
                  type="button"
                  onClick={openJoiningDatePicker}
                  style={{ ...styles.dateIconButton, color: activeTheme.textTitle, borderColor: activeTheme.border }}
                  aria-label="Open joining date calendar"
                  title="Open calendar"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              </div>
            </div>

            {/* Footer: Save / Close (UI-only, matches Node Configuration) */}
            <div style={{ padding: "16px 20px", borderTop: `1px solid ${isDarkTheme ? "#27272a" : "#e2e8f0"}`, background: isDarkTheme ? "#18181b" : "#f8fafc", display: "flex", gap: "10px" }}>
              <button
                onClick={handleEmployeeSave}
                style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#3f424c", color: "#f5f5f5", cursor: "pointer", fontSize: "13px", fontWeight: "700", letterSpacing: "0.3px" }}
              >
                ✓ Save Changes
              </button>
              <button
                onClick={() => setShowEmployeeDetails(false)}
                style={{ flex: 1, padding: "11px", borderRadius: "8px", border: `1px solid ${isDarkTheme ? "#3f3f46" : "#cbd5e1"}`, background: "transparent", color: isDarkTheme ? "#a1a1aa" : "#64748b", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CHANGE PASSWORD MODAL */}
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

      {/* RIGHT-SIDE NODE CONFIGURATION PANEL */}
      {showConfigPanel && selectedNodeData && (
        <div style={{
          position: "fixed", right: 0, top: 0,
          width: "360px", height: "100%",
          backgroundColor: isDarkTheme ? "#111118" : "#ffffff",
          color: isDarkTheme ? "#ffffff" : "#0f172a",
          borderLeft: `1px solid ${isDarkTheme ? "#27272a" : "#cbd5e1"}`,
          padding: "0", zIndex: 9999, overflowY: "auto",
          boxShadow: "-6px 0 24px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column"
        }}>
          {/* Panel Header */}
          <div style={{ padding: "20px 20px 16px 20px", borderBottom: `1px solid ${isDarkTheme ? "#27272a" : "#e2e8f0"}`, background: isDarkTheme ? "#18181b" : "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#a855f7", fontWeight: "700", letterSpacing: "0.8px", marginBottom: "4px" }}>NODE CONFIGURATION</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: isDarkTheme ? "#ffffff" : "#0f172a" }}>
                  {selectedNodeData.data.label}
                </div>
              </div>
              <button onClick={() => setShowConfigPanel(false)} style={{ background: "transparent", border: `1px solid ${isDarkTheme ? "#3f3f46" : "#cbd5e1"}`, color: isDarkTheme ? "#a1a1aa" : "#64748b", width: "32px", height: "32px", borderRadius: "6px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {/* Panel Fields */}
          <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* EMAIL NODE */}
            {nodeType === "email" && (
              <>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>To Address</label>
                  <input
                    type="email" placeholder="recipient@example.com"
                    value={selectedNodeData.data.toAddress || ""}
                    onChange={(e) => updateField("toAddress", e.target.value)}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('toAddress') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1") }}
                  />
                  {getFieldError('toAddress') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('toAddress')}</p>}
                </div>
              </>
            )}

            {/* DELAY NODE */}
            {nodeType === "delay" && (
              <div style={styles.fieldGroup}>
                <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>Delay Duration (seconds)</label>
                <input
                  type="number" placeholder="5" min="1"
                  value={selectedNodeData.data.delay || ""}
                  onChange={(e) => updateField("delay", Number(e.target.value))}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('delay') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1") }}
                />
                  {getFieldError('delay') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('delay')}</p>}
                <p style={{ fontSize: "11px", color: isDarkTheme ? "#52525b" : "#94a3b8", margin: "6px 0 0 0" }}>Workflow pauses for this many seconds before proceeding to the next node.</p>
              </div>
            )}

            {/* SMS NODE */}
            {nodeType === "sms" && (
              <>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>Phone Number</label>
                  <input
                    type="tel" placeholder="+91XXXXXXXXXX"
                    value={selectedNodeData.data.phoneNumber || ""}
                    onChange={(e) => {
                      const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                      updateField("phoneNumber", digits);
                    }}
                    maxLength={10}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('phoneNumber') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1") }}
                  />
                  {getFieldError('phoneNumber') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('phoneNumber')}</p>}
                </div>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>Message</label>
                  <textarea
                    placeholder="SMS message content..."
                    value={selectedNodeData.data.smsMessage || ""}
                    onChange={(e) => updateField("smsMessage", e.target.value)}
                    rows={4}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('smsMessage') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1"), resize: "vertical", fontFamily: "inherit" }}
                  />
                  {getFieldError('smsMessage') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('smsMessage')}</p>}
                </div>
              </>
            )}

            {/* PDF NODE */}
            {nodeType === "pdf" && (
              <>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>Document Title</label>
                  <input
                    type="text" placeholder="e.g. Offer Letter, Welcome Letter"
                    value={selectedNodeData.data.pdfTitle || ""}
                    onChange={(e) => updateField("pdfTitle", e.target.value)}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('pdfTitle') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1") }}
                  />
                  {getFieldError('pdfTitle') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('pdfTitle')}</p>}
                  <p style={{ fontSize: "11px", color: isDarkTheme ? "#52525b" : "#94a3b8", margin: "4px 0 0 0" }}>This title will appear as the heading in the generated PDF.</p>
                </div>
              </>
            )}

            {/* CONDITION NODE */}
            {nodeType === "condition" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: isDarkTheme ? "#0d1f12" : "#f0fdf4", border: `1px solid ${isDarkTheme ? "#166534" : "#86efac"}`, borderRadius: "8px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>✅</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: isDarkTheme ? "#4ade80" : "#16a34a", marginBottom: "4px" }}>System Validation Active</div>
                    <div style={{ fontSize: "12px", color: isDarkTheme ? "#86efac" : "#15803d", lineHeight: "1.5" }}>
                      This node operates as an automated validation step. It dynamically evaluates fields directly from the global employee workflow context against backend assertions.
                    </div>
                  </div>
                </div>
                <div style={{ background: isDarkTheme ? "#18181b" : "#f8fafc", border: `1px solid ${isDarkTheme ? "#3f3f46" : "#e2e8f0"}`, borderRadius: "8px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: isDarkTheme ? "#71717a" : "#94a3b8", letterSpacing: "0.6px", marginBottom: "10px" }}>AUTOMATED ROUTING PATHS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}></div>
                      <span style={{ fontSize: "12px", color: isDarkTheme ? "#d4d4d8" : "#374151" }}><strong>True Handle</strong> — Metrics match runtime criteria.</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 }}></div>
                      <span style={{ fontSize: "12px", color: isDarkTheme ? "#d4d4d8" : "#374151" }}><strong>False Handle</strong> — Target validation falls open or fails.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HTTP REQUEST NODE */}
            {nodeType === "http" && (
              <>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>Method</label>
                  <select
                    value={selectedNodeData.data.method || "GET"}
                    onChange={(e) => updateField("method", e.target.value)}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: isDarkTheme ? "#3f3f46" : "#cbd5e1", cursor: "pointer" }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>URL</label>
                  <input
                    type="url" placeholder="https://api.example.com/endpoint"
                    value={selectedNodeData.data.url || ""}
                    onChange={(e) => updateField("url", e.target.value)}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('url') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1") }}
                  />
                  {getFieldError('url') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('url')}</p>}
                </div>
                <div style={styles.fieldGroup}>
                  <label style={{ ...styles.fieldLabel, color: isDarkTheme ? "#a1a1aa" : "#64748b" }}>JSON Payload <span style={{ color: isDarkTheme ? "#52525b" : "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                  <textarea
                    placeholder={'{\n  "key": "value"\n}'}
                    value={selectedNodeData.data.payload || ""}
                    onChange={(e) => updateField("payload", e.target.value)}
                    rows={5}
                    style={{ ...styles.panelInput, backgroundColor: isDarkTheme ? "#09090b" : "#f8fafc", color: isDarkTheme ? "#ffffff" : "#0f172a", borderColor: getFieldError('payload') ? '#ef4444' : (isDarkTheme ? "#3f3f46" : "#cbd5e1"), resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
                  />
                  {getFieldError('payload') && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{getFieldError('payload')}</p>}
                </div>
              </>
            )}
          </div>

          {/* Panel Footer — Save / Close */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${isDarkTheme ? "#27272a" : "#e2e8f0"}`, background: isDarkTheme ? "#18181b" : "#f8fafc", display: "flex", gap: "10px" }}>
            <button
              onClick={handleConfigSave}
              style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: '#a855f7', color: "#ffffff", cursor: 'pointer', fontSize: "13px", fontWeight: "700", letterSpacing: "0.3px" }}
            >
              ✓ Save Changes
            </button>
            <button
              onClick={() => setShowConfigPanel(false)}
              style={{ flex: 1, padding: "11px", borderRadius: "8px", border: `1px solid ${isDarkTheme ? "#3f3f46" : "#cbd5e1"}`, background: "transparent", color: isDarkTheme ? "#a1a1aa" : "#64748b", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
            >
              Close
            </button>
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
  employeeDetailsPanel: { width: "360px", flexShrink: 0, borderRadius: "12px", border: "1px solid", padding: "16px", boxSizing: "border-box", overflowY: "auto", transition: "all 0.3s ease" },
  helperText: { margin: "0 0 4px 0", fontSize: "12px" },
  emptyText: { margin: 0, fontSize: "12px", color: "#71717a", textAlign: "center", padding: "10px 0" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid", fontSize: "13px", boxSizing: "border-box", outline: "none" },
  datePickerWrap: { width: "100%", height: "39px", borderRadius: "6px", border: "1px solid", display: "flex", alignItems: "center", overflow: "hidden", boxSizing: "border-box" },
  dateInput: { flex: 1, minWidth: 0, height: "100%", padding: "0 10px", border: "none", background: "transparent", fontSize: "13px", outline: "none", boxSizing: "border-box" },
  dateIconButton: { width: "42px", height: "100%", border: "none", borderLeft: "1px solid", background: "transparent", cursor: "pointer", fontSize: "17px", display: "flex", alignItems: "center", justifyContent: "center" },
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
  cancelButton: { flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  fieldLabel: { fontSize: "11px", fontWeight: "700", letterSpacing: "0.6px", textTransform: "uppercase" },
  panelInput: { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid", fontSize: "13px", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" }
};

export default function App() {
  return (
    <ReactFlowProvider>
      <Routes>
        <Route path="/" element={<WorkflowBuilder />} />
        <Route path="/dashboard" element={<WorkflowBuilder />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/saved-workflows" element={<SavedWorkflowsPage />} />
        <Route path="/execution-history" element={<ExecutionHistoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/my-profile" element={<MyProfile />} />
      </Routes>
      <ChatWidget />
    </ReactFlowProvider>
  );
}
