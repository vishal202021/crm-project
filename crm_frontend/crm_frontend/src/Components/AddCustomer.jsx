import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 7
      }}
    >
      {label}
      {required && (
        <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>
      )}
    </label>
    {children}
  </div>
);

const emptyContact = {
  name: "",
  phone: "",
  position: "",
  primaryContact: false
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setC(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactChange = (i, field, value) => {
    setC(prev => {
      const list = [...prev.contacts];
      list[i] = { ...list[i], [field]: value };
      return { ...prev, contacts: list };
    });
  };

  const addContact = () => {
    setC(prev => ({
      ...prev,
      contacts: [...prev.contacts, { ...emptyContact }]
    }));
  };

  const removeContact = (i) => {
    setC(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, idx) => idx !== i)
    }));
  };

  const setPrimary = (i) => {
    setC(prev => ({
      ...prev,
      contacts: prev.contacts.map((ct, idx) => ({
        ...ct,
        primaryContact: idx === i
      }))
    }));
  };

  const fetchPincode = async (pin) => {
    if (pin.length !== 6) return;

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();

      if (data[0].Status === "Success") {
        const info = data[0].PostOffice[0];

        setC(prev => ({
          ...prev,
          state: info.State,
          district: info.District,
          taluka: info.Block || info.Region
        }));
      }
    } catch {}
  };

  const validate = () => {

    if (!c.customerName.trim()) {
      toast.error("Customer name required");
      return false;
    }

    if (!c.priority) {
      toast.error("Select priority");
      return false;
    }

    if (c.pinCode && c.pinCode.length !== 6) {
      toast.error("Invalid pincode");
      return false;
    }

    if (c.contacts.filter(ct => ct.primaryContact).length !== 1) {
      toast.error("Exactly ONE primary contact required");
      return false;
    }

    for (const ct of c.contacts) {
      if (!ct.name.trim()) {
        toast.error("Contact name required");
        return false;
      }

      if (!/^\d{10}$/.test(ct.phone)) {
        toast.error("Invalid phone number");
        return false;
      }
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

      setTimeout(() => {
        navigate("/app/customers");
      }, 1200);

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

  return (

    <div className="page-wrap" style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div
        className="ds-card customer-header mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}
      >

        <div>
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>Add Customer</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Create a new customer profile</p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={save}
            disabled={saving}
            className="elite-btn-primary"
          >
            {saving ? "Saving..." : "💾 Save Customer"}
          </button>

          <button
            onClick={() => navigate("/app/customers")}
            className="elite-btn-outline"
          >
            Cancel
          </button>
        </div>

      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20
        }}
      >

        {/* BASIC INFO */}
        <div className="ds-card" style={{ padding: 26 }}>

          <Field label="Customer Name" required>
            <input
              name="customerName"
              className="elite-input"
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
              value={c.branches}
              onChange={handleChange}
            />
          </Field>

          <Field label="Address">
            <textarea
              name="address"
              className="elite-input"
              value={c.address}
              onChange={handleChange}
            />
          </Field>

        </div>

        {/* LOCATION */}
        <div className="ds-card" style={{ padding: 26 }}>

          <Field label="Pin Code">
            <input
              name="pinCode"
              className="elite-input"
              value={c.pinCode}
              onChange={(e) => {
                handleChange(e);
                fetchPincode(e.target.value);
              }}
            />
          </Field>

          <Field label="State">
            <input
              name="state"
              className="elite-input"
              value={c.state}
              onChange={handleChange}
            />
          </Field>

          <Field label="District">
            <input
              name="district"
              className="elite-input"
              value={c.district}
              onChange={handleChange}
            />
          </Field>

          <Field label="Taluka">
            <input
              name="taluka"
              className="elite-input"
              value={c.taluka}
              onChange={handleChange}
            />
          </Field>

        </div>

        <div className="ds-card" style={{ padding: 26 }}>

          <Field label="Contacts" required>
            <div />
          </Field>

          {c.contacts.map((ct, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                padding: "12px",
                borderRadius: 8,
                border: ct.primaryContact
                  ? "1.5px solid #6366f1"
                  : "1.5px solid rgba(255,255,255,0.08)",
              }}
            >

              <input
                placeholder="Contact Name"
                className="elite-input"
                value={ct.name}
                onChange={(e) =>
                  handleContactChange(i, "name", e.target.value)
                }
                style={{ marginBottom: 8, width: "100%", boxSizing: "border-box" }}
              />

              <input
                placeholder="Phone (10 digits)"
                className="elite-input"
                value={ct.phone}
                maxLength={10}
                onChange={(e) =>
                  handleContactChange(i, "phone", e.target.value)
                }
                style={{ marginBottom: 8, width: "100%", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", gap: 8 }}>

                <button
                  type="button"
                  onClick={() => setPrimary(i)}
                  className={ct.primaryContact ? "elite-btn-primary" : "elite-btn-outline"}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: "5px 10px",
                    cursor: "pointer"
                  }}
                >
                  {ct.primaryContact ? "✓ Primary" : "Set Primary"}
                </button>

                {c.contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(i)}
                    className="elite-btn-outline"
                    style={{
                      fontSize: 12,
                      padding: "5px 10px",
                      cursor: "pointer",
                      color: "#f87171",
                      borderColor: "#f87171"
                    }}
                  >
                    Remove
                  </button>
                )}

              </div>

            </div>
          ))}

          <button
            type="button"
            onClick={addContact}
            className="elite-btn-outline"
            style={{
              width: "100%",
              marginTop: 4,
              cursor: "pointer",
              borderStyle: "dashed"
            }}
          >
            + Add Contact
          </button>

        </div>

      </div>

    </div>
  );
};

export default AddCustomer;
