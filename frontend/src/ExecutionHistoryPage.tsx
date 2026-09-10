import { useEffect, useState, type ChangeEvent, type MouseEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ExecutionHistoryItem, ExecutionHistoryResponse } from "./types";
import TimeRangeFilter from "./components/TimeRangeFilter";

interface ExecutionHistoryPageProps {}

type StatusFilter = "All" | "Success" | "Running" | "Failed";
type TimeRange = "all" | "24h" | "7d" | "14d" | "30d";

interface ThemeColors {
  mainBg: string;
  panelBg: string;
  boxBg: string;
  border: string;
  textTitle: string;
  textSub: string;
  accent: string;
}

export default function ExecutionHistoryPage(_props: ExecutionHistoryPageProps = {}): ReactElement {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [appliedTimeRange, setAppliedTimeRange] = useState<TimeRange>("all");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const activeTheme: ThemeColors = {
    mainBg: "#0B0B0F",
    panelBg: "#15151C",
    boxBg: "#181820",
    border: "#2A2A35",
    textTitle: "#FFFFFF",
    textSub: "#9CA3AF",
    accent: "#A855F7"
  };

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<ExecutionHistoryResponse>("http://127.0.0.1:8000/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
        setCurrentPage(1);
      } catch (e) {
        setError(e);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  const getStatusColor = (status: string): string => {
    const s = String(status).toLowerCase();
    if (s.includes("success") || s.includes("executed")) return "#22c55e";
    if (s.includes("running")) return "#f59e0b";
    return "#ef4444";
  };

  const normalizedStatus = (status: string): Exclude<StatusFilter, "All"> => {
    const s = String(status || "").toLowerCase();
    if (s.includes("success") || s.includes("executed")) return "Success";
    if (s.includes("running")) return "Running";
    return "Failed";
  };

  const filteredHistory = history.filter((item: ExecutionHistoryItem): boolean => {
    const matchesSearch = String(item.workflow_name || "")
      .toLowerCase()
      .includes(appliedSearch.toLowerCase());
    const matchesStatus = appliedStatus === "All" || normalizedStatus(item.status) === appliedStatus;
    const timestamp = item.completed_at;
    const matchesTime = appliedTimeRange === "all" || Boolean(timestamp && new Date(timestamp) >= new Date(Date.now() - Number(appliedTimeRange.replace("d", "")) * 86400000));
    return matchesSearch && matchesStatus && matchesTime;
  });

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch, appliedStatus, appliedTimeRange]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(event.target.value as StatusFilter);
  };

  const applyFilters = (): void => {
    setAppliedSearch(searchTerm);
    setAppliedStatus(statusFilter);
    setAppliedTimeRange(timeRange);
  };

  const clearFilters = (): void => {
    setSearchTerm("");
    setStatusFilter("All");
    setTimeRange("all");
    setAppliedSearch("");
    setAppliedStatus("All");
    setAppliedTimeRange("all");
  };

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, background: activeTheme.mainBg, color: activeTheme.textTitle, minHeight: "100vh" }}>
        <h2 style={{ color: activeTheme.textTitle, margin: 0, fontSize: 28, fontWeight: 700 }}>Execution History</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 78, borderRadius: 16, background: activeTheme.boxBg, border: `1px solid ${activeTheme.border}` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: activeTheme.mainBg, color: activeTheme.textTitle, minHeight: "100vh" }}>
        <h2 style={{ color: activeTheme.textTitle, margin: 0, fontSize: 28, fontWeight: 700 }}>Execution History</h2>
        <div style={{ marginTop: 16, padding: 24, borderRadius: 16, background: activeTheme.panelBg, border: `1px solid ${activeTheme.border}` }}>
          <p style={{ color: activeTheme.textSub, margin: "0 0 12px 0" }}>Unable to load execution history.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 16px", background: "#1B1D24", color: activeTheme.textTitle, border: `1px solid ${activeTheme.border}`, borderRadius: 999, cursor: "pointer", fontWeight: 700 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: activeTheme.mainBg, color: activeTheme.textTitle, minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, color: activeTheme.textTitle, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Execution History</h1>
          <p style={{ marginTop: 8, color: activeTheme.textSub, fontSize: 14, lineHeight: 1.6 }}>Track workflow executions and their current state</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 2, background: activeTheme.mainBg, paddingTop: 4, paddingBottom: 4 }}>
        <input
          type="text"
          placeholder="Search workflow"
          value={searchTerm}
          onChange={handleSearchChange}
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
          onChange={handleStatusChange}
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
      <TimeRangeFilter 
        value={timeRange} 
        onChange={setTimeRange} 
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {history.length === 0 ? (
        <div style={{
          padding: 40,
          borderRadius: 18,
          border: `1px dashed ${activeTheme.border}`,
          textAlign: "center",
          background: activeTheme.panelBg,
          boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)"
        }}>
          <p style={{ color: activeTheme.textSub, fontSize: "16px", margin: 0 }}>No execution history available.</p>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 999,
              background: "#1B1D24",
              color: activeTheme.textTitle,
              border: `1px solid ${activeTheme.border}`,
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            Run First Workflow
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 420 }}>
          {visibleHistory.map((item, index) => (
            <div
              key={index}
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
              onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.borderColor = "#3A3D46";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.18)";
              }}
              onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.borderColor = activeTheme.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: activeTheme.textTitle, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{item.workflow_name}</div>
                <div style={{ color: activeTheme.textSub, fontSize: 12, marginTop: 4 }}>
                  {item.employee || "N/A"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <div style={{ minWidth: 100, textAlign: "right" }}>
                  <div style={{ color: activeTheme.textSub, fontSize: 12, marginBottom: 4 }}>Status</div>
                  <div style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: getStatusColor(item.status),
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    display: "inline-block"
                  }}>
                    {item.status}
                  </div>
                </div>

                <div style={{ minWidth: 180, textAlign: "right" }}>
                  <div style={{ color: activeTheme.textSub, fontSize: 12, marginBottom: 4 }}>Completed At</div>
                  <div style={{ color: activeTheme.textTitle, fontSize: 13, fontWeight: 500 }}>
                    {item.completed_at ? new Date(item.completed_at).toLocaleString() : "N/A"}
                  </div>
                </div>

                <button
                  onClick={() => navigate("/dashboard", { state: { workflowName: item.workflow_name } })}
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

          {filteredHistory.length > itemsPerPage && (
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
        </div>
      )}
    </div>
  );
}
