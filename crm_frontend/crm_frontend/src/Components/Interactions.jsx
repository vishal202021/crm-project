import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Interactions = () => {

  const [list,    setList]    = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/interactions")
      .then(res => setList(res.data || []))
      .catch(() => toast.error("Failed to load visits"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete visit record?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      background: "#0f172a",
      color: "#fff",
      confirmButtonText: "Delete"
    }).then(result => {
      if (!result.isConfirmed) return;
      api.delete(`/interactions/${id}`)
        .then(() => { toast.success("Visit deleted"); load(); })
        .catch(() => toast.error("Delete failed"));
    });
  };

  const statusColor = (s) => {
    if (s === "Interested")     return { bg: "rgba(16,185,129,0.15)",  color: "#10b981", border: "rgba(16,185,129,0.4)"  };
    if (s === "Not Interested") return { bg: "rgba(239,68,68,0.15)",   color: "#ef4444", border: "rgba(239,68,68,0.4)"   };
    if (s === "Follow-up")      return { bg: "rgba(245,158,11,0.15)",  color: "#f59e0b", border: "rgba(245,158,11,0.4)"  };
    if (s === "Closed")         return { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "rgba(148,163,184,0.4)" };
    if (s === "Converted")      return { bg: "rgba(99,102,241,0.15)",  color: "#818cf8", border: "rgba(99,102,241,0.4)"  };
    return { bg: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "rgba(148,163,184,0.3)" };
  };

  const filtered = useMemo(() =>
    list.filter(i =>
      i.customer?.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      i.followupDetails?.toLowerCase().includes(search.toLowerCase()) ||
      i.visitedBy?.toLowerCase().includes(search.toLowerCase())
    ),
  [list, search]);

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>🏢 Customer Visits</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Track all in-person customer visits</p>
        </div>
        <Link to="/app/add-interactions" className="elite-add-btn">
          + Log Visit
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="ds-card mb-3 compact">
        <div className="elite-search" style={{ marginBottom: 0 }}>
          <i className="bi bi-search" />
          <input
            placeholder="Search by customer, notes or visitor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}>
            Loading visits...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="ds-table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Customer</th>
                  <th style={{ minWidth: 120 }}>Visit Date</th>
                  <th style={{ minWidth: 220 }}>Discussion Notes</th>
                  <th style={{ minWidth: 140 }}>Next Follow-up</th>
                  <th style={{ minWidth: 140 }}>Visited By</th>
                  <th style={{ minWidth: 120 }}>Status</th>
                  <th style={{ minWidth: 70, textAlign: "center" }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{
                      textAlign: "center", padding: "52px 16px", color: "#334155"
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
                      No visit records found
                    </td>
                  </tr>
                ) : filtered.map(i => {
                  const sc = statusColor(i.status);
                  return (
                    <tr key={i.id}>

                      <td className="fw-semibold" style={{ color: "#e2e8f0" }}>
                        {i.customer?.customerName || "—"}
                      </td>

                      <td style={{ color: "#94a3b8", fontSize: 13 }}>
                        {i.interactionDate || "—"}
                      </td>

                      <td style={{
                        color: "#cbd5e1", fontSize: 13,
                        maxWidth: 260, wordBreak: "break-word", whiteSpace: "normal"
                      }}>
                        {i.followupDetails || "—"}
                      </td>

                      <td style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                        {i.nextFollowupDate
                          ? <>📅 {i.nextFollowupDate}</>
                          : <span style={{ color: "#334155" }}>—</span>
                        }
                      </td>

                      <td style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 600 }}>
                        {i.visitedBy
                          ? <>👤 {i.visitedBy}</>
                          : <span style={{ color: "#334155" }}>—</span>
                        }
                      </td>

                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          padding: "4px 12px", borderRadius: 20,
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.border}`,
                          whiteSpace: "nowrap"
                        }}>
                          {i.status || "—"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleDelete(i.id)}
                          className="icon-btn danger"
                          title="Delete"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Interactions;
