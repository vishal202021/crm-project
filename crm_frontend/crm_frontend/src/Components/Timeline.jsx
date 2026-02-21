import { useState } from "react";
import api from "./api";
import { toast } from "react-toastify";

const Timeline = () => {

  const [list,setList] = useState([]);
  const [customerId,setCustomerId] = useState("");
  const [loading,setLoading] = useState(false);

  const load = async () => {

    if(!customerId.trim()){
      toast.error("Enter Customer ID");
      return;
    }

    try{
      setLoading(true);

      const res = await api.get(
        "/interactions/timeline/" + customerId
      );

      setList(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    }catch{
      toast.error("Failed to load timeline");
      setList([]);
    }finally{
      setLoading(false);
    }
  };

  return(
    <div className="page-wrap">

      <div className="ds-card timeline-wrap">

        <h4 className="ds-title mb-4">
          🕒 Customer Timeline
        </h4>

   
        <div className="d-flex gap-2 mb-4">

          <input
            className="elite-input"
            placeholder="Enter Customer ID"
            value={customerId}
            onChange={e=>setCustomerId(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Enter") load();
            }}
          />

          <button
            onClick={load}
            disabled={loading}
            className="elite-btn-primary"
          >
            {loading ? "Loading..." : "Load Timeline"}
          </button>

        </div>

  
        {!loading && list.length===0 && (
          <p className="text-muted">
            No interactions found
          </p>
        )}

    
        {list.length>0 && (
          <div className="ds-timeline">

            {list.map(i=>(
              <div
                className="ds-timeline-item"
                key={i.id}
              >

                <div className="ds-dot"></div>

                <div className="ds-timeline-card">

                  <div className="ds-time">
                    📅 {i.interactionDate}
                  </div>

                  <strong>
                    {i.status || "Unknown"}
                  </strong>

                  <p className="mb-1">
                    {i.followupDetails || "No notes"}
                  </p>

                  <small className="text-muted">
                    {i.callingType || "-"}
                    {" • "}
                    Next: {i.nextFollowupDate || "N/A"}
                  </small>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
};

export default Timeline;
