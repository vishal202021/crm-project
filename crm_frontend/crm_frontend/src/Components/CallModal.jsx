import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { getUsername } from "./auth";
import { toast } from "react-toastify";
import { emitCRMUpdate } from "./events";

const CallModal = ({ customer, onClose, onSaved }) => {

  const [saving,       setSaving]   = useState(false);
  const [timeline,     setTimeline] = useState([]);
  const [timelineLoad, setTimelineLoad] = useState(true);
  const dateRef = useRef(null);

  const [data, setData] = useState({
    status:           "",
    followupDetails:  "",
    nextFollowupDate: "",
    callBy:           getUsername() || ""
  });

  useEffect(() => {
    if (!customer?.id) return;
    setTimelineLoad(true);
    api.get("/interactions/timeline/" + customer.id)
      .then(res => {
        const rows = Array.isArray(res.data)
          ? res.data
          : (res.data.content || []);
        setTimeline(rows.filter(r => r.callingType === "Call" || !r.callingType));
      })
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoad(false));
  }, [customer?.id]);

  if (!customer) return null;

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  }, []);

  const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (!data.status) return;
    if (data.status === "Follow-up" && !data.nextFollowupDate)
      setData(p => ({ ...p, nextFollowupDate: addDays(1) }));
    if (data.status === "Interested")
      setData(p => ({ ...p, nextFollowupDate: addDays(3) }));
    if (["Not Answered", "Busy", "Switched Off"].includes(data.status))
      setData(p => ({ ...p, nextFollowupDate: addDays(1) }));
    if (data.status === "Converted")
      setData(p => ({ ...p, nextFollowupDate: addDays(7) }));
    if (data.status === "Not Interested")
      setData(p => ({ ...p, nextFollowupDate: addDays(30) }));
    if (data.status === "Connected" && !data.nextFollowupDate)
      setData(p => ({ ...p, nextFollowupDate: addDays(2) }));
  }, [data.status]);

  const validate = () => {
    if (!data.status.trim())        { toast.error("Select call outcome");               return false; }
    const r = (data.followupDetails || "").trim();
    if (!r)                         { toast.error("Remarks are required");              return false; }
    if (r.length < 5)               { toast.error("Remarks must be at least 5 chars");  return false; }
    if (r.length > 500)             { toast.error("Remarks max 500 chars");             return false; }
    if (!/[a-zA-Z0-9]/.test(r))    { toast.error("Enter meaningful remarks");           return false; }
    if (!data.nextFollowupDate)     { toast.error("Please select next follow-up date"); return false; }
    const sel = new Date(data.nextFollowupDate);
    const tod = new Date(todayStr);
    sel.setHours(0,0,0,0); tod.setHours(0,0,0,0);
    if (sel < tod)                  { toast.error("Follow-up date cannot be in past");  return false; }
    return true;
  };

  const save = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post("/interactions", {
        customerId:       customer.id,
        interactionDate:  todayStr,
        status:           data.status.trim(),
        followupDetails:  data.followupDetails.trim(),
        nextFollowupDate: data.nextFollowupDate,
        callBy:           data.callBy.trim() || null,
        callingType:      "Call"
      });
      toast.success("📞 Call logged");
      emitCRMUpdate();
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save call");
    } finally {
      setSaving(false);
    }
  };

  const openCalendar = () => {
    try { dateRef.current?.showPicker(); }
    catch { dateRef.current?.click(); }
  };

  const statusColor = (s) => {
    if (s === "Interested")     return "#10b981";
    if (s === "Converted")      return "#6366f1";
    if (s === "Not Interested") return "#ef4444";
    if (s === "Follow-up")      return "#f59e0b";
    if (["Busy","Not Answered","Switched Off"].includes(s)) return "#94a3b8";
    return "#a5b4fc";
  };

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        color: "#64748b", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: 7
      }}>
        {label}
      </label>
      {children}
    </div>
  );

  const Skeleton = () => (
    <div style={{
      height: 13, borderRadius: 6, marginBottom: 10,
      background: "linear-gradient(90deg,rgba(148,163,184,0.07) 25%,rgba(148,163,184,0.14) 50%,rgba(148,163,184,0.07) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite"
    }} />
  );

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(10,14,26,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "stretch", justifyContent: "center",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 1000,
          margin: "20px",
          borderRadius: 24,
          background: "rgba(15,20,25,0.97)",
          border: "1px solid rgba(148,163,184,0.12)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "popUp 0.3s cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}
      >
        {/* accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg,transparent,#6366f1,#818cf8,transparent)"
        }} />

        {/* ── Top Bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: "1px solid rgba(148,163,184,0.1)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42,
              background: "linear-gradient(135deg,#6366f1,#818cf8)",
              borderRadius: 13, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 19, boxShadow: "0 8px 25px rgba(99,102,241,0.4)"
            }}>
              📞
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#f1f5f9" }}>Log Call</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                {customer.customerName}
              </div>
            </div>
          </div>
          <button className="elite-close" onClick={onClose}>✕</button>
        </div>

        {/* ── 2-column body ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          flex: 1, minHeight: 0, overflow: "hidden"
        }}>

          {/* ════ COL 1 — Log Call Form ════ */}
          <div style={{
            borderRight: "1px solid rgba(148,163,184,0.08)",
            padding: "28px 32px",
            overflowY: "auto",
            display: "flex", flexDirection: "column",
          }}>

            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 22 }}>
              Fill in the call details below
            </div>

            <Field label="Call Outcome *">
              <select
                className="elite-input w-100"
                value={data.status}
                onChange={e => setData({ ...data, status: e.target.value })}
              >
                <option value="">Select outcome...</option>
                <option>Connected</option>
                <option>Not Answered</option>
                <option>Switched Off</option>
                <option>Busy</option>
                <option>Interested</option>
                <option>Follow-up</option>
                <option>Converted</option>
                <option>Not Interested</option>
              </select>
            </Field>

            <Field label={<>Remarks <span style={{ color: "#ef4444" }}>*</span></>}>
              <textarea
                rows="7"
                maxLength={500}
                className="elite-input w-100"
                placeholder="Write your call notes here..."
                value={data.followupDetails}
                onChange={e => setData({ ...data, followupDetails: e.target.value })}
                style={{ resize: "vertical" }}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#475569", marginTop: 4 }}>
                {(data.followupDetails || "").length}/500
              </div>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="📅 Next Follow-up Date *">
                <div style={{ cursor: "pointer" }} onClick={openCalendar}>
                  <input
                    ref={dateRef}
                    type="date"
                    min={todayStr}
                    className="elite-input w-100"
                    value={data.nextFollowupDate}
                    onChange={e => setData({ ...data, nextFollowupDate: e.target.value })}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              </Field>
              <Field label="Called By">
                <input
                  className="elite-input w-100"
                  placeholder="Your name"
                  value={data.callBy}
                  onChange={e => setData({ ...data, callBy: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                onClick={save}
                disabled={saving}
                className="elite-save"
                style={{ flex: 1, padding: "14px 0", fontSize: 15 }}
              >
                {saving ? "Saving..." : "💾 Save Call"}
              </button>
              <button
                onClick={onClose}
                className="elite-cancel"
                style={{ flex: 1, padding: "14px 0", fontSize: 15 }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* ════ COL 2 — Call History ════ */}
          <div style={{
            padding: "22px 20px",
            overflowY: "auto",
            display: "flex", flexDirection: "column",
            background: "rgba(10,14,22,0.4)",
          }}>

            {/* Header */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 18
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#4f46e5",
                textTransform: "uppercase", letterSpacing: "0.1em"
              }}>
                📋 Call History
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20, padding: "3px 10px"
              }}>
                {timeline.length} {timeline.length === 1 ? "call" : "calls"}
              </span>
            </div>

            {/* Loading skeletons */}
            {timelineLoad && (
              [1,2,3].map(n => (
                <div key={n} style={{ marginBottom: 16 }}>
                  <Skeleton /><Skeleton /><Skeleton />
                </div>
              ))
            )}

            {/* Empty state */}
            {!timelineLoad && timeline.length === 0 && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#334155", textAlign: "center", gap: 10, paddingTop: 40
              }}>
                <div style={{ fontSize: 36 }}>📵</div>
                <div style={{ fontSize: 13 }}>No calls logged yet</div>
              </div>
            )}

            {/* Timeline */}
            {!timelineLoad && timeline.length > 0 && (
              <div style={{
                borderLeft: "2px solid rgba(99,102,241,0.2)",
                paddingLeft: 16,
                display: "flex", flexDirection: "column",
              }}>
                {timeline.map((t, idx) => (
                  <div key={t.id || idx} style={{
                    display: "flex", gap: 0,
                    marginBottom: 18, position: "relative"
                  }}>
                    {/* dot */}
                    <div style={{
                      position: "absolute", left: -21, top: 7,
                      width: 10, height: 10,
                      background: `linear-gradient(135deg,${statusColor(t.status)},#6366f1)`,
                      borderRadius: "50%",
                      boxShadow: `0 0 8px ${statusColor(t.status)}88`,
                    }} />

                    {/* card */}
                    <div style={{
                      background: "rgba(15,20,25,0.6)",
                      border: "1px solid rgba(148,163,184,0.08)",
                      borderRadius: 12, padding: "12px 14px",
                      width: "100%",
                    }}>
                      {/* date + status */}
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", flexWrap: "wrap",
                        gap: 6, marginBottom: 8
                      }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: "#a5b4fc",
                          textTransform: "uppercase", letterSpacing: "0.05em"
                        }}>
                          {t.interactionDate}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 9px",
                          borderRadius: 20,
                          background: `${statusColor(t.status)}22`,
                          color: statusColor(t.status),
                          border: `1px solid ${statusColor(t.status)}44`
                        }}>
                          {t.status}
                        </span>
                      </div>

                      {/* remarks */}
                      <p style={{
                        margin: "0 0 10px", fontSize: 12,
                        color: "#cbd5e1", lineHeight: 1.5
                      }}>
                        {t.followupDetails ||
                          <span style={{ color: "#475569", fontStyle: "italic" }}>No remarks</span>
                        }
                      </p>

                      {/* meta */}
                      <div style={{
                        display: "flex", flexDirection: "column", gap: 4,
                        padding: "8px 10px",
                        background: "rgba(10,14,22,0.5)",
                        borderRadius: 8,
                        border: "1px solid rgba(148,163,184,0.07)"
                      }}>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          <span style={{ fontWeight: 700 }}>👤 By: </span>
                          <span style={{ color: "#a5b4fc" }}>{t.callBy || "—"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          <span style={{ fontWeight: 700 }}>📞 Contact: </span>
                          <span style={{ color: "#10b981" }}>{t.contactPerson || "—"}</span>
                        </div>
                        {t.nextFollowupDate && (
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            <span style={{ fontWeight: 700 }}>📅 Next: </span>
                            <span style={{ color: "#f59e0b" }}>{t.nextFollowupDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default CallModal;
