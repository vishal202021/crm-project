import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { getUsername } from "./auth";
import { toast } from "react-toastify";
import { emitCRMUpdate } from "./events";

const CallModal = ({ customer, onClose, onSaved }) => {

  const [saving, setSaving] = useState(false);
  const dateRef = useRef(null);

  const [data, setData] = useState({
    status: "",
    followupDetails: "",
    nextFollowupDate: "",
    callBy: getUsername() || ""
  });

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
      setData(prev => ({ ...prev, nextFollowupDate: addDays(1) }));
    if (data.status === "Interested")
      setData(prev => ({ ...prev, nextFollowupDate: addDays(3) }));
    if (["Not Answered", "Busy", "Switched Off"].includes(data.status))
      setData(prev => ({ ...prev, nextFollowupDate: addDays(1) }));
    if (data.status === "Converted")
      setData(prev => ({ ...prev, nextFollowupDate: addDays(7) }));
    if (data.status === "Not Interested")
      setData(prev => ({ ...prev, nextFollowupDate: addDays(30) }));
    if (data.status === "Connected" && !data.nextFollowupDate)
      setData(prev => ({ ...prev, nextFollowupDate: addDays(2) }));
  }, [data.status]);

  const validate = () => {
    if (!data.status.trim()) { toast.error("Select call outcome"); return false; }
    const remarks = (data.followupDetails || "").trim();
    if (!remarks) { toast.error("Remarks are required"); return false; }
    if (remarks.length < 5) { toast.error("Remarks must be at least 5 characters"); return false; }
    if (remarks.length > 500) { toast.error("Remarks max 500 chars"); return false; }
    if (!/[a-zA-Z0-9]/.test(remarks)) { toast.error("Enter meaningful remarks"); return false; }
    if (!data.nextFollowupDate) { toast.error("Please select next follow-up date"); return false; }
    const selected = new Date(data.nextFollowupDate);
    const today = new Date(todayStr);
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (selected < today) { toast.error("Follow-up date cannot be in past"); return false; }
    return true;
  };

  const save = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    const payload = {
      customerId: customer.id,
      interactionDate: todayStr,
      status: data.status.trim(),
      followupDetails: data.followupDetails.trim(),
      nextFollowupDate: data.nextFollowupDate,
      callBy: data.callBy.trim() || null,
      callingType: "Call"
    };
    try {
      await api.post("/interactions", payload);
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

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 18 }}>
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

  const badgeClass = (p) => {
    if (p === "High")   return { bg: "rgba(239,68,68,0.15)",   color: "#ef4444" };
    if (p === "Medium") return { bg: "rgba(245,158,11,0.15)",  color: "#f59e0b" };
    if (p === "Low")    return { bg: "rgba(16,185,129,0.15)",  color: "#10b981" };
    return { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" };
  };

  const pc = badgeClass(customer.priority);

  return createPortal(
    /* ── Full-screen overlay covering entire viewport ── */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,           /* above sidebar + nav */
        background: "rgba(10,14,26,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        animation: "fadeIn 0.25s ease",
      }}
    >
      {/* ── Inner full-height card ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "24px",
          borderRadius: 24,
          background: "rgba(15,20,25,0.95)",
          border: "1px solid rgba(148,163,184,0.12)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "popUp 0.3s cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #6366f1, #818cf8, transparent)"
        }} />

        {/* ── Top Bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: "1px solid rgba(148,163,184,0.1)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              borderRadius: 14, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20,
              boxShadow: "0 8px 25px rgba(99,102,241,0.4)"
            }}>
              📞
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>
                Log Call
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                {customer.customerName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="elite-close"
            style={{ flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* ── Body: 2 columns ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}>

          {/* ════ LEFT — Customer & Contact Info ════ */}
          <div style={{
            borderRight: "1px solid rgba(148,163,184,0.1)",
            padding: "28px 28px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}>

            {/* Customer Details */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#4f46e5",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14
              }}>
                Customer Details
              </div>

              {[
                ["Customer",  customer.customerName],
                ["Branches",  customer.branches    || "-"],
                ["Priority",  customer.priority    || "-"],
                ["Status",    customer.status      || "New"],
                ["Lead Date", customer.leadGenerationDate || "-"],
                ["Reference", customer.referenceBy || "-"],
                ["State",     customer.state       || "-"],
                ["District",  customer.district    || "-"],
                ["Taluka",    customer.taluka      || "-"],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(148,163,184,0.07)"
                }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
                    {label}
                  </span>
                  {label === "Priority" ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 10px",
                      borderRadius: 20, background: pc.bg, color: pc.color,
                      border: `1px solid ${pc.color}55`
                    }}>
                      {value}
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: "#cbd5e1", textAlign: "right" }}>
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Persons */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#4f46e5",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14
              }}>
                Contact Persons
              </div>

              {(!customer.contacts || customer.contacts.length === 0) && (
                <p style={{ color: "#475569", fontSize: 13 }}>No contacts</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {customer.contacts?.map((ct, i) => (
                  <div key={i} style={{
                    background: ct.primaryContact
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(15,20,25,0.6)",
                    border: ct.primaryContact
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid rgba(148,163,184,0.12)",
                    borderRadius: 14, padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, minWidth: 38,
                      background: "linear-gradient(135deg,#6366f1,#818cf8)",
                      borderRadius: 12, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 15, color: "#fff"
                    }}>
                      {(ct.name || "?")[0].toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 13, color: "#f1f5f9" }}>{ct.name}</b>
                        {ct.primaryContact && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "2px 7px",
                            borderRadius: 20, background: "rgba(16,185,129,0.2)",
                            color: "#10b981", border: "1px solid rgba(16,185,129,0.4)"
                          }}>
                            PRIMARY
                          </span>
                        )}
                      </div>
                      {ct.position && (
                        <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2, fontWeight: 600 }}>
                          💼 {ct.position}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                        📞 {ct.phone || "-"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ════ RIGHT — Log Call Form ════ */}
          <div style={{
            padding: "32px 40px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}>

            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 24 }}>
              Fill in the call details below
            </div>

            {/* Call Outcome */}
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

            {/* Remarks */}
            <Field label={<>Remarks <span style={{ color: "#ef4444" }}>*</span></>}>
              <textarea
                rows="6"
                maxLength={500}
                className="elite-input w-100"
                placeholder="Write your call notes here..."
                value={data.followupDetails}
                onChange={e => setData({ ...data, followupDetails: e.target.value })}
                style={{ resize: "vertical" }}
              />
              <div style={{
                textAlign: "right", fontSize: 11, color: "#475569", marginTop: 5
              }}>
                {(data.followupDetails || "").length}/500
              </div>
            </Field>

            {/* Date + Caller row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Next Follow-up Date */}
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

              {/* Called By */}
              <Field label="Called By">
                <input
                  className="elite-input w-100"
                  placeholder="Your name"
                  value={data.callBy}
                  onChange={e => setData({ ...data, callBy: e.target.value })}
                />
              </Field>

            </div>

            {/* Spacer pushes buttons to bottom */}
            <div style={{ flex: 1 }} />

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
              <button
                onClick={save}
                disabled={saving}
                className="elite-save"
                style={{ flex: 1, padding: "15px 0", fontSize: 15 }}
              >
                {saving ? "Saving..." : "💾 Save Call"}
              </button>
              <button
                onClick={onClose}
                className="elite-cancel"
                style={{ flex: 1, padding: "15px 0", fontSize: 15 }}
              >
                Cancel
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>,

    document.body
  );
};

export default CallModal;
