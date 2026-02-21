import { useEffect, useState, useCallback } from "react";
import api from "./api";
import { getRole } from "./auth";
import { useNavigate } from "react-router-dom";
import CallModal from "./CallModal";
import { CRM_EVENTS } from "./events";


const CustomerDrawer = ({ customerId, onClose }) => {

  const navigate = useNavigate();
  const role = getRole();

  const [customer,setCustomer] = useState(null);
  const [timeline,setTimeline] = useState([]);
  const [callOpen,setCallOpen] = useState(false);

  
  const loadData = useCallback(() => {

    api.get("/customers/" + customerId)
      .then(res => setCustomer(res.data));

    api.get("/interactions/timeline/" + customerId)
      .then(res => {

        if(Array.isArray(res.data)){
          setTimeline(res.data);
        }
        else if(Array.isArray(res.data.content)){
          setTimeline(res.data.content);
        }
        else{
          setTimeline([]);
        }

      });

  }, [customerId]);



useEffect(() => {

  // initial load
  loadData();

  const reload = () => {
    api.get("/interactions/timeline/" + customerId)
      .then(res => {

        if (Array.isArray(res.data)) {
          setTimeline(res.data);
        } else if (Array.isArray(res.data.content)) {
          setTimeline(res.data.content);
        } else {
          setTimeline([]);
        }

      });
  };

  window.addEventListener(
    CRM_EVENTS.DATA_UPDATED,
    reload
  );

  return () =>
    window.removeEventListener(
      CRM_EVENTS.DATA_UPDATED,
      reload
    );

}, [customerId, loadData]);



  if(!customer) return null;

  const badgeClass = p => {
    if(p==="High") return "badge-high";
    if(p==="Medium") return "badge-medium";
    if(p==="Low") return "badge-low";
    return "";
  };

  return (
    <div className="elite-drawer-bg">

      <div className="elite-drawer">

        <div className="elite-drawer-header">
          <div>
            <h4 className="mb-1">{customer.customerName}</h4>
            <small className="text-muted">{customer.contactNo}</small>
          </div>

          <button className="elite-close" onClick={onClose}>✕</button>
        </div>

        <div className="glass p-2 mb-2 compact-info">

          <div className="d-flex justify-content-between mb-2">
            <span className={`elite-badge ${badgeClass(customer.priority)}`}>
              {customer.priority}
            </span>

            <span className="text-muted">
              {customer.taluka || "-"}
            </span>
          </div>

          <hr/>

          <p><b>Contact:</b> {customer.contactName}</p>
          <p><b>Position:</b> {customer.position || "-"}</p>
          <p><b>Address:</b> {customer.address || "-"}</p>

        </div>

        <div className="d-flex gap-2 mb-4">

          <button
            className="elite-btn-primary"
            onClick={()=>setCallOpen(true)}
          >
            📞 Call
          </button>

          {role==="ADMIN" && (
            <button
              className="elite-btn-outline"
              onClick={()=>navigate(`/app/edit-customer/${customer.id}`)}
            >
              ✏️ Edit
            </button>
          )}

        </div>

        <h6 className="fw-bold mb-3">Timeline</h6>

        <div className="ds-timeline">

          {timeline.length===0 && (
            <p className="text-muted">No interactions yet</p>
          )}

          {timeline.map(i => (
            <div key={i.id} className="ds-timeline-item">

              <div className="ds-dot"/>

              <div className="ds-timeline-card">
                <div className="ds-time">{i.interactionDate}</div>
                <strong>{i.status}</strong>
                <p>{i.followupDetails || "No notes"}</p>
              </div>

            </div>
          ))}

        </div>

      </div>

      {callOpen && (
        <CallModal
          customer={customer}
          onClose={()=>setCallOpen(false)}
          onSaved={loadData}
        />
      )}

    </div>
  );
};

export default CustomerDrawer;
