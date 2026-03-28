import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { CRM_EVENTS } from "./events";

const MISSED_STATUSES = ["Not Answered", "Busy", "Switched Off"];

const NotificationBell = () => {

  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [read,     setRead]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_read_notifs") || "[]"); }
    catch { return []; }
  });

  const bellRef = useRef(null);

  /* ── Fetch missed calls ── */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await api.get("/interactions");
      const all  = Array.isArray(res.data) ? res.data : res.data?.content || [];
      const missed = all
        .filter(i => MISSED_STATUSES.includes(i.status))
        .sort((a, b) => new Date(b.interactionDate) - new Date(a.interactionDate))
        .slice(0, 50);
      setNotifications(missed);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, load);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, load);
  }, [load]);

  useEffect(() => {
    const t = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !read.includes(n.id)).length;

  const markAllRead = () => {
    const merged = [...new Set([...read, ...notifications.map(n => n.id)])];
    setRead(merged);
    localStorage.setItem("crm_read_notifs", JSON.stringify(merged));
  };

  const markOneRead = (id) => {
    if (read.includes(id)) return;
    const merged = [...read, id];
    setRead(merged);
    localStorage.setItem("crm_read_notifs", JSON.stringify(merged));
  };

  const handleClick = (n) => {
    markOneRead(n.id);
    setOpen(false);
    const id = n.customer?.id || n.customerId;
    if (id) navigate(`/app/customer/${id}`);
  };

  const statusColor = (s) => {
    if (s === "Not Answered") return { color: "#f59e0b", bg: "#2a1f00", border: "#6b4800" };
    if (s === "Busy")         return { color: "#ef4444", bg: "#2a0000", border: "#6b1010" };
    if (s === "Switched Off") return { color: "#94a3b8", bg: "#1a1f2e", border: "#2e3a4e" };
    return                           { color: "#a5b4fc", bg: "#1a1a2e", border: "#2a2a5e" };
  };

  const statusIcon = (s) => {
    if (s === "Not Answered") return "📵";
    if (s === "Busy")         return "🔴";
    if (s === "Switched Off") return "🔕";
    return "📞";
  };

  return (
    /* Wrapper keeps bell + panel together, panel is absolute inside */
    <div ref={bellRef} style={{ position: "relative", flexShrink: 0 }}>

      <style>{`
        @keyframes bellPulse {
          0%,100% { opacity:1; transform:scale(1);    }
          50%      { opacity:.5; transform:scale(1.2); }
        }
      `}</style>

      {/* ── Bell Button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Missed call notifications"
        style={{
          position: "relative",
          background: open ? "#1e1b4b" : "#111827",
          border: `1.5px solid ${open ? "#6366f1" : "#1f2937"}`,
          borderRadius: 12,
          width: 42, height: 42,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
          outline: "none",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={unreadCount > 0 ? "#f59e0b" : "#6b7280"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {unreadCount > 0 && (
          <>
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "#ef4444",
              color: "#fff", borderRadius: "50%",
              minWidth: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800,
              border: "2px solid #0a0e1a",
              padding: "0 3px",
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span style={{
              position: "absolute", inset: -1, borderRadius: 13,
              animation: "bellPulse 2s infinite",
              border: "2px solid rgba(239,68,68,0.5)",
              pointerEvents: "none",
            }} />
          </>
        )}
      </button>

      {/* ── Dropdown Panel — absolute to wrapper div ── */}
      {open && (
        <div style={{
          position: "absolute",
          top: 50,
          right: 0,
          width: 380,
          maxHeight: 520,
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* top accent */}
          <div style={{
            height: 3, flexShrink: 0,
            background: "linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)",
          }} />

          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #1e293b",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "#0f172a",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📵</span>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                  Missed Calls
                </div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                  Not Answered · Busy · Switched Off
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  background: "#1e293b", border: "1px solid #334155",
                  color: "#a5b4fc", borderRadius: 8, padding: "5px 10px",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none",
                color: "#64748b", cursor: "pointer",
                fontSize: 18, lineHeight: 1, padding: "2px 4px",
              }}>✕</button>
            </div>
          </div>

          {/* Status counts */}
          <div style={{
            padding: "8px 18px",
            borderBottom: "1px solid #1e293b",
            display: "flex", gap: 14, flexShrink: 0,
            background: "#0a0f1e",
          }}>
            {MISSED_STATUSES.map(s => {
              const count = notifications.filter(n => n.status === s).length;
              const sc = statusColor(s);
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13 }}>{statusIcon(s)}</span>
                  <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{s}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: sc.bg, color: sc.color,
                    border: `1px solid ${sc.border}`,
                    borderRadius: 8, padding: "1px 6px",
                  }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Scrollable list */}
          <div style={{ overflowY: "auto", flex: 1, background: "#0f172a" }}>

            {loading && (
              <div style={{
                padding: "40px 0", textAlign: "center",
                color: "#475569", fontSize: 13,
              }}>
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{
                padding: "48px 20px", textAlign: "center",
              }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🎉</div>
                <div style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>
                  No missed calls!
                </div>
              </div>
            )}

            {!loading && notifications.map(n => {
              const sc       = statusColor(n.status);
              const isUnread = !read.includes(n.id);
              const name     = n.customer?.customerName || n.customerName || "Unknown";
              const contact  = n.contactPerson || n.callBy || "";

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "13px 18px 13px 22px",
                    borderBottom: "1px solid #0f172a",
                    cursor: "pointer",
                    background: isUnread ? "#12182b" : "#0f172a",
                    position: "relative",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a2035"}
                  onMouseLeave={e => e.currentTarget.style.background = isUnread ? "#12182b" : "#0f172a"}
                >
                  {isUnread && (
                    <div style={{
                      position: "absolute", left: 8, top: "50%",
                      transform: "translateY(-50%)",
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#f59e0b",
                    }} />
                  )}

                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    borderRadius: 10,
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 16,
                  }}>
                    {statusIcon(n.status)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", gap: 8, marginBottom: 3,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: isUnread ? 700 : 500,
                        color: isUnread ? "#f1f5f9" : "#94a3b8",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", maxWidth: 170,
                      }}>
                        {name}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: sc.bg, color: sc.color,
                        border: `1px solid ${sc.border}`,
                        borderRadius: 20, padding: "2px 8px",
                        whiteSpace: "nowrap",
                      }}>
                        {n.status}
                      </span>
                    </div>

                    {n.followupDetails && (
                      <div style={{
                        fontSize: 11, color: "#475569",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", marginBottom: 4,
                      }}>
                        {n.followupDetails}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#334155" }}>
                        📅 {n.interactionDate}
                      </span>
                      {contact && (
                        <span style={{ fontSize: 11, color: "#334155" }}>
                          👤 {contact}
                        </span>
                      )}
                      {n.nextFollowupDate && (
                        <span style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>
                          🔁 {n.nextFollowupDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: "12px 18px",
              borderTop: "1px solid #1e293b",
              textAlign: "center",
              background: "#0a0f1e",
              flexShrink: 0,
            }}>
              <button
                onClick={() => { setOpen(false); navigate("/app/notification"); }}
                style={{
                  background: "none", border: "none",
                  color: "#6366f1", fontSize: 12,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                View all missed calls →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
