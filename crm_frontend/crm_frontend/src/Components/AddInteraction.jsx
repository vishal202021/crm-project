import { useState, useEffect, useRef } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddInteraction = () => {

  const navigate  = useNavigate();
  const [saving,  setSaving]    = useState(false);
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState("");
  const [showDrop, setShowDrop]  = useState(false);
  const dropRef = useRef(null);

  const visitDateRef    = useRef(null);
  const followupDateRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customerId:       "",
    customerName:     "",   // display only
    interactionDate:  today,
    followupDetails:  "",
    nextFollowupDate: "",
    status:           "",
    visitedBy:        "",
    /* callingType is always "Visit" — never sent as Call */
  });

  /* ── Load customers for search dropdown ── */
  useEffect(() => {
    api.get("/customers/summary", { params: { page: 0, size: 200 } })
      .then(res => setCustomers(res.data.content || []))
      .catch(() => {});
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.customerName?.toLowerCase().includes(custSearch.toLowerCase())
  ).slice(0, 8);

  const selectCustomer = (c) => {
    setForm(prev => ({ ...prev, customerId: c.id, customerName: c.customerName }));
    setCustSearch(c.customerName);
    setShowDrop(false);
  };

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const openPicker = (ref) => {
    try { ref.current?.showPicker(); }
    catch { ref.current?.click(); }
  };

  const validate = () => {
    if (!form.customerId)         { toast.error("Please select a customer");           return false; }
    if (!form.status)             { toast.error("Select visit outcome/status");        return false; }
    if (!form.visitedBy.trim())   { toast.error("Visited by is required");             return false; }
    if (!form.interactionDate)    { toast.error("Visit date is required");             return false; }

    if (form.nextFollowupDate && form.interactionDate) {
      if (form.nextFollowupDate < form.interactionDate) {
        toast.error("Follow-up date cannot be before visit date");
        return false;
      }
    }

    return true;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await api.post("/interactions", {
        customerId:       Number(form.customerId),
        interactionDate:  form.interactionDate,
        followupDetails:  form.followupDetails?.trim()  || null,
        nextFollowupDate: form.nextFollowupDate          || null,
        status:           form.status,
        visitedBy:        form.visitedBy.trim(),
        callBy:           null,
        callingType:      "Visit",   /* always Visit */
      });
      toast.success("✅ Visit recorded!");
      setTimeout(() => navigate("/app/interactions"), 1200);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Error saving visit"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── field wrapper ── */
  const Field = ({ label, required, children }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        color: "#64748b", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: 7
      }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="page-wrap" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div className="ds-card customer-header d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>🏢 Log Customer Visit</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Record an in-person customer visit</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={save}
            disabled={saving}
            className="elite-btn-primary"
            style={{ padding: "10px 28px", fontSize: 14 }}
          >
            {saving ? "Saving..." : "💾 Save Visit"}
          </button>
          <button
            onClick={() => navigate("/app/interactions")}
            className="elite-btn-outline"
            style={{ padding: "10px 24px", fontSize: 14 }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── 2-column form ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        alignItems: "start"
      }}>

        {/* ════ LEFT ════ */}
        <div className="ds-card" style={{ padding: "26px 28px" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#4f46e5",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20
          }}>
            Visit Details
          </div>

          {/* Customer Search */}
          <Field label="Customer" required>
            <div style={{ position: "relative" }} ref={dropRef}>
              <input
                className="elite-input"
                placeholder="Search customer name..."
                value={custSearch}
                onChange={e => {
                  setCustSearch(e.target.value);
                  setShowDrop(true);
                  if (!e.target.value) setForm(prev => ({ ...prev, customerId: "", customerName: "" }));
                }}
                onFocus={() => setShowDrop(true)}
                autoComplete="off"
              />
              {showDrop && filteredCustomers.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "#0f1419",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: 12, zIndex: 999,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                  maxHeight: 220, overflowY: "auto"
                }}>
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      style={{
                        padding: "11px 16px", cursor: "pointer",
                        fontSize: 13, color: "#e2e8f0",
                        borderBottom: "1px solid rgba(148,163,184,0.08)",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {c.customerName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Visit Date */}
          <Field label="Visit Date" required>
            <div style={{ cursor: "pointer" }} onClick={() => openPicker(visitDateRef)}>
              <input
                ref={visitDateRef}
                name="interactionDate"
                type="date"
                max={today}
                className="elite-input"
                value={form.interactionDate}
                onChange={handleChange}
                style={{ cursor: "pointer" }}
              />
            </div>
          </Field>

          {/* Visited By */}
          <Field label="Visited By" required>
            <input
              name="visitedBy"
              className="elite-input"
              placeholder="Name of person who visited"
              value={form.visitedBy}
              onChange={handleChange}
            />
          </Field>

          {/* Visit Outcome / Status */}
          <Field label="Visit Outcome" required>
            <select
              name="status"
              className="elite-input"
              value={form.status}
              onChange={handleChange}
            >
              <option value="">Select outcome...</option>
              <option>Interested</option>
              <option>Not Interested</option>
              <option>Follow-up</option>
              <option>Converted</option>
              <option>Closed</option>
            </select>
          </Field>

        </div>

        {/* ════ RIGHT ════ */}
        <div className="ds-card" style={{ padding: "26px 28px" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#4f46e5",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20
          }}>
            Notes & Follow-up
          </div>

          {/* Discussion Notes */}
          <Field label="Discussion Notes">
            <textarea
              name="followupDetails"
              rows="6"
              className="elite-input"
              placeholder="What was discussed during the visit..."
              value={form.followupDetails}
              onChange={handleChange}
              style={{ resize: "vertical" }}
            />
            <div style={{
              textAlign: "right", fontSize: 11,
              color: "#475569", marginTop: 5
            }}>
              {(form.followupDetails || "").length} chars
            </div>
          </Field>

          {/* Next Follow-up Date */}
          <Field label="📅 Next Follow-up Date">
            <div style={{ cursor: "pointer" }} onClick={() => openPicker(followupDateRef)}>
              <input
                ref={followupDateRef}
                name="nextFollowupDate"
                type="date"
                min={form.interactionDate || today}
                className="elite-input"
                value={form.nextFollowupDate}
                onChange={handleChange}
                style={{ cursor: "pointer" }}
              />
            </div>
          </Field>

        </div>

      </div>

      {/* ── Bottom buttons ── */}
      <div style={{
        display: "flex", gap: 14, justifyContent: "flex-end",
        paddingBottom: 8
      }}>
        <button
          onClick={save}
          disabled={saving}
          className="elite-btn-primary"
          style={{ padding: "13px 40px", fontSize: 15 }}
        >
          {saving ? "Saving..." : "💾 Save Visit"}
        </button>
        <button
          onClick={() => navigate("/app/interactions")}
          className="elite-btn-outline"
          style={{ padding: "13px 32px", fontSize: 15 }}
        >
          Cancel
        </button>
      </div>

    </div>
  );
};

export default AddInteraction;
