import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { getUsername } from "./auth";
import { toast } from "react-toastify";
import { emitCRMUpdate } from "./events";

const CallModal = ({ customer, onClose, onSaved }) => {

  const [saving, setSaving] = useState(false);
  const dateRef = useRef(null);   // ← ref to open calendar on click

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

    if (!data.status.trim()) {
      toast.error("Select call outcome");
      return false;
    }

    const remarks = (data.followupDetails || "").trim();

    if (!remarks) {
      toast.error("Remarks are required");
      return false;
    }

    if (remarks.length < 5) {
      toast.error("Remarks must be at least 5 characters");
      return false;
    }

    if (remarks.length > 500) {
      toast.error("Remarks max 500 chars");
      return false;
    }

    if (!/[a-zA-Z0-9]/.test(remarks)) {
      toast.error("Enter meaningful remarks");
      return false;
    }

    if (!data.nextFollowupDate) {
      toast.error("Please select next follow-up date");
      return false;
    }

    const selected = new Date(data.nextFollowupDate);
    const today = new Date(todayStr);
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      toast.error("Follow-up date cannot be in past");
      return false;
    }

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

  // ── Open native calendar picker on click/tap ──
  const openCalendar = () => {
    try {
      dateRef.current?.showPicker();
    } catch {
      dateRef.current?.click();
    }
  };

  return createPortal(

    <div className="elite-modal-bg" onClick={onClose}>

      <div className="elite-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="elite-modal-header">
          <div>
            <h5>📞 Log Call</h5>
            <small className="text-muted">
              {customer.customerName || "Customer"}
            </small>
          </div>
          <button className="elite-close" onClick={onClose}>✕</button>
        </div>

        {/* Contact card */}
        <div className="glass p-3 mb-3">
          <b>{customer.contactName || "-"}</b><br />
          <span className="text-muted">{customer.contactNo || "-"}</span>
        </div>

        {/* Call Outcome */}
        <label style={{
          fontSize: 12, fontWeight: 700, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.06em",
          display: "block", marginBottom: 6
        }}>
          Call Outcome
        </label>
        <select
          className="elite-input w-100 mb-3"
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

        {/* Remarks */}
        <label style={{
          fontSize: 12, fontWeight: 700, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.06em",
          display: "block", marginBottom: 6
        }}>
          Remarks <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea
          rows="3"
          maxLength={500}
          className="elite-input w-100 mb-2"
          placeholder="Remarks (required)"
          value={data.followupDetails}
          onChange={e => setData({ ...data, followupDetails: e.target.value })}
        />
        <small className="text-muted d-block mb-3">
          {(data.followupDetails || "").length}/500
        </small>

        {/* Next Follow-up Date — label as headline + calendar trigger */}
        <label style={{
          fontSize: 12, fontWeight: 700, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.06em",
          display: "block", marginBottom: 6
        }}>
          📅 Next Follow-up Date
        </label>
        <div
          style={{ position: "relative", marginBottom: 12, cursor: "pointer" }}
          onClick={openCalendar}
        >
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

        {/* Caller */}
        <label style={{
          fontSize: 12, fontWeight: 700, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.06em",
          display: "block", marginBottom: 6
        }}>
          Called By
        </label>
        <input
          className="elite-input w-100 mb-3"
          placeholder="Your name"
          value={data.callBy}
          onChange={e => setData({ ...data, callBy: e.target.value })}
        />

        {/* Action buttons */}
        <div className="d-flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="elite-save flex-fill"
          >
            {saving ? "Saving..." : "Save Call"}
          </button>
          <button onClick={onClose} className="elite-cancel flex-fill">
            Cancel
          </button>
        </div>

      </div>
    </div>,

    document.body
  );
};

export default CallModal;
