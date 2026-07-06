import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPercentage = (value, total) => (total === 0 ? 0 : Math.round((value / total) * 100));

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ color: "#a855f7" }}>Admin Dashboard</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} style={{ width: 180, height: 100, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.08)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ color: "#a855f7" }}>Admin Dashboard</h2>
        <div style={{ marginTop: 12 }}>
          <p>Unable to load dashboard.</p>
          <button onClick={fetchData} style={{ padding: 10, background: "#a855f7", color: "#fff", border: "none", borderRadius: 8 }}>Retry</button>
        </div>
      </div>
    );
  }

  const total = data.total_users + data.total_workflows + data.completed_runs + data.failed_runs + data.running_runs || 1;

  const completed = data.completed_runs || 0;
  const failed = data.failed_runs || 0;
  const running = data.running_runs || 0;

  const completedPct = getPercentage(completed, completed + failed + running);
  const failedPct = getPercentage(failed, completed + failed + running);
  const runningPct = getPercentage(running, completed + failed + running);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, color: "#e9d5ff" }}>HR Automation Workflow Studio</h1>
          <h3 style={{ margin: 0, color: "#a855f7" }}>Admin Dashboard</h3>
          <p style={{ marginTop: 8, color: "#94a3b8" }}>Welcome Admin</p>
        </div>
        <div style={{ color: "#94a3b8" }}>{new Date().toLocaleString()}</div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <Card title="👥 Total Users" value={data.total_users} />
        <Card title="📋 Total Workflows" value={data.total_workflows} />
        <Card title="✅ Completed Runs" value={data.completed_runs} />
        <Card title="❌ Failed Runs" value={data.failed_runs} />
        <Card title="⚡ Running Workflows" value={data.running_runs} />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ width: 280, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.06)" }}>
          <h4 style={{ marginTop: 0, color: "#e9d5ff" }}>Execution Status</h4>
          <Donut completed={completed} failed={failed} running={running} />
          <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "space-between" }}>
            <Legend color="#22c55e" label={`Completed: ${completed}`} />
            <Legend color="#ef4444" label={`Failed: ${failed}`} />
            <Legend color="#3b82f6" label={`Running: ${running}`} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 320, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.06)" }}>
          <h4 style={{ marginTop: 0, color: "#e9d5ff" }}>Recent Workflow Executions</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8" }}>
                <th style={{ padding: 8 }}>Workflow Name</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_runs && data.recent_runs.length ? data.recent_runs.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: 8, color: "#e9d5ff" }}>{r.workflow_name}</td>
                  <td style={{ padding: 8 }}>{r.employee}</td>
                  <td style={{ padding: 8 }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: 8 }}>{r.time}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ padding: 12 }}>No recent runs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ width: 180, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.06)" }}>
      <div style={{ color: "#94a3b8", fontSize: 12 }}>{title}</div>
      <div style={{ color: "#e9d5ff", fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status).toLowerCase();
  const color = s.includes("success") || s.includes("executed") ? "#22c55e" : s.includes("running") ? "#3b82f6" : "#ef4444";
  return <span style={{ padding: "6px 10px", borderRadius: 999, background: color, color: "white", fontWeight: 700 }}>{status}</span>;
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 12, height: 12, borderRadius: 4, background: color }} />
      <div style={{ color: "#e9d5ff" }}>{label}</div>
    </div>
  );
}

function Donut({ completed, failed, running }) {
  const total = completed + failed + running || 1;
  const c = Math.round((completed / total) * 360);
  const f = Math.round((failed / total) * 360);
  const r = 360 - c - f;

  const size = 140;
  const stroke = 18;
  const center = size / 2;

  let offset = 0;

  const segments = [
    { value: completed, color: "#22c55e" },
    { value: failed, color: "#ef4444" },
    { value: running, color: "#3b82f6" }
  ];

  const circumference = 2 * Math.PI * ((size - stroke) / 2);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${center} ${center})`}>
        {segments.map((s, i) => {
          const dash = (s.value / total) * circumference;
          const gap = circumference - dash;
          const strokeDasharray = `${dash} ${gap}`;
          const circle = (
            <circle key={i} cx={center} cy={center} r={(size - stroke) / 2} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={strokeDasharray} strokeLinecap="butt" style={{ transformOrigin: "center" }} />
          );
          return circle;
        })}
      </g>
      <circle cx={center} cy={center} r={(size - stroke) / 2} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth={2} />
      <text x={center} y={center} textAnchor="middle" dy="6" style={{ fill: "#e9d5ff", fontWeight: 700 }}>{completed}</text>
    </svg>
  );
}
