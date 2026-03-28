import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import CallModal from "./CallModal";
import { CRM_EVENTS } from "./events";
import { getMissedCalls, MISSED_STATUSES } from "./Missedcallshelper";

const NotificationPage = () => {

  const navigate = useNavigate();
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("All");
  const [search,   setSearch]   = useState("");
  const [read,     setRead]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_read_notifs") || "[]"); }
    catch { return []; }
  });

  /* ── Only customers whose LATEST interaction is still missed ── */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/interactions");
      const all = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setList(getMissedCalls(all));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, load);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, load);
  }, [load]);

  /* After call is saved → reload → customer auto-removes if status changed */
  const handleSaved = () => load();

  const markAllRead = () => {
    const merged = [...new Set([...read, ...list.map(n => n.id)])];
    setRead(merged);
    localStorage.setItem("crm_read_notifs", JSON.stringify(merged));
  };

  const markOneRead = (id) => {
    if (read.includes(id)) return;
    const merged = [...read, id];
    setRead(merged);
    localStorage.setItem("crm_read_notifs", JSON.stringify(merged));
  };

  const statusColor = (s) => {
    if (s === "Not Answered") return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.35)"  };
    if (s === "Busy")         return { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)"   };
    if (s === "Switched Off") return { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)"  };
    return                           { color: "#a5b4fc", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)"   };
  };

  const statusIcon = (s) => {
    if (s === "Not Answered") return "📵";
    if (s === "Busy")         return "🔴";
    if (s === "Switched Off") return "🔕";
    return "📞";
  };

  const displayed = list.filter(n => {
    const matchFilter = filter === "All" || n.status === filter;
    const name = n.customer?.customerName || n.customerName || "";
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const unreadCount = list.filter(n => !read.includes(n.id)).length;

  const counts = {
    "All":          list.length,
    "Not Answered": list.filter(n => n.status === "Not Answered").length,
    "Busy":         list.filter(n => n.status === "Busy").length,
    "Switched Off": list.filter(n => n.status === "Switched Off").length,
  };

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>📵 Missed Calls</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Customers whose <b>latest</b> call is still unanswered — auto-removes once called back
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <span style={{
              background: "rgba(239,68,68,0.15)", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 700,
            }}>
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
              color: "#a5b4fc", borderRadius: 10, padding: "8px 16px",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>✓ Mark all read</button>
          )}
          <button onClick={load} style={{
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            color: "#10b981", borderRadius: 10, padding: "8px 14px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>🔄 Refresh</button>
        </div>
      </div>

      {/* ── Stat cards / filter tabs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { key: "All",           label: "Total Missed",  icon: "📞", hex: "#6366f1" },
          { key: "Not Answered",  label: "Not Answered",  icon: "📵", hex: "#f59e0b" },
          { key: "Busy",          label: "Busy",          icon: "🔴", hex: "#ef4444" },
          { key: "Switched Off",  label: "Switched Off",  icon: "🔕", hex: "#94a3b8" },
        ].map(tab => (
          <div
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              background: filter === tab.key ? `${tab.hex}22` : "rgba(15,20,30,0.5)",
              border: `1px solid ${filter === tab.key ? tab.hex + "55" : "rgba(148,163,184,0.1)"}`,
              borderRadius: 14, padding: "16px 20px",
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <span style={{ fontSize: 24 }}>{tab.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: tab.hex }}>
                {counts[tab.key]}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{tab.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Info banner ── */}
      <div style={{
        background: "rgba(16,185,129,0.07)",
        border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 10, padding: "10px 16px",
        fontSize: 12, color: "#10b981", marginBottom: 14,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>💡</span>
        <span>
          Only showing customers whose <b>most recent</b> call is missed.
          Log a call with any other status → customer automatically disappears from this list.
        </span>
      </div>

      {/* ── Search ── */}
      <div className="ds-card mb-3 compact">
        <div className="elite-search" style={{ marginBottom: 0 }}>
          <i className="bi bi-search" />
          <input
            placeholder="Search by customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "52px 0", color: "#475569" }}>
            Loading missed calls...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="ds-table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th style={{ width: 10 }}></th>
                  <th style={{ minWidth: 200 }}>Customer</th>
                  <th style={{ minWidth: 130 }}>Status</th>
                  <th style={{ minWidth: 120 }}>Call Date</th>
                  <th style={{ minWidth: 140 }}>Called By</th>
                  <th style={{ minWidth: 160 }}>Remarks</th>
                  <th style={{ minWidth: 140 }}>Next Follow-up</th>
                  <th style={{ minWidth: 110, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>

                {displayed.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "52px 16px", color: "#334155" }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                      {list.length === 0
                        ? "No missed calls — all customers reached!"
                        : "No results for current filter"
                      }
                    </td>
                  </tr>
                )}

                {displayed.map(n => {
                  const sc       = statusColor(n.status);
                  const isUnread = !read.includes(n.id);
                  const name     = n.customer?.customerName || n.customerName || "Unknown";
                  const custId   = n.customer?.id || n.customerId;

                  return (
                    <tr
                      key={n.id}
                      style={{ background: isUnread ? "rgba(245,158,11,0.03)" : "transparent" }}
                      onClick={() => markOneRead(n.id)}
                    >
                      <td style={{ padding: "0 4px 0 12px" }}>
                        {isUnread && (
                          <div style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: "#f59e0b", boxShadow: "0 0 6px #f59e0b", margin: "auto",
                          }} />
                        )}
                      </td>

                      <td
                        className="fw-semibold"
                        style={{
                          cursor: "pointer",
                          color: isUnread ? "#f1f5f9" : "#94a3b8",
                          fontWeight: isUnread ? 700 : 500,
                          wordBreak: "break-word", whiteSpace: "normal", maxWidth: 200,
                        }}
                        onClick={(e) => { e.stopPropagation(); if (custId) navigate(`/app/customer/${custId}`); }}
                      >
                        {name}
                      </td>

                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 11, fontWeight: 700,
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.border}`,
                          borderRadius: 20, padding: "4px 12px", whiteSpace: "nowrap",
                        }}>
                          {statusIcon(n.status)} {n.status}
                        </span>
                      </td>

                      <td style={{ color: "#94a3b8", fontSize: 13 }}>{n.interactionDate || "—"}</td>

                      <td style={{ color: "#a5b4fc", fontSize: 13 }}>{n.callBy || "—"}</td>

                      <td style={{
                        color: "#cbd5e1", fontSize: 12,
                        maxWidth: 200, wordBreak: "break-word", whiteSpace: "normal",
                      }}>
                        {n.followupDetails || <span style={{ color: "#334155" }}>—</span>}
                      </td>

                      <td style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                        {n.nextFollowupDate
                          ? <>📅 {n.nextFollowupDate}</>
                          : <span style={{ color: "#334155" }}>—</span>
                        }
                      </td>

                      <td>
                        <div className="action-group" style={{ justifyContent: "center", gap: 8 }}>
                          <button
                            className="icon-btn call"
                            title="Call back — will remove from list if status changes"
                            onClick={(e) => {
                              e.stopPropagation();
                              markOneRead(n.id);
                              setSelected({ id: custId, customerName: name });
                            }}
                          >
                            <i className="bi bi-telephone" />
                          </button>
                          <button
                            className="icon-btn primary"
                            title="View customer"
                            onClick={(e) => {
                              e.stopPropagation();
                              markOneRead(n.id);
                              if (custId) navigate(`/app/customer/${custId}`);
                            }}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <CallModal
          customer={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  );
};

export default NotificationPage;
