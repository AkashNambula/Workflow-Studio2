import { useState } from "react";
import { Filter } from "lucide-react";
import { TIME_RANGES } from "./timeRangeOptions";

export default function TimeRangeFilter({ value, onChange, onApply, onClear }) {
  const [open, setOpen] = useState(true);
  const button = (active) => ({ border: `1px solid ${active ? "#A855F7" : "#2A2A35"}`, background: active ? "rgba(168,85,247,.18)" : "#1B1D24", color: active ? "#E9D5FF" : "#D1D5DB", borderRadius: 999, padding: "8px 12px", cursor: "pointer", fontWeight: 600, fontSize: 12 });
  return <section style={{ background: "#15151C", border: "1px solid #2A2A35", borderRadius: 16, padding: 12, marginBottom: 16 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><button onClick={() => setOpen(!open)} style={button(open)}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Filter size={15} /> Filters</span></button>{open && <><button onClick={onApply} style={{ ...button(true), background: "#7C3AED", color: "#fff" }}>Go</button><button onClick={onClear} style={button(false)}>Clear All Filters</button></>}</div>
    {open && <div style={{ marginTop: 12, borderTop: "1px solid #2A2A35", paddingTop: 12 }}><div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>TIME RANGE</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{TIME_RANGES.map(([key, label]) => <button key={key} onClick={() => onChange(key)} style={button(value === key)}>{label}</button>)}</div></div>}
  </section>;
}
