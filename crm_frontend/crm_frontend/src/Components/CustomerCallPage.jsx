import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import CallModal from "./CallModal";

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
  }, [id]);

  if (!customer) return null;

  /* ── Full-page call modal ── */
  if (callOpen) {
    return (
      <CallModal
        customer={customer}
        fullPage
        onClose={() => setCallOpen(false)}
        onSaved={load}
      />
    );
  }

  return (

    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center">
        <div>
          <h3>{customer.customerName}</h3>
          <p>Customer Call History</p>
        </div>

        <button
          className="elite-add-btn"
          onClick={() => setCallOpen(true)}
        >
          📞 Log Call
        </button>
      </div>

      {/* ── 3-column grid ── */}
      <div className="callpage-grid">

        {/* Col 1 – Customer Details */}
        <div className="callpage-col">
          <div className="ds-card">

            <h5>Customer Details</h5>

            <p><b>Customer Name:</b> {customer.customerName}</p>
            <p><b>Branches:</b> {customer.branches || "-"}</p>
            <p><b>Priority:</b> {customer.priority}</p>
            <p><b>Status:</b> {customer.status || "New"}</p>
            <p><b>Reference:</b> {customer.referenceBy || "-"}</p>
            <p><b>Lead Date:</b> {customer.leadGenerationDate}</p>
            <p><b>Address:</b> {customer.address}</p>
            <p><b>State:</b> {customer.state}</p>
            <p><b>District:</b> {customer.district}</p>
            <p><b>Taluka:</b> {customer.taluka}</p>

          </div>
        </div>

        {/* Col 2 – Contact Persons */}
        <div className="callpage-col">
          <div className="ds-card">

            <h5>Contact Persons</h5>

            {customer.contacts?.map((c, i) => (
              <div key={i} className="contact-card mb-3">

                <b>{c.name}</b>

                {c.primaryContact &&
                  <span className="badge bg-success ms-2">Primary</span>
                }

                <p className="mb-1">📞 {c.phone}</p>
                <p className="text-muted">{c.position}</p>

              </div>
            ))}

          </div>
        </div>

        {/* Col 3 – Call Timeline */}
        <div className="callpage-col">
          <div className="ds-card">

            <h5>Call Timeline</h5>

            <div className="ds-timeline">

              {timeline.length === 0 &&
                <p className="text-muted">No calls yet</p>
              }

              {timeline.map(t => (
                <div key={t.id} className="ds-timeline-item">

                  <div className="ds-dot"></div>

                  <div className="ds-timeline-card">

                    <div className="ds-time">
                      {t.interactionDate}
                    </div>

                    <strong>{t.status}</strong>

                    <p>{t.followupDetails}</p>

                    <small className="text-muted">
                      Called by: {t.callBy || "-"}<br />
                      Contact: {t.contactPerson || "-"}
                    </small>

                  </div>

                </div>
              ))}

            </div>

          </div>
        </div>

      </div>

    </div>

  );

};

export default CustomerCallPage;
