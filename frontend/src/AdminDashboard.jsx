import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  FolderOpen,
  History,
  Activity,
  ArrowLeft,
  Users,
  Briefcase,
  BadgeCheck,
  PlayCircle,
  CircleX,
  Clock,
  CalendarDays,
  Shield,
  Search,
  CheckCircle2,
  LoaderCircle,
  XCircle
  , BarChart3
} from "lucide-react";
import SavedWorkflowsPage from "./SavedWorkflowsPage";
import ExecutionHistoryPage from "./ExecutionHistoryPage";
import AnalyticsPage from "./AnalyticsPage";
import TimeRangeFilter from "./components/TimeRangeFilter";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Client-side RBAC guard: only admin can access
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = (user.role || "").toLowerCase();
    if (role !== "admin") {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      try {
        const res = await axios.get("http://127.0.0.1:8000/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDateTime = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dateNum = date.getDate();
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    return {
      date: `${dayName}, ${dateNum} ${monthName} ${year}`,
      time: `${hours}:${minutes}:${seconds} ${ampm}`
    };
  };

  const { date: dateStr, time: timeStr } = formatDateTime(currentTime);

  const theme = {
    bg: "#0B0B0F",
    panelBg: "#17181f",
    cardBg: "#1b1d26",
    border: "#2c3140",
    hover: "#232632",

    accent: "#8b5cf6",
    accentHover: "#a855f7",

    text: "#F5F5F5",
    textSub: "#9ca3af",

    success: "#22c55e",
    running: "#3b82f6",
    failed: "#ef4444"
  };

  if (loading) {
    return <LoadingState theme={theme} />;
  }

  if (error) {
    return <ErrorState theme={theme} onRetry={fetchData} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: theme.bg, color: theme.text }}>
      {/* SIDEBAR */}
      <Sidebar theme={theme} activeView={activeView} setActiveView={setActiveView} />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* HEADER */}
        <Header theme={theme} dateStr={dateStr} timeStr={timeStr} />

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <div style={{ maxWidth: "1700px", margin: "0 auto" }}>
            {activeView === "overview" && <OverviewView theme={theme} data={data} />}
            {activeView === "workflows" && <SavedWorkflowsPage />}
            {activeView === "history" && <ExecutionHistoryPage />}
            {activeView === "recent" && <RecentRunsView data={data} />}
            {activeView === "analytics" && <AnalyticsPage />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ theme, dateStr, timeStr }) {
  return (
    <div style={{
      padding: "18px 28px",
      borderBottom: `1px solid rgba(255,255,255,0.06)`,
      background: "#15151d",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ color: theme.accent }}>
          <Shield size={36} />
        </div>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "0.3px", color: theme.text }}>HR AUTOMATION WORKFLOW STUDIO</div>
          <div style={{ fontSize: "12px", color: theme.accent, fontWeight: "700", marginTop: "2px" }}>Admin Dashboard</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.textSub }}>
          <CalendarDays size={16} />
          <span style={{ fontSize: "13px", fontWeight: "600" }}>{dateStr}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.textSub }}>
          <Clock size={16} color={theme.accent} />
          <span style={{ fontSize: "12px" }}>{timeStr}</span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ theme, activeView, setActiveView }) {
  const navItems = [
    { id: "overview", label: "Dashboard Overview", Icon: LayoutDashboard },
    { id: "workflows", label: "Saved Workflows", Icon: FolderOpen },
    { id: "history", label: "Execution History", Icon: History },
    { id: "analytics", label: "Analytics", Icon: BarChart3 },
    { id: "recent", label: "Recent Runs", Icon: Activity }
  ];

  return (
    <div style={{
      width: "270px",
      background: theme.panelBg,
      borderRight: `1px solid ${theme.border}`,
      padding: "20px 18px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      overflowY: "auto"
    }}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          style={{
            padding: "16px 18px",
            borderRadius: "14px",
            border: activeView === item.id ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
            borderLeft: activeView === item.id ? `4px solid ${theme.accent}` : "none",
            background: activeView === item.id ? "rgba(168, 85, 247, 0.1)" : "transparent",
            color: activeView === item.id ? theme.accent : theme.textSub,
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.2s ease",
            textAlign: "left"
          }}
          onMouseEnter={(e) => {
            if (activeView !== item.id) {
              e.target.style.background = theme.hover;
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== item.id) {
              e.target.style.background = "transparent";
            }
          }}
        >
          <item.Icon size={18} />
          <span>{item.label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Back Button */}
      <button
        onClick={() => window.location.href = "/dashboard"}
        style={{
          padding: "16px 18px",
          borderRadius: "14px",
          border: `1px solid ${theme.border}`,
          background: "transparent",
          color: theme.textSub,
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "all 0.2s ease",
          textAlign: "left"
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.hover;
          e.target.style.borderColor = theme.accent;
          e.target.style.color = theme.accent;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "transparent";
          e.target.style.borderColor = theme.border;
          e.target.style.color = theme.textSub;
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Workflow Studio</span>
      </button>
    </div>
  );
}

function OverviewView({ theme, data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <StatCard theme={theme} Icon={Users} label="Total Users" value={data.total_users} />
        <StatCard theme={theme} Icon={Briefcase} label="Total Workflows" value={data.total_workflows} />
        <StatCard theme={theme} Icon={PlayCircle} label="Running" value={data.running_runs} color={theme.running} />
        <StatCard theme={theme} Icon={BadgeCheck} label="Completed" value={data.completed_runs} color={theme.success} />
        <StatCard theme={theme} Icon={CircleX} label="Failed" value={data.failed_runs} color={theme.failed} />
      </div>

      {/* Welcome Message */}
      <div style={{
        padding: "40px",
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: "18px",
        textAlign: "center"
      }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", fontWeight: "700", color: theme.text }}>Welcome to Admin Dashboard</h2>
        <p style={{ margin: 0, fontSize: "14px", color: theme.textSub, lineHeight: "1.6" }}>
          Use the navigation panel on the left to view Saved Workflows, Execution History, or Recent Runs.<br/>
          Monitor your HR automation workflows and track execution performance.
        </p>
      </div>
    </div>
  );
}

function RecentRunsView({ data }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeRange, setTimeRange] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "All", timeRange: "all" });
  const [currentPage, setCurrentPage] = useState(1);

  const activeTheme = {
    mainBg: "#0B0B0F",
    panelBg: "#15151C",
    boxBg: "#181820",
    border: "#2A2A35",
    textTitle: "#FFFFFF",
    textSub: "#9CA3AF",
    accent: "#A855F7"
  };

  const runs = Array.isArray(data?.recent_runs) ? data.recent_runs : [];

  const normalizedStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("success") || s.includes("executed")) return "Success";
    if (s.includes("running")) return "Running";
    return "Failed";
  };

  const filteredRuns = runs.filter((run) => {
    const matchesSearch = String(run.workflow_name || "")
      .toLowerCase()
      .includes(appliedFilters.search.toLowerCase());
    const matchesStatus = appliedFilters.status === "All" || normalizedStatus(run.status) === appliedFilters.status;
    const timestamp = run.time ? new Date(run.time) : null;
    const matchesTime = appliedFilters.timeRange === "all" || (timestamp && !Number.isNaN(timestamp.getTime()) && timestamp >= new Date(new Date().getTime() - Number(appliedFilters.timeRange.replace("d", "")) * 86400000));
    return matchesSearch && matchesStatus && matchesTime;
  });

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleRuns = filteredRuns.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div style={{
      background: activeTheme.panelBg,
      border: `1px solid ${activeTheme.border}`,
      borderRadius: "18px",
      overflow: "hidden",
      boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)"
    }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${activeTheme.border}` }}>
        <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: activeTheme.textTitle, letterSpacing: "-0.02em" }}>Recent Runs</h3>
        <p style={{ margin: "8px 0 0", fontSize: "14px", color: activeTheme.textSub, lineHeight: 1.6 }}>View the latest workflow executions across the system.</p>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "16px 24px 12px", flexWrap: "wrap", position: "sticky", top: 0, zIndex: 2, background: activeTheme.panelBg }}>
        <input
          type="text"
          placeholder="Search workflow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1 1 240px",
            minWidth: 220,
            padding: "10px 12px",
            borderRadius: 999,
            border: `1px solid ${activeTheme.border}`,
            background: "#1B1D24",
            color: activeTheme.textTitle,
            outline: "none"
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 999,
            border: `1px solid ${activeTheme.border}`,
            background: "#1B1D24",
            color: activeTheme.textTitle,
            outline: "none"
          }}
        >
          <option value="All">All</option>
          <option value="Success">Success</option>
          <option value="Running">Running</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div style={{ padding: "0 24px" }}><TimeRangeFilter value={timeRange} onChange={setTimeRange} onApply={() => { setAppliedFilters({ search: searchTerm, status: statusFilter, timeRange }); setCurrentPage(1); }} onClear={() => { setSearchTerm(""); setStatusFilter("All"); setTimeRange("all"); setAppliedFilters({ search: "", status: "All", timeRange: "all" }); setCurrentPage(1); }} /></div>

      <div style={{ padding: "8px 24px 20px", minHeight: 520, display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredRuns.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${activeTheme.border}`, borderRadius: 18, background: activeTheme.boxBg, minHeight: 360 }}>
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 999, background: "#1B1D24", border: `1px solid ${activeTheme.border}`, color: activeTheme.accent, marginBottom: 12 }}>
                <Search size={20} />
              </div>
              <div style={{ color: activeTheme.textTitle, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No recent executions found.</div>
              <div style={{ color: activeTheme.textSub, fontSize: 13 }}>Try adjusting your search or status filter.</div>
            </div>
          </div>
        ) : (
          <>
            {visibleRuns.map((run, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: activeTheme.boxBg,
                  border: `1px solid ${activeTheme.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3A3D46";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = activeTheme.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: activeTheme.textTitle, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{run.workflow_name}</div>
                  <div style={{ color: activeTheme.textSub, fontSize: 12, marginTop: 4 }}>{run.employee || "N/A"}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <div style={{ minWidth: 100, textAlign: "right" }}>
                    <div style={{ color: activeTheme.textSub, fontSize: 12, marginBottom: 4 }}>Status</div>
                    <StatusBadge status={run.status} />
                  </div>

                  <div style={{ minWidth: 180, textAlign: "right" }}>
                    <div style={{ color: activeTheme.textSub, fontSize: 12, marginBottom: 4 }}>Executed</div>
                    <div style={{ color: activeTheme.textTitle, fontSize: 13, fontWeight: 500 }}>{formatTime(run.time)}</div>
                  </div>

                  <button
                    onClick={() => window.location.href = "/dashboard"}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 999,
                      background: "#1B1D24",
                      border: `1px solid ${activeTheme.border}`,
                      color: activeTheme.textTitle,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {filteredRuns.length > itemsPerPage && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 8, borderTop: `1px solid ${activeTheme.border}`, marginTop: "auto" }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: `1px solid ${activeTheme.border}`,
                    background: currentPage === 1 ? "#14161B" : "#1B1D24",
                    color: currentPage === 1 ? activeTheme.textSub : activeTheme.textTitle,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: currentPage === 1 ? 0.7 : 1
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      minWidth: 34,
                      height: 34,
                      borderRadius: 999,
                      border: `1px solid ${activeTheme.border}`,
                      background: currentPage === page ? "#23262E" : "#1B1D24",
                      color: currentPage === page ? activeTheme.textTitle : activeTheme.textSub,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: `1px solid ${activeTheme.border}`,
                    background: currentPage === totalPages ? "#14161B" : "#1B1D24",
                    color: currentPage === totalPages ? activeTheme.textSub : activeTheme.textTitle,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: currentPage === totalPages ? 0.7 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ theme, Icon, label, value, color }) {
  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.border}`,
      borderRadius: "18px",
      padding: "28px",
      transition: "all 0.2s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color || theme.accent;
      e.currentTarget.style.boxShadow = `0 0 20px ${(color || theme.accent)}20`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = theme.border;
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ color: color || theme.accent, marginTop: "4px" }}>
          <Icon size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", color: theme.textSub, fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
          <div style={{ fontSize: "34px", fontWeight: "700", color: color || theme.accent }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status).toLowerCase();
  let color = "#ef4444";
  let Icon = XCircle;
  let label = status;

  if (s.includes("success") || s.includes("executed")) {
    color = "#4ade80";
    Icon = CheckCircle2;
    label = status || "Success";
  } else if (s.includes("running")) {
    color = "#f59e0b";
    Icon = LoaderCircle;
    label = status || "Running";
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: 999,
      background: `${color}18`,
      color: color,
      fontWeight: 700,
      fontSize: 12,
      border: `1px solid ${color}30`
    }}>
      <Icon size={13} />
      {label}
    </span>
  );
}

function LoadingState({ theme }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: theme.bg,
      color: theme.text
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <div style={{ fontSize: "16px" }}>Loading Dashboard...</div>
      </div>
    </div>
  );
}

function ErrorState({ theme, onRetry }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: theme.bg,
      color: theme.text
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <div style={{ fontSize: "16px", marginBottom: "12px" }}>Unable to load dashboard</div>
        <button
          onClick={onRetry}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            background: theme.accent,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  try {
    const date = new Date(timeStr);
    return date.toLocaleString();
  } catch {
    return String(timeStr);
  }
}
