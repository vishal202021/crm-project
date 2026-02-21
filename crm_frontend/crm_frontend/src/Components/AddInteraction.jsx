import { useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddInteraction = () => {

  const navigate = useNavigate();
  const [saving,setSaving] = useState(false);

  const [i,setI] = useState({
    customerId:"",
    interactionDate:"",
    followupDetails:"",
    nextFollowupDate:"",
    status:"",
    callBy:"",
    visitedBy:"",
    callingType:""
  });

  const handleChange = e =>
    setI({...i,[e.target.name]:e.target.value});

  const validate = () => {

    if(!i.customerId){
      toast.error("Customer ID required");
      return false;
    }

    if(Number(i.customerId) <= 0){
      toast.error("Invalid customer ID");
      return false;
    }

    if(!i.status){
      toast.error("Select status");
      return false;
    }

    if(i.nextFollowupDate && i.interactionDate){
      if(i.nextFollowupDate < i.interactionDate){
        toast.error("Follow-up date cannot be before interaction date");
        return false;
      }
    }

    return true;
  };

  const save = async () => {

    if(!validate()) return;

    try{

      setSaving(true);

      await api.post("/interactions",{
        ...i,
        customerId:Number(i.customerId),
        followupDetails: i.followupDetails?.trim() || null,
        callBy: i.callBy?.trim() || null,
        visitedBy: i.visitedBy?.trim() || null,
        callingType: i.callingType || null,
        nextFollowupDate: i.nextFollowupDate || null,
        interactionDate: i.interactionDate || null
      });

      toast.success("✅ Interaction saved!");

      setTimeout(()=>{
        navigate("/app/interactions");
      },1200);

    }catch(err){

      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error saving interaction";

      toast.error(msg);

    }finally{
      setSaving(false);
    }
  };

  return(
    <div className="edit-wrap">

      <div className="elite-form-card" style={{width:"760px"}}>

        <h4>Add Interaction</h4>
        <p className="sub">Log customer communication</p>

        <div className="row g-4">

          <div className="col-md-6">

            <label>Customer ID *</label>
            <input
              name="customerId"
              type="number"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.customerId}
            />

            <label>Interaction Date</label>
            <input
              name="interactionDate"
              type="date"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.interactionDate}
            />

            <label>Discussion</label>
            <textarea
              name="followupDetails"
              rows="3"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.followupDetails}
            />

            <label>Next Followup</label>
            <input
              name="nextFollowupDate"
              type="date"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.nextFollowupDate}
            />

          </div>

          <div className="col-md-6">

            <label>Status *</label>
            <select
              name="status"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.status}
            >
              <option value="">Select Status</option>
              <option>Interested</option>
              <option>Not Interested</option>
              <option>Follow-up</option>
              <option>Closed</option>
            </select>

            <label>Call By</label>
            <input
              name="callBy"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.callBy}
            />

            <label>Visited By</label>
            <input
              name="visitedBy"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.visitedBy}
            />

            <label>Calling Type</label>
            <select
              name="callingType"
              className="elite-input w-100"
              onChange={handleChange}
              value={i.callingType}
            >
              <option value="">Calling Type</option>
              <option>Call</option>
              <option>Visit</option>
              <option>Email</option>
            </select>

          </div>

        </div>

        <div className="elite-form-actions mt-4">

          <button
            onClick={save}
            disabled={saving}
            className="elite-btn-primary"
          >
            {saving ? "Saving..." : "Save Interaction"}
          </button>

          <button
            onClick={()=>navigate("/app/interactions")}
            className="elite-btn-outline"
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  );
};

export default AddInteraction;
