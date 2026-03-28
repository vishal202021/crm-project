import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { CRM_EVENTS } from "./events";
import { getMissedCalls, MISSED_STATUSES } from "./Missedcallshelper";

const NotificationBell = () => {

  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [pos,      setPos]      = useState({ top: 0, right: 0 });
  const [read,     setRead]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_read_notifs") || "[]"); }
    catch { return []; }
  });

  const bellRef  = useRef(null);
  const panelRef = useRef(null);

  /* ── Fetch & filter: only customers whose LATEST call is missed ── */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/interactions");
      const all = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setNotifications(getMissedCalls(all));
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
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        bellRef.current  && !bellRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleOpen = () => {
    if (open) { setOpen(false); return; }
    if (bellRef.current) {
      const r = bellRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setOpen(true);
  };

  const unreadCount = notifications.filter(n => !read.includes(n.id)).length;

  const markAllRead = (e) => {
    e.stopPropagation();
    const merged = [...new Set([...read, ...notifications.map(n => n.id)])];
    setRead(merged);
    localStorage.setItem("crm_read_notifs", JSON.stringify(merged));
  };

  const handleItemClick = (n) => {
    const merged = read.includes(n.id) ? read : [...read, n.id];
    setRead(merged);
    localStorage.setItem("crm_read_notifs", JSON.stringify(merged));
    setOpen(false);
    const id = n.customer?.id || n.customerId;
    if (id) navigate(`/app/customer/${id}`);
  };

  const sc = (s) => {
    if (s === "Not Answered") return { c: "#f59e0b", bg: "#1c1400", bd: "#78400a" };
    if (s === "Busy")         return { c: "#ef4444", bg: "#1c0000", bd: "#7f1d1d" };
    if (s === "Switched Off") return { c: "#94a3b8", bg: "#0f172a", bd: "#334155" };
    return                           { c: "#818cf8", bg: "#0f0f1e", bd: "#312e81" };
  };
  const icon = (s) => s === "Not Answered" ? "📵" : s === "Busy" ? "🔴" : "🔕";

  const panel = open && createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed", top: pos.top, right: pos.right,
        width: 370, maxHeight: "70vh", minHeight: 200,
        zIndex: 2147483647,
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 16,
        boxShadow: "0 24px 80px #000, 0 0 0 1px #1e293b",
        display: "flex", flexDirection: "column",
        overflow: "hidden", color: "#f1f5f9",
      }}
    >
      <div style={{ height: 3, background: "linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b)", flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: "1px solid #1e293b",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, background: "#0f172a",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📵</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>Missed Calls</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
              {notifications.length} customer{notifications.length !== 1 ? "s" : ""} still unreached
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: "#1e293b", border: "1px solid #334155",
              color: "#a5b4fc", borderRadius: 8, padding: "4px 10px",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>Mark all read</button>
          )}
          <button onClick={() => setOpen(false)} style={{
            background: "none", border: "none", color: "#64748b",
            cursor: "pointer", fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>
      </div>

      {/* Status counts */}
      <div style={{
        padding: "7px 16px", borderBottom: "1px solid #1e293b",
        display: "flex", gap: 14, flexShrink: 0, background: "#090e1a",
      }}>
        {MISSED_STATUSES.map(s => {
          const c = sc(s), cnt = notifications.filter(n => n.status === s).length;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>{icon(s)}</span>
              <span style={{ fontSize: 11, color: c.c, fontWeight: 600 }}>{s}</span>
              <span style={{
                fontSize: 10, fontWeight: 800, color: c.c,
                background: c.bg, border: `1px solid ${c.bd}`,
                borderRadius: 8, padding: "1px 6px",
              }}>{cnt}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1, background: "#0f172a" }}>
        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>Loading...</div>
        )}
        {!loading && notifications.length === 0 && (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>No missed calls!</div>
            <div style={{ color: "#334155", fontSize: 11, marginTop: 4 }}>All customers have been reached</div>
          </div>
        )}
        {!loading && notifications.map(n => {
          const s = sc(n.status);
          const isUnread = !read.includes(n.id);
          const name = n.customer?.customerName || n.customerName || "Unknown";
          return (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                display: "flex", gap: 11, alignItems: "flex-start",
                padding: "12px 16px 12px 22px",
                borderBottom: "1px solid #0d1420",
                cursor: "pointer",
                background: isUnread ? "#111827" : "#0f172a",
                position: "relative",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1a2035"}
              onMouseLeave={e => e.currentTarget.style.background = isUnread ? "#111827" : "#0f172a"}
            >
              {isUnread && (
                <div style={{
                  position: "absolute", left: 8, top: "50%",
                  transform: "translateY(-50%)",
                  width: 6, height: 6, borderRadius: "50%", background: "#f59e0b",
                }} />
              )}
              <div style={{
                width: 34, height: 34, flexShrink: 0, borderRadius: 9,
                background: s.bg, border: `1px solid ${s.bd}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
              }}>
                {icon(n.status)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 13, fontWeight: isUnread ? 700 : 500,
                    color: isUnread ? "#f1f5f9" : "#64748b",
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", maxWidth: 170,
                  }}>{name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: s.c,
                    background: s.bg, border: `1px solid ${s.bd}`,
                    borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap",
                  }}>{n.status}</span>
                </div>
                {n.followupDetails && (
                  <div style={{
                    fontSize: 11, color: "#334155", marginBottom: 4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{n.followupDetails}</div>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#1e3a5f" }}>📅 {n.interactionDate}</span>
                  {n.callBy && <span style={{ fontSize: 11, color: "#1e3a5f" }}>👤 {n.callBy}</span>}
                  {n.nextFollowupDate && (
                    <span style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>🔁 {n.nextFollowupDate}</span>
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
          padding: "11px 16px", borderTop: "1px solid #1e293b",
          textAlign: "center", background: "#090e1a", flexShrink: 0,
        }}>
          <button
            onClick={() => { setOpen(false); navigate("/app/notification"); }}
            style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            View all missed calls →
          </button>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <>
      <style>{`@keyframes bp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.2)}}`}</style>

      <button
        ref={bellRef}
        onClick={toggleOpen}
        title="Missed call notifications"
        style={{
          position: "relative",
          background: open ? "#1e1b4b" : "#111827",
          border: `1.5px solid ${open ? "#6366f1" : "#1f2937"}`,
          borderRadius: 12, width: 42, height: 42,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s", outline: "none", flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={unreadCount > 0 ? "#f59e0b" : "#4b5563"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <>
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "#dc2626", color: "#fff", borderRadius: "50%",
              minWidth: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, border: "2px solid #0a0e1a", padding: "0 3px",
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span style={{
              position: "absolute", inset: -1, borderRadius: 13,
              border: "2px solid rgba(239,68,68,0.5)",
              animation: "bp 2s infinite", pointerEvents: "none",
            }} />
          </>
        )}
      </button>

      {panel}
    </>
  );
};

export default NotificationBell;
