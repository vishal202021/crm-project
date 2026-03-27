import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { CRM_EVENTS } from "./events";

const MISSED_STATUSES = ["Not Answered", "Busy", "Switched Off"];

const NotificationBell = () => {

  const navigate  = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [read,     setRead]     = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("crm_read_notifs") || "[]");
    } catch { return []; }
  });

  const panelRef = useRef(null);
  const bellRef  = useRef(null);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  /* ── Fetch missed calls from last 7 days ── */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await api.get("/interactions");
      const all  = Array.isArray(res.data) ? res.data : res.data?.content || [];

      const missed = all
        .filter(i => MISSED_STATUSES.includes(i.status))
        .sort((a, b) => new Date(b.interactionDate) - new Date(a.interactionDate))
        .slice(0, 50);
  console.log("API response:", res.data);
console.log("All data:", all);
console.log("Missed data:", missed);
      setNotifications(missed);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const reload = () => load();
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, reload);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, reload);
  }, [load]);

  /* Auto-refresh every 2 minutes */
  useEffect(() => {
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        bellRef.current   && !bellRef.current.contains(e.target)
      ) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

const toggleOpen = () => {
  if (!open && bellRef.current) {
    const rect = bellRef.current.getBoundingClientRect();

    setPanelPos({
      top: rect.bottom + 10,
      right: Math.max(20, window.innerWidth - rect.right)
    });
  }
  setOpen(v => !v);
};

  /* Unread = not in read list */
  const unreadIds  = notifications.filter(n => !read.includes(n.id)).map(n => n.id);
  const unreadCount = unreadIds.length;

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const merged = [...new Set([...read, ...allIds])];
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
    if (n.customer?.id || n.customerId) {
      navigate(`/app/customer/${n.customer?.id || n.customerId}`);
    }
  };

  const statusColor = (s) => {
    if (s === "Not Answered") return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)" };
    if (s === "Busy")         return { color: "#ef4444", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.35)"  };
    if (s === "Switched Off") return { color: "#94a3b8", bg: "rgba(148,163,184,0.12)",border: "rgba(148,163,184,0.3)" };
    return                           { color: "#a5b4fc", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.3)"  };
  };

  const statusIcon = (s) => {
    if (s === "Not Answered") return "📵";
    if (s === "Busy")         return "🔴";
    if (s === "Switched Off") return "🔕";
    return "📞";
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000 / 60);
    if (diff < 1)   return "just now";
    if (diff < 60)  return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <>
      {/* ── Bell Button ── */}
      <button
        ref={bellRef}
        onClick={toggleOpen}
        title="Missed call notifications"
        style={{
          position: "relative",
          background: open ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
          border: open
            ? "1px solid rgba(99,102,241,0.5)"
            : "1px solid rgba(148,163,184,0.15)",
          borderRadius: 12,
          width: 42, height: 42,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        {/* Bell icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={unreadCount > 0 ? "#f59e0b" : "#64748b"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          {unreadCount > 0 && (
            <circle cx="19" cy="5" r="4" fill="#ef4444" stroke="none"/>
          )}
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff", borderRadius: "50%",
            minWidth: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800,
            border: "2px solid var(--bg-main, #0a0e1a)",
            padding: "0 3px",
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulse animation when unread */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", inset: 0,
            borderRadius: 12,
            animation: "bellPulse 2s infinite",
            border: "2px solid rgba(239,68,68,0.4)",
            pointerEvents: "none",
          }} />
        )}
      </button>

      {/* ── Notification Panel ── */}
      {open && (
        <div
          ref={panelRef}
       style={{
  position: "fixed",
  top: 70,
  right: 20,
  zIndex: 9999999,
  width: 380,
  maxHeight: "80vh",
  background: "rgba(13,17,28,0.98)",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: 18,
  boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
  backdropFilter: "blur(20px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}}
        >
          {/* accent line */}
          <div style={{
            height: 2, flexShrink: 0,
            background: "linear-gradient(90deg,transparent,#f59e0b,#ef4444,transparent)"
          }} />

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px 12px",
            borderBottom: "1px solid rgba(148,163,184,0.08)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>📵</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
                  Missed Calls
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                  Not Answered · Busy · Switched Off
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "rgba(99,102,241,0.12)", border: "none",
                    color: "#a5b4fc", borderRadius: 8, padding: "5px 10px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none", border: "none", color: "#475569",
                  cursor: "pointer", fontSize: 16, padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Count strip */}
          <div style={{
            padding: "8px 20px",
            borderBottom: "1px solid rgba(148,163,184,0.06)",
            display: "flex", gap: 16, flexShrink: 0,
          }}>
            {MISSED_STATUSES.map(s => {
              const count = notifications.filter(n => n.status === s).length;
              const sc    = statusColor(s);
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12 }}>{statusIcon(s)}</span>
                  <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{s}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    background: sc.bg, color: sc.color,
                    border: `1px solid ${sc.border}`,
                    borderRadius: 10, padding: "1px 6px"
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>

            {loading && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 13 }}>
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{
                textAlign: "center", padding: "48px 20px",
                color: "#334155",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>
                  No missed calls!
                </div>
                <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
                  All calls are connected
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
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(148,163,184,0.06)",
                    cursor: "pointer",
                    background: isUnread ? "rgba(245,158,11,0.04)" : "transparent",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(148,163,184,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = isUnread ? "rgba(245,158,11,0.04)" : "transparent"}
                >
                  {/* Unread dot */}
                  {isUnread && (
                    <div style={{
                      position: "absolute", left: 8, top: "50%",
                      transform: "translateY(-50%)",
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#f59e0b",
                      boxShadow: "0 0 6px #f59e0b",
                    }} />
                  )}

                  {/* Status icon */}
                  <div style={{
                    width: 38, height: 38, flexShrink: 0,
                    borderRadius: 11,
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17,
                  }}>
                    {statusIcon(n.status)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", gap: 8
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: isUnread ? 700 : 600,
                        color: isUnread ? "#f1f5f9" : "#94a3b8",
                        whiteSpace: "nowrap", overflow: "hidden",
                        textOverflow: "ellipsis", maxWidth: 180,
                      }}>
                        {name}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: sc.bg, color: sc.color,
                        border: `1px solid ${sc.border}`,
                        borderRadius: 20, padding: "2px 8px",
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {n.status}
                      </span>
                    </div>

                    {n.followupDetails && (
                      <div style={{
                        fontSize: 11, color: "#64748b", marginTop: 3,
                        whiteSpace: "nowrap", overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {n.followupDetails}
                      </div>
                    )}

                    <div style={{
                      display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap"
                    }}>
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        📅 {n.interactionDate}
                      </span>
                      {contact && (
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          👤 {contact}
                        </span>
                      )}
                      {n.nextFollowupDate && (
                        <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                          🔁 Follow-up: {n.nextFollowupDate}
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
              padding: "12px 20px",
              borderTop: "1px solid rgba(148,163,184,0.08)",
              textAlign: "center", flexShrink: 0,
            }}>
              <button
                onClick={() => { setOpen(false); navigate("/app/interactions"); }}
                style={{
                  background: "none", border: "none",
                  color: "#6366f1", fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View all interactions →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellPulse {
          0%   { opacity: 1;   transform: scale(1);    }
          50%  { opacity: 0.4; transform: scale(1.15); }
          100% { opacity: 1;   transform: scale(1);    }
        }
      `}</style>
    </>
  );
};

export default NotificationBell;
