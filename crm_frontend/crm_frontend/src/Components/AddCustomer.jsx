import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { getRole } from "./auth";
import { toast } from "react-toastify";

const AddCustomer = () => {

  const navigate = useNavigate();
  const role     = getRole();
  const [saving,     setSaving]     = useState(false);
  const [users,      setUsers]      = useState([]);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg,     setPinMsg]     = useState("");
  const dateRef = useRef(null);

  const [form, setForm] = useState({
    customerName: "", priority: "Medium", branches: "",
    leadGenerationDate: "", referenceBy: "", address: "",
    pinCode: "", state: "", district: "", taluka: "",
    status: "", assignedToUserId: "",
  });

  const [contacts, setContacts] = useState([
    { name: "", phone: "", position: "", primaryContact: true }
  ]);

  /* Load users for assign dropdown */
  useEffect(() => {
    if (role !== "ADMIN") return;
    api.get("/auth/users")
      .then(res => setUsers(Array.isArray(res.data) ? res.data : res.data?.content || []))
      .catch(() => setUsers([]));
  }, [role]);

  /* Pincode autofill */
  useEffect(() => {
    if (form.pinCode?.length !== 6) { setPinMsg(""); return; }
    setPinLoading(true);
    fetch(`https://api.postalpincode.in/pincode/${form.pinCode}`)
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (po) {
          setForm(f => ({ ...f, state: po.State || "", district: po.District || "", taluka: po.Block || "" }));
          setPinMsg(`✅ ${po.District}, ${po.State}`);
        } else setPinMsg("❌ Invalid pincode");
      })
      .catch(() => setPinMsg(""))
      .finally(() => setPinLoading(false));
  }, [form.pinCode]);

  const setPrimary   = (idx) => setContacts(contacts.map((c, i) => ({ ...c, primaryContact: i === idx })));
  const addContact   = () => setContacts([...contacts, { name: "", phone: "", position: "", primaryContact: false }]);
  const removeContact = (idx) => {
    if (contacts.length === 1) return;
    const updated = contacts.filter((_, i) => i !== idx);
    if (!updated.some(c => c.primaryContact)) updated[0].primaryContact = true;
    setContacts(updated);
  };
  const updateContact = (idx, field, val) =>
    setContacts(contacts.map((c, i) => i === idx ? { ...c, [field]: val } : c));

  const validate = () => {
    if (!form.customerName.trim()) { toast.error("Customer name required"); return false; }
    const p = contacts.find(c => c.primaryContact);
    if (!p?.name.trim())  { toast.error("Primary contact name required");  return false; }
    if (!p?.phone.trim()) { toast.error("Primary contact phone required"); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await api.post("/customers", {
        ...form,
        assignedToUserId: form.assignedToUserId ? Number(form.assignedToUserId) : null,
        contacts,
      });
      toast.success("✅ Customer added!");
      setTimeout(() => navigate("/app/customers"), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const F = ({ label, required, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="page-wrap">

      {/* Header */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>➕ Add Customer</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Create a new lead and optionally assign to a user</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={save} disabled={saving} className="elite-save" style={{ padding: "10px 24px" }}>
            {saving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={() => navigate("/app/customers")} className="elite-cancel" style={{ padding: "10px 24px" }}>
            Cancel
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Col 1 – Basic */}
        <div className="ds-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 16, textTransform: "uppercase" }}>
            📋 Basic Info
          </div>

          <F label="Customer Name" required>
            <input className="elite-input w-100" value={form.customerName}
              onChange={e => setForm({ ...form, customerName: e.target.value })} />
          </F>

          <F label="Priority">
            <select className="elite-input w-100" value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </F>

          <F label="Status">
            <select className="elite-input w-100" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="">Select Status</option>
              <option>New</option><option>Interested</option><option>Follow-up</option>
              <option>Connected</option><option>Converted</option><option>Not Interested</option>
            </select>
          </F>

          <F label="Branches">
            <input className="elite-input w-100" value={form.branches}
              onChange={e => setForm({ ...form, branches: e.target.value })} />
          </F>

          <F label="Lead Date">
            <input type="date" ref={dateRef} className="elite-input w-100"
              value={form.leadGenerationDate}
              onChange={e => setForm({ ...form, leadGenerationDate: e.target.value })}
              onClick={() => { try { dateRef.current?.showPicker(); } catch {} }} />
          </F>

          <F label="Reference By">
            <input className="elite-input w-100" value={form.referenceBy}
              onChange={e => setForm({ ...form, referenceBy: e.target.value })} />
          </F>

          <F label="Address">
            <textarea rows="3" className="elite-input w-100" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })} />
          </F>

          {/* ── Assign To (ADMIN only) ── */}
          {role === "ADMIN" && (
            <F label="🎯 Assign To User">
              <select className="elite-input w-100" value={form.assignedToUserId}
                onChange={e => setForm({ ...form, assignedToUserId: e.target.value })}>
                <option value="">— Visible to all users —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username || u.email}
                    {u.role ? ` (${u.role})` : ""}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 5, lineHeight: 1.5 }}>
                💡 If assigned, only that user + Admins can see this lead
              </div>
            </F>
          )}
        </div>

        {/* Col 2 – Location */}
        <div className="ds-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 16, textTransform: "uppercase" }}>
            📍 Location
          </div>

          <F label="Pin Code">
            <input className="elite-input w-100" maxLength={6} value={form.pinCode}
              onChange={e => setForm({ ...form, pinCode: e.target.value.replace(/\D/g, "") })} />
            {pinLoading && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Looking up...</div>}
            {pinMsg && (
              <div style={{ fontSize: 11, marginTop: 4, color: pinMsg.startsWith("✅") ? "#10b981" : "#ef4444" }}>
                {pinMsg}
              </div>
            )}
          </F>
          <F label="State">
            <input className="elite-input w-100" value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })} />
          </F>
          <F label="District">
            <input className="elite-input w-100" value={form.district}
              onChange={e => setForm({ ...form, district: e.target.value })} />
          </F>
          <F label="Taluka">
            <input className="elite-input w-100" value={form.taluka}
              onChange={e => setForm({ ...form, taluka: e.target.value })} />
          </F>
        </div>

        {/* Col 3 – Contacts */}
        <div className="ds-card">
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#f59e0b",
            marginBottom: 16, textTransform: "uppercase",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>👤 Contacts</span>
            <button onClick={addContact} style={{
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
              color: "#a5b4fc", borderRadius: 8, padding: "4px 10px",
              fontSize: 11, cursor: "pointer",
            }}>+ Add</button>
          </div>

          {contacts.map((c, idx) => (
            <div key={idx} style={{
              background: "rgba(15,20,30,0.5)",
              border: `1px solid ${c.primaryContact ? "rgba(16,185,129,0.4)" : "rgba(148,163,184,0.1)"}`,
              borderRadius: 12, padding: 14, marginBottom: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.primaryContact ? "#10b981" : "#64748b" }}>
                  {c.primaryContact ? "⭐ Primary" : `Contact ${idx + 1}`}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {!c.primaryContact && (
                    <button onClick={() => setPrimary(idx)} style={{
                      background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10b981", borderRadius: 6, padding: "2px 8px",
                      fontSize: 10, cursor: "pointer",
                    }}>Set Primary</button>
                  )}
                  {contacts.length > 1 && (
                    <button onClick={() => removeContact(idx)} style={{
                      background: "rgba(239,68,68,0.1)", border: "none",
                      color: "#ef4444", borderRadius: 6, padding: "2px 6px",
                      fontSize: 12, cursor: "pointer",
                    }}>✕</button>
                  )}
                </div>
              </div>
              <input className="elite-input w-100" placeholder="Name *" value={c.name}
                onChange={e => updateContact(idx, "name", e.target.value)} style={{ marginBottom: 8 }} />
              <input className="elite-input w-100" placeholder="Phone *" value={c.phone}
                onChange={e => updateContact(idx, "phone", e.target.value)} style={{ marginBottom: 8 }} />
              <input className="elite-input w-100" placeholder="Position" value={c.position}
                onChange={e => updateContact(idx, "position", e.target.value)} />
            </div>
          ))}
        </div>

      </div>

      <div className="ds-card mt-3 d-flex justify-content-end" style={{ gap: 10 }}>
        <button onClick={save} disabled={saving} className="elite-save" style={{ padding: "12px 32px" }}>
          {saving ? "Saving..." : "💾 Save Customer"}
        </button>
        <button onClick={() => navigate("/app/customers")} className="elite-cancel" style={{ padding: "12px 32px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddCustomer;
