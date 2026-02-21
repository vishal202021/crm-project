import { useEffect, useState, useCallback } from "react";
import api from "./api";
import { toast } from "react-toastify";

const UserRequests = () => {

  const [users,setUsers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [actionLoading,setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try{
      setLoading(true);

      const res = await api.get("/auth/pending");
      setUsers(res.data);

    }catch{
      toast.error("Failed to load requests");
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{
    load();
  },[load]);

  const approve = async (id) => {

    try{
      setActionLoading(id);

      await api.post(`/auth/approve/${id}`);

      toast.success("User approved");

      setUsers(prev => prev.filter(u => u.id !== id));

    }catch{
      toast.error("Approve failed");
    }finally{
      setActionLoading(null);
    }
  };

  const reject = async (id) => {

    try{
      setActionLoading(id);

      await api.post(`/auth/reject/${id}`);

      toast.info("User rejected");

      setUsers(prev => prev.filter(u => u.id !== id));

    }catch{
      toast.error("Reject failed");
    }finally{
      setActionLoading(null);
    }
  };

  if(loading){
    return (
      <div className="ds-card">
        <h5 className="text-muted">Loading requests...</h5>
      </div>
    );
  }

  return(
    <div className="ds-card">

      <h3>Pending User Requests</h3>

      {users.length===0 ? (

        <p className="text-muted mb-0">
          🎉 No pending approvals
        </p>

      ) : (

        <table className="ds-table user-table">

          <thead>
            <tr>
              <th style={{width:"70%"}}>Email</th>
              <th style={{width:"30%", textAlign:"right"}}>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map(u=>(
              <tr key={u.id}>

                <td>{u.email}</td>

                <td style={{textAlign:"right"}}>
                  <div className="d-inline-flex gap-2">

                    <button
                      disabled={actionLoading===u.id}
                      onClick={()=>approve(u.id)}
                      className="ds-btn ds-btn-primary"
                    >
                      {actionLoading===u.id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      disabled={actionLoading===u.id}
                      onClick={()=>reject(u.id)}
                      className="ds-btn"
                      style={{
                        background:"#ef4444",
                        color:"white"
                      }}
                    >
                      Reject
                    </button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      )}

    </div>
  );
};

export default UserRequests;
