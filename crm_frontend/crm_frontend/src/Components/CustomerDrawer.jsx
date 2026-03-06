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

       <div className="glass p-3 mb-3">

        <h6 className="mb-3 fw-bold">Customer Details</h6>

        <div className="row">

        <div className="col-6">
        <p><b>Customer Name:</b> {customer.customerName}</p>
        </div>

        <div className="col-6">
        <p>
        <b>Priority:</b>
        <span className={`elite-badge ms-2 ${badgeClass(customer.priority)}`}>
        {customer.priority}
        </span>
        </p>
        </div>

        <div className="col-6">
        <p><b>Branches:</b> {customer.branches || "-"}</p>
        </div>

        <div className="col-6">
        <p><b>Lead Date:</b> {customer.leadGenerationDate || "-"}</p>
        </div>

        <div className="col-6">
        <p><b>Reference By:</b> {customer.referenceBy || "-"}</p>
        </div>

        <div className="col-6">
        <p><b>Status:</b> {customer.status || "New"}</p>
        </div>

        <div className="col-6">
        <p><b>Pin Code:</b> {customer.pinCode || "-"}</p>
        </div>

        <div className="col-6">
        <p><b>State:</b> {customer.state || "-"}</p>
        </div>

        <div className="col-6">
        <p><b>District:</b> {customer.district || "-"}</p>
        </div>

        <div className="col-6">
        <p><b>Taluka:</b> {customer.taluka || "-"}</p>
        </div>

        <div className="col-12">
        <p><b>Address:</b> {customer.address || "-"}</p>
        </div>

        </div>

        <hr/>

        <h6 className="fw-bold mt-3">Contact Persons</h6>

        {customer.contacts?.length === 0 && (
        <p className="text-muted">No contacts</p>
        )}

        {customer.contacts?.map((ct,i)=>(
        <div key={i} className="contact-card mb-2">

        <p className="mb-1">
        <b>{ct.name}</b>
        {ct.primaryContact && (
        <span className="badge bg-success ms-2">Primary</span>
        )}
        </p>

        <p className="text-muted mb-0">
        📞 {ct.phone}
        </p>

        <p className="text-muted mb-0">
        💼 {ct.position || "-"}
        </p>

        </div>
        ))}

        </div>

        <div className="d-flex gap-2 mb-4">

          <button
            className="elite-btn-primary"
            onClick={()=>setCallOpen(true)}
          >
            📞 Call
          </button>

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
