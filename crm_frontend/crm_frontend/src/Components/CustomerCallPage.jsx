import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import CallModal from "./CallModal";
import { CRM_EVENTS } from "./events";

const CustomerCallPage = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [callOpen, setCallOpen] = useState(false);

  const load = async () => {
    const c = await api.get("/customers/" + id);
    setCustomer(c.data);

    const t = await api.get("/interactions/timeline/" + id);
    if (Array.isArray(t.data))
      setTimeline(t.data);
    else
      setTimeline(t.data.content || []);
  };

  useEffect(() => {
    load();
    const reload = () => load();
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, reload);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, reload);
  }, [id]);

  if (!customer) return null;

  const badgeClass = (p) => {
    if (p === "High")   return "badge-high";
    if (p === "Medium") return "badge-medium";
    if (p === "Low")    return "badge-low";
    return "";
  };

  const statusColor = (s) => {
    if (s === "Interested")     return "#10b981";
    if (s === "Converted")      return "#6366f1";
    if (s === "Not Interested") return "#ef4444";
    if (s === "Follow-up")      return "#f59e0b";
    if (["Busy","Not Answered","Switched Off"].includes(s)) return "#94a3b8";
    return "#a5b4fc";
  };

  return (
    <div className="page-wrap" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Page Header ── */}
      <div
        className="ds-card customer-header d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}
      >
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>{customer.customerName}</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Customer Call History</p>
        </div>
        <button className="elite-add-btn" onClick={() => setCallOpen(true)}>
          📞 Log Call
        </button>
      </div>

      {/* ── Main Layout: Left panel + Right full timeline ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: 20,
        alignItems: "start"
      }}>

        {/* ════ LEFT PANEL ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer Details */}
          <div className="ds-card" style={{ padding: "22px 24px" }}>
            <h5 style={{ fontWeight: 700, marginBottom: 16 }}>Customer Details</h5>

            {[
              ["Customer Name",  customer.customerName],
              ["Branches",       customer.branches || "-"],
              ["Lead Date",      customer.leadGenerationDate || "-"],
              ["Reference By",   customer.referenceBy || "-"],
              ["Pin Code",       customer.pinCode || "-"],
              ["State",          customer.state || "-"],
              ["District",       customer.district || "-"],
              ["Taluka",         customer.taluka || "-"],
              ["Address",        customer.address || "-"],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid rgba(148,163,184,0.08)"
              }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, color: "#e2e8f0", textAlign: "right" }}>
                  {value}
                </span>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <span className={`elite-badge ${badgeClass(customer.priority)}`}>
                {customer.priority || "—"}
              </span>
              <span className="elite-badge" style={{
                background: "rgba(99,102,241,0.15)",
                color: "#a5b4fc",
                borderColor: "rgba(99,102,241,0.35)"
              }}>
                {customer.status || "New"}
              </span>
            </div>
          </div>

        
          <div className="ds-card" style={{ padding: "22px 24px" }}>
            <h5 style={{ fontWeight: 700, marginBottom: 16 }}>Contact Persons</h5>

            {(!customer.contacts || customer.contacts.length === 0) && (
              <p className="text-muted">No contacts added</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {customer.contacts?.map((ct, i) => (
                <div
                  key={i}
                  className={`contact-card ${ct.primaryContact ? "primary" : ""}`}
                  style={{ padding: "14px 16px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                    {/* Avatar */}
                    <div className="avatar" style={{ width: 40, height: 40, minWidth: 40, fontSize: 15 }}>
                      {(ct.name || "?")[0].toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Name + Primary badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 14, color: "#f1f5f9" }}>{ct.name}</b>
                        {ct.primaryContact && (
                          <span className="badge bg-success" style={{ fontSize: 10, padding: "2px 8px" }}>
                            PRIMARY
                          </span>
                        )}
                      </div>

                      {/* Position — shown prominently */}
                      {ct.position && (
                        <div style={{
                          fontSize: 12, color: "#a5b4fc", marginTop: 3,
                          fontWeight: 600, letterSpacing: "0.02em"
                        }}>
                          💼 {ct.position}
                        </div>
                      )}

                      {/* Phone */}
                      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                        📞 {ct.phone || "-"}
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ════ RIGHT PANEL — Full Call History Timeline ════ */}
        <div className="ds-card" style={{ padding: "22px 24px" }}>

          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 22
          }}>
            <h5 style={{ fontWeight: 700, margin: 0 }}>📋 All Call History</h5>
            <span style={{
              fontSize: 12, fontWeight: 700,
              background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 20, padding: "4px 14px"
            }}>
              {timeline.length} {timeline.length === 1 ? "Call" : "Calls"}
            </span>
          </div>

          {/* Empty state */}
          {timeline.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              color: "#334155", fontSize: 14
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📵</div>
              <div>No calls logged yet.</div>
              <div style={{ marginTop: 6 }}>
                Click <b style={{ color: "#6366f1" }}>Log Call</b> to add the first one.
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="ds-timeline" style={{ paddingLeft: 24 }}>
            {timeline.map((t, idx) => (
              <div key={t.id || idx} className="ds-timeline-item">

                <div className="ds-dot" />

                <div className="ds-timeline-card" style={{ width: "100%" }}>

                  {/* Row 1: Date + Status badge */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10
                  }}>
                    <div className="ds-time">{t.interactionDate}</div>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: "3px 12px",
                      borderRadius: 20,
                      background: `${statusColor(t.status)}22`,
                      color: statusColor(t.status),
                      border: `1px solid ${statusColor(t.status)}55`
                    }}>
                      {t.status}
                    </span>
                  </div>

                  {/* Remarks */}
                  <p style={{ margin: "0 0 12px", color: "#cbd5e1", lineHeight: 1.6, fontSize: 14 }}>
                    {t.followupDetails || (
                      <span style={{ color: "#475569", fontStyle: "italic" }}>No remarks</span>
                    )}
                  </p>

                  {/* ── Info row: Called By + Contact Person + Next Follow-up ── */}
                  <div style={{
                    display: "flex", gap: 0, flexWrap: "wrap",
                    background: "rgba(15,20,25,0.5)",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.1)",
                    overflow: "hidden"
                  }}>

                    {/* Called By (username) */}
                    <div style={{
                      flex: 1, minWidth: 140,
                      padding: "10px 16px",
                      borderRight: "1px solid rgba(148,163,184,0.1)"
                    }}>
                      <div style={{
                        fontSize: 10, color: "#64748b", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4
                      }}>
                        Called By
                      </div>
                      <div style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600 }}>
                        👤 {t.callBy || "—"}
                      </div>
                    </div>

                    {/* Contact Person (who was called) */}
                    <div style={{
                      flex: 1, minWidth: 140,
                      padding: "10px 16px",
                      borderRight: t.nextFollowupDate ? "1px solid rgba(148,163,184,0.1)" : "none"
                    }}>
                      <div style={{
                        fontSize: 10, color: "#64748b", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4
                      }}>
                        Contact Person
                      </div>
                      <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>
                        📞 {t.contactPerson || "—"}
                      </div>
                    </div>

                    {/* Next Follow-up Date */}
                    {t.nextFollowupDate && (
                      <div style={{ flex: 1, minWidth: 140, padding: "10px 16px" }}>
                        <div style={{
                          fontSize: 10, color: "#64748b", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4
                        }}>
                          Next Follow-up Date
                        </div>
                        <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>
                          📅 {t.nextFollowupDate}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {callOpen && (
        <CallModal
          customer={customer}
          onClose={() => setCallOpen(false)}
          onSaved={load}
        />
      )}

    </div>
  );

};

export default CustomerCallPage;
