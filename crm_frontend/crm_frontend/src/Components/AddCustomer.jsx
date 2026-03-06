import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";

const emptyContact = {
  name: "", phone: "", position: "", primaryContact: false
};

const AddCustomer = () => {

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [c, setC] = useState({
    customerName: "",
    priority: "",
    branches: "",
    leadGenerationDate: today,
    address: "",
    pinCode: "",
    referenceBy: "",
    state: "",
    district: "",
    taluka: "",
    contacts: [{ ...emptyContact, primaryContact: true }]
  });

  const handleChange = e =>
    setC({ ...c, [e.target.name]: e.target.value });

  const handleContactChange = (i, field, value) => {
    const list = [...c.contacts];
    list[i][field] = value;
    setC({ ...c, contacts: list });
  };

  const addContact = () =>
    setC({ ...c, contacts: [...c.contacts, { ...emptyContact }] });

  const removeContact = (i) => {
    if (c.contacts.length === 1) return;
    setC({ ...c, contacts: c.contacts.filter((_, idx) => idx !== i) });
  };

  const setPrimary = (i) => {
    const list = c.contacts.map((ct, idx) => ({
      ...ct, primaryContact: idx === i
    }));
    setC({ ...c, contacts: list });
  };

  const fetchPincode = async (pin) => {
    if (pin.length !== 6) return;
    try {
      const res  = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === "Success") {
        const info = data[0].PostOffice[0];
        setC(prev => ({
          ...prev,
          state:    info.State,
          district: info.District,
          taluka:   info.Block || info.Region
        }));
      }
    } catch {}
  };

  const validate = () => {
    if (!c.customerName.trim())          { toast.error("Customer name required");  return false; }
    if (!c.priority)                     { toast.error("Select priority");          return false; }
    if (c.pinCode && c.pinCode.length !== 6) { toast.error("Invalid pincode");     return false; }

    if (c.leadGenerationDate) {
      const sel = new Date(c.leadGenerationDate);
      const tod = new Date(); tod.setHours(0, 0, 0, 0);
      if (sel > tod) { toast.error("Lead date cannot be future"); return false; }
    }

    if (c.contacts.filter(ct => ct.primaryContact).length !== 1) {
      toast.error("Exactly ONE primary contact required"); return false;
    }

    for (const ct of c.contacts) {
      if (!ct.name.trim())            { toast.error("Contact name required");    return false; }
      if (!/^\d{10}$/.test(ct.phone)) { toast.error("Invalid phone number");     return false; }
    }

    return true;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await api.post("/customers", {
        ...c,
        customerName: c.customerName.trim(),
        branches: Number(c.branches)
      });
      toast.success(`🎉 ${c.customerName} added!`);
      setTimeout(() => navigate("/app/customers"), 1200);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error saving customer"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── reusable field wrapper ── */
  const Field = ({ label, required, children }) => (
    <div style={{ marginBottom: 16 }}>
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
    /* ── full content-area width, no narrow centering ── */
    <div className="page-wrap" style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* ── Page Header ── */}
      <div className="ds-card customer-header mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>Add Customer</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Create a new customer profile</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={save}
            disabled={saving}
            className="elite-btn-primary"
            style={{ padding: "10px 28px", fontSize: 14 }}
          >
            {saving ? "Saving..." : "💾 Save Customer"}
          </button>
          <button
            onClick={() => navigate("/app/customers")}
            className="elite-btn-outline"
            style={{ padding: "10px 24px", fontSize: 14 }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── 3-column main grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 20,
        alignItems: "start",
        flex: 1
      }}>

        {/* ════ COL 1 — Basic Info ════ */}
        <div className="ds-card" style={{ padding: "26px 28px" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#4f46e5",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20
          }}>
            Basic Information
          </div>

          <Field label="Customer Name" required>
            <input
              name="customerName"
              className="elite-input"
              placeholder="Enter customer name"
              value={c.customerName}
              onChange={handleChange}
            />
          </Field>

          <Field label="Priority" required>
            <select
              name="priority"
              className="elite-input"
              value={c.priority}
              onChange={handleChange}
            >
              <option value="">Select priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </Field>

          <Field label="Branches">
            <input
              type="number"
              name="branches"
              className="elite-input"
              placeholder="No. of branches"
              value={c.branches}
              onChange={handleChange}
            />
          </Field>

          <Field label="Lead Generation Date">
            <input
              type="date"
              name="leadGenerationDate"
              className="elite-input"
              value={c.leadGenerationDate}
              onChange={handleChange}
            />
          </Field>

          <Field label="Reference By">
            <input
              name="referenceBy"
              className="elite-input"
              placeholder="Referred by"
              value={c.referenceBy}
              onChange={handleChange}
            />
          </Field>

          <Field label="Address">
            <textarea
              name="address"
              rows="3"
              className="elite-input"
              placeholder="Full address"
              value={c.address}
              onChange={handleChange}
              style={{ resize: "vertical" }}
            />
          </Field>
        </div>

        {/* ════ COL 2 — Location ════ */}
        <div className="ds-card" style={{ padding: "26px 28px" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#4f46e5",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20
          }}>
            Location Details
          </div>

          <Field label="Pin Code">
            <input
              name="pinCode"
              className="elite-input"
              placeholder="6-digit pincode"
              value={c.pinCode}
              onChange={e => {
                handleChange(e);
                fetchPincode(e.target.value);
              }}
            />
            {c.pinCode.length === 6 && c.state && (
              <div style={{
                marginTop: 8, fontSize: 12, color: "#10b981",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 10, padding: "6px 12px"
              }}>
                ✅ Auto-filled from pincode
              </div>
            )}
          </Field>

          <Field label="State">
            <input
              name="state"
              className="elite-input"
              placeholder="State"
              value={c.state}
              onChange={handleChange}
            />
          </Field>

          <Field label="District">
            <input
              name="district"
              className="elite-input"
              placeholder="District"
              value={c.district}
              onChange={handleChange}
            />
          </Field>

          <Field label="Taluka">
            <input
              name="taluka"
              className="elite-input"
              placeholder="Taluka / Block"
              value={c.taluka}
              onChange={handleChange}
            />
          </Field>
        </div>

        {/* ════ COL 3 — Contacts ════ */}
        <div className="ds-card" style={{ padding: "26px 28px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#4f46e5",
              textTransform: "uppercase", letterSpacing: "0.1em"
            }}>
              Contact Persons <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <button
              type="button"
              className="elite-add-btn"
              onClick={addContact}
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              + Add
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {c.contacts.map((ct, i) => (
              <div
                key={i}
                style={{
                  background: ct.primaryContact
                    ? "rgba(16,185,129,0.06)"
                    : "rgba(15,20,25,0.5)",
                  border: ct.primaryContact
                    ? "1px solid rgba(16,185,129,0.35)"
                    : "1px solid rgba(148,163,184,0.12)",
                  borderRadius: 16,
                  padding: "16px 18px",
                  transition: "all 0.2s"
                }}
              >
                {/* Contact number label */}
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#475569",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: 12
                }}>
                  Contact {i + 1}
                  {ct.primaryContact && (
                    <span style={{
                      marginLeft: 8, fontSize: 9, padding: "2px 8px",
                      borderRadius: 20, background: "rgba(16,185,129,0.2)",
                      color: "#10b981", border: "1px solid rgba(16,185,129,0.4)"
                    }}>
                      PRIMARY
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    placeholder="Full Name *"
                    className="elite-input"
                    value={ct.name}
                    onChange={e => handleContactChange(i, "name", e.target.value)}
                  />
                  <input
                    placeholder="Phone Number (10 digits) *"
                    className="elite-input"
                    value={ct.phone}
                    onChange={e => handleContactChange(i, "phone", e.target.value)}
                  />
                  <input
                    placeholder="Position / Designation"
                    className="elite-input"
                    value={ct.position}
                    onChange={e => handleContactChange(i, "position", e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div style={{
                  display: "flex", gap: 10, marginTop: 12,
                  justifyContent: "space-between", alignItems: "center"
                }}>
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    style={{
                      height: 36, padding: "0 14px", borderRadius: 10,
                      border: "none", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s",
                      background: ct.primaryContact
                        ? "linear-gradient(135deg,#10b981,#059669)"
                        : "rgba(16,185,129,0.12)",
                      color: ct.primaryContact ? "#fff" : "#10b981",
                      boxShadow: ct.primaryContact
                        ? "0 4px 14px rgba(16,185,129,0.4)" : "none"
                    }}
                  >
                    ⭐ {ct.primaryContact ? "Primary" : "Set Primary"}
                  </button>

                  {c.contacts.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeContact(i)}
                      title="Remove contact"
                    >
                      ✕
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ── Bottom Save/Cancel (also visible at bottom for long forms) ── */}
      <div style={{
        display: "flex", gap: 14, justifyContent: "flex-end",
        marginTop: 20, paddingBottom: 8
      }}>
        <button
          onClick={save}
          disabled={saving}
          className="elite-btn-primary"
          style={{ padding: "13px 40px", fontSize: 15 }}
        >
          {saving ? "Saving..." : "💾 Save Customer"}
        </button>
        <button
          onClick={() => navigate("/app/customers")}
          className="elite-btn-outline"
          style={{ padding: "13px 32px", fontSize: 15 }}
        >
          Cancel
        </button>
      </div>

    </div>
  );
};

export default AddCustomer;
