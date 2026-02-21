import { useEffect, useState } from "react";
import api from "./api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const MasterAdmin = () => {

  const [users,setUsers] = useState([]);
  const [loading,setLoading] = useState(true);

  const load = () => {
    setLoading(true);

    api.get("/auth/users")
      .then(res=>{
        setUsers(res.data || []);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(load,[]);


  const approve = id => {
    api.post(`/auth/approve/${id}`)
      .then(()=>{
        toast.success("User approved");
        load();
      })
      .catch(()=>toast.error("Approve failed"));
  };

  const reject = id => {
    api.post(`/auth/reject/${id}`)
      .then(()=>{
        toast.info("User rejected");
        load();
      })
      .catch(()=>toast.error("Reject failed"));
  };

  const toggle = id => {
    api.post(`/auth/toggle/${id}`)
      .then(()=>{
        toast.success("Status updated");
        load();
      })
      .catch(()=>{
        toast.error("Toggle failed");
      });
  };

  const changeRole = (id,currentRole) => {
    const newRole =
      currentRole === "ADMIN" ? "USER" : "ADMIN";

    api.post(`/auth/role/${id}`,{ role:newRole })
      .then(()=>{
        toast.success("Role updated");
        load();
      })
      .catch(()=>toast.error("Role change failed"));
  };

  const deleteUser = (id,email) => {

    Swal.fire({
      title: "Delete user?",
      html: `<small>${email}</small>`,
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      background:"#0f172a",
      color:"#fff",
      customClass:{ popup:"rounded-4" }
    }).then(result=>{

      if(result.isConfirmed){
        api.delete(`/auth/${id}`)
          .then(()=>{
            toast.error("User deleted");
            load();
          })
          .catch(()=>toast.error("Delete failed"));
      }

    });
  };

 

  const badge = status => {
    if(status==="PENDING") return "badge-medium";
    if(status==="ACTIVE") return "badge-low";
    if(status==="INACTIVE") return "badge-high";
    if(status==="REJECTED") return "badge-high";
    return "";
  };

 

  if(loading){
    return (
      <div className="ds-card">
        <h3>Loading users...</h3>
      </div>
    );
  }

  return (
    <div className="page-wrap">

      <div className="ds-card mb-3">
        <h3>👑 Master Admin Panel</h3>
        <p>Manage users, roles and access</p>
      </div>

      <div className="ds-card">

        <table className="ds-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{textAlign:"right"}}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map(u=>(
              <tr key={u.id}>

                <td>{u.email}</td>

                <td>
                  <span className="elite-badge">
                    {u.role}
                  </span>
                </td>

                <td>
                  <span className={`elite-badge ${badge(u.status)}`}>
                    {u.status}
                  </span>
                </td>

                <td style={{textAlign:"right"}}>
                  <div className="d-inline-flex gap-2">

                    {u.status==="PENDING" ? (
                      <>
                        <button
                          onClick={()=>approve(u.id)}
                          className="ds-btn ds-btn-primary"
                        >
                          Approve
                        </button>

                        <button
                          onClick={()=>reject(u.id)}
                          className="ds-btn"
                          style={{background:"#ef4444",color:"white"}}
                        >
                          Reject
                        </button>
                      </>
                    )
                    : (u.status==="ACTIVE" || u.status==="INACTIVE") ? (
                      <button
                        onClick={()=>toggle(u.id)}
                        className="ds-btn"
                        style={{
                          background:
                            u.status==="ACTIVE"
                              ? "#ef4444"
                              : "#10b981",
                          color:"white"
                        }}
                      >
                        {u.status==="ACTIVE"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    ) : null}

                    <button
                      onClick={()=>changeRole(u.id,u.role)}
                      className="ds-btn"
                      style={{background:"#6366f1",color:"white"}}
                    >
                      Change Role
                    </button>

                    <button
                      onClick={()=>deleteUser(u.id,u.email)}
                      className="ds-btn"
                      style={{background:"#ef4444",color:"white"}}
                    >
                      Delete
                    </button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
};

export default MasterAdmin;
