import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { getUsername } from "./auth";
import { toast } from "react-toastify";
import { emitCRMUpdate } from "./events";

const CallModal = ({ customer, onClose, onSaved, fullPage = false }) => {

  const [saving, setSaving] = useState(false);

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

  /* ── Shared form content ── */
  const formContent = (
    <>
      <div className="glass p-3 mb-3">
        <b>{customer.contactName || "-"}</b><br />
        <span className="text-muted">{customer.contactNo || "-"}</span>
      </div>

      <select
        className="elite-input w-100 mb-3"
        value={data.status}
        onChange={e => setData({ ...data, status: e.target.value })}
      >
        <option value="">Call Outcome</option>
        <option>Connected</option>
        <option>Not Answered</option>
        <option>Switched Off</option>
        <option>Busy</option>
        <option>Interested</option>
        <option>Follow-up</option>
        <option>Converted</option>
        <option>Not Interested</option>
      </select>

      <textarea
        rows="4"
        maxLength={500}
        className="elite-input w-100 mb-2"
        placeholder="Remarks (required)"
        value={data.followupDetails}
        onChange={e => setData({ ...data, followupDetails: e.target.value })}
      />

      <small className="text-muted d-block mb-3">
        {(data.followupDetails || "").length}/500
      </small>

      <div className="row g-2 mb-3">
        <div className="col">
          <input
            type="date"
            min={todayStr}
            className="elite-input w-100"
            value={data.nextFollowupDate}
            onChange={e => setData({ ...data, nextFollowupDate: e.target.value })}
          />
        </div>
        <div className="col">
          <input
            className="elite-input w-100"
            placeholder="Caller"
            value={data.callBy}
            onChange={e => setData({ ...data, callBy: e.target.value })}
          />
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="elite-save flex-fill"
        >
          {saving ? "Saving..." : "Save Call"}
        </button>

        <button
          onClick={onClose}
          className="elite-cancel flex-fill"
        >
          Cancel
        </button>
      </div>
    </>
  );

  /* ── Full-page mode ── */
  if (fullPage) {
    return (
      <div className="page-wrap d-flex align-items-center justify-content-center"
        style={{ minHeight: "calc(100vh - 70px)" }}
      >
        <div className="elite-form-card" style={{ width: 560 }}>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h4 style={{ fontSize: "1.4em" }}>📞 Log Call</h4>
              <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
                {customer.customerName || "Customer"}
              </p>
            </div>
            <button className="elite-close" onClick={onClose}>✕</button>
          </div>

          {formContent}

        </div>
      </div>
    );
  }

  /* ── Default portal modal mode ── */
  return createPortal(
    <div className="elite-modal-bg" onClick={onClose}>
      <div className="elite-modal" onClick={e => e.stopPropagation()}>

        <div className="elite-modal-header">
          <div>
            <h5>📞 Log Call</h5>
            <small className="text-muted">
              {customer.customerName || "Customer"}
            </small>
          </div>
          <button className="elite-close" onClick={onClose}>✕</button>
        </div>

        {formContent}

      </div>
    </div>,
    document.body
  );
};

export default CallModal;
