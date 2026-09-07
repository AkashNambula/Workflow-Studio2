import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FolderOpen, Workflow, FileText, Briefcase } from "lucide-react";
import TimeRangeFilter from "./components/TimeRangeFilter";
import { getValidAuthToken, handleUnauthorized } from "./authSession";

export default function SavedWorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("all");
  const [appliedTimeRange, setAppliedTimeRange] = useState("all");
  const navigate = useNavigate();

  const activeTheme = {
    mainBg: "#0B0B0F",
    panelBg: "#15151C",
    boxBg: "#181820",
    border: "#2A2A35",
    textTitle: "#FFFFFF",
    textSub: "#9CA3AF",
    canvasBg: "#0B0B0F",
    accent: "#A855F7"
  };

  useEffect(() => {
    const fetchWorkflows = async () => {
      const token = getValidAuthToken();
      if (!token) { navigate("/login", { replace: true }); return; }
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("http://127.0.0.1:8000/workflows", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWorkflows(res.data);
        setCurrentPage(1);
      } catch (e) {
        if (handleUnauthorized(e, navigate)) return;
        setError(e);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [navigate]);

  const filteredWorkflows = workflows.filter((workflow) => {
    if (appliedTimeRange === "all") return true;
    const timestamp = workflow.updated_at || workflow.created_at;
    return timestamp && new Date(timestamp) >= new Date(new Date().getTime() - Number(appliedTimeRange.replace("d", "")) * 86400000);
  });
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredWorkflows.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleWorkflows = filteredWorkflows.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 220,
              height: 140,
              borderRadius: 18,
              background: activeTheme.boxBg,
              border: `1px solid ${activeTheme.border}`,
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)"
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: 12, padding: 24, borderRadius: 18, background: activeTheme.panelBg, border: `1px solid ${activeTheme.border}`, boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)" }}>
        <p style={{ color: activeTheme.textSub, margin: "0 0 12px 0" }}>Unable to load workflows.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 16px",
            background: "#1B1D24",
            color: activeTheme.textTitle,
            border: `1px solid ${activeTheme.border}`,
            borderRadius: 999,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = activeTheme.accent;
            e.currentTarget.style.background = "#171A22";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = activeTheme.border;
            e.currentTarget.style.background = "#1B1D24";
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: activeTheme.mainBg, color: activeTheme.textTitle, minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, color: activeTheme.textTitle, fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>Saved Workflows</h1>
          <p style={{ marginTop: 8, color: activeTheme.textSub, fontSize: 14, lineHeight: 1.6 }}>Your collection of automation workflows</p>
        </div>
      </div>
      <TimeRangeFilter value={timeRange} onChange={setTimeRange} onApply={() => { setAppliedTimeRange(timeRange); setCurrentPage(1); }} onClear={() => { setTimeRange("all"); setAppliedTimeRange("all"); setCurrentPage(1); }} />

      {filteredWorkflows.length === 0 ? (
        <div
          style={{
            padding: 40,
            borderRadius: 18,
            border: `1px dashed ${activeTheme.border}`,
            textAlign: "center",
            background: activeTheme.panelBg,
            boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)"
          }}
        >
          <p style={{ color: activeTheme.textSub, fontSize: "16px", margin: 0 }}>No workflows saved yet.</p>
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
              fontWeight: 700,
              fontSize: 13
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = activeTheme.accent;
              e.currentTarget.style.background = "#171A22";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = activeTheme.border;
              e.currentTarget.style.background = "#1B1D24";
            }}
          >
            Create First Workflow
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visibleWorkflows.map((workflow, index) => {
              const iconMap = [FolderOpen, Workflow, FileText, Briefcase];
              const Icon = iconMap[index % iconMap.length];

              return (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: activeTheme.boxBg,
                    border: `1px solid ${activeTheme.border}`,
                    cursor: "default",
                    transition: "all 0.2s ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    minHeight: 52,
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.16)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3A3D46";
                    e.currentTarget.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.24)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = activeTheme.border;
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.16)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 12, background: "#1B1D24", border: `1px solid ${activeTheme.border}`, color: activeTheme.textTitle }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: activeTheme.textTitle, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{workflow.name}</div>
                      <div style={{ color: activeTheme.textSub, fontSize: 12, marginTop: 4 }}>Workflow</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
                    <button
                      onClick={() => navigate("/dashboard")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 999,
                        background: "#1B1D24",
                        color: activeTheme.textTitle,
                        border: `1px solid ${activeTheme.border}`,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 12,
                        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = activeTheme.accent;
                        e.currentTarget.style.background = "#171A22";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = activeTheme.border;
                        e.currentTarget.style.background = "#1B1D24";
                      }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWorkflows.length > itemsPerPage && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 8, borderTop: `1px solid ${activeTheme.border}` }}>
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
