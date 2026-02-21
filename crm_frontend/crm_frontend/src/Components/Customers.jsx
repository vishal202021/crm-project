import { useEffect,useState,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { getRole } from "./auth";
import CallModal from "./CallModal";
import CustomerDrawer from "./CustomerDrawer";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { CRM_EVENTS } from "./events";

const Customers=()=>{

  const role=getRole();
  const navigate=useNavigate();

  const [list,setList]=useState([]);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("");

  const [selected,setSelected]=useState(null);
  const [viewId,setViewId]=useState(null);

  const [page,setPage]=useState(0);
  const [size]=useState(10);
  const [totalPages,setTotalPages]=useState(0);

  const [direction,setDirection]=useState("desc");
  const sortBy="createdDate";


  const load = useCallback((p=page,d=direction)=>{

    api.get("/customers/summary",{
      params:{ page:p,size,sortBy,direction:d }
    })
    .then(res=>{
      setList(res.data.content);
      setTotalPages(res.data.totalPages);
    });

  },[page,direction,size]);

  
  useEffect(()=>{
    load(page,direction);
  },[page,direction,load]);



  useEffect(()=>{

  const reload=()=>load(page,direction);

  window.addEventListener(
    CRM_EVENTS.DATA_UPDATED,
    reload
  );

  return ()=>{
    window.removeEventListener(
      CRM_EVENTS.DATA_UPDATED,
      reload
    );
  };

},[page,direction]);


  const badgeClass=p=>{
    if(p==="High") return "badge-high";
    if(p==="Medium") return "badge-medium";
    if(p==="Low") return "badge-low";
    return "";
  };

  const handleDelete=(id)=>{

    Swal.fire({
      title:"Delete customer?",
      text:"All interactions will also be deleted",
      icon:"warning",
      showCancelButton:true,
      confirmButtonColor:"#ef4444",
      background:"#0f172a",
      color:"#fff",
      cancelButtonColor:"#334155",
      confirmButtonText:"Yes, delete",
      customClass:{ popup:"rounded-4" }
    }).then(result=>{

      if(result.isConfirmed){

        api.delete(`/customers/${id}`)
          .then(()=>{

            toast.success("Customer deleted");

         
            const newPage =
              list.length===1 && page>0 ? page-1 : page;

            setPage(newPage);
            load(newPage,direction);

          })
          .catch(()=>toast.error("Delete failed"));
      }
    });
  };

  const filtered=list.filter(c=>{
    const matchSearch =
      c.customerName?.toLowerCase().includes(search.toLowerCase())
      || c.contactNo?.includes(search);

    const matchStatus =
      !statusFilter || c.status===statusFilter;

    return matchSearch && matchStatus;
  });

  return(
    <div className="page-wrap">

      <div className="ds-card mb-3 d-flex justify-content-between align-items-center">
        <div>
          <h3>Customers</h3>
          <p>Main working screen for follow-ups</p>
        </div>

        {role==="ADMIN"&&(
          <button
            onClick={()=>navigate("/app/add-customers")}
            className="elite-add-btn"
          >
            <i className="bi bi-plus-lg"></i> Add Customer
          </button>
        )}
      </div>

      <div className="ds-card mb-3 compact">
        <div className="row">

          <div className="col-md-4">
            <input
              className="elite-input"
              placeholder="Search name or mobile"
              value={search}
              onChange={e=>setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select
              className="elite-input"
              value={statusFilter}
              onChange={e=>setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option>Interested</option>
              <option>Follow-up</option>
              <option>Connected</option>
              <option>Converted</option>
              <option>Closed</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="elite-input"
              value={direction}
              onChange={e=>{
                const val=e.target.value;
                setPage(0);
                setDirection(val);
              }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

        </div>
      </div>

      <div className="ds-card">
        <div className="table-wrap">

          <table className="table ds-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(c=>(
                <tr key={c.id}>

                  <td
                    className="fw-semibold"
                    style={{cursor:"pointer"}}
                    onClick={()=>setViewId(c.id)}
                  >
                    {c.customerName}
                  </td>

                  <td>{c.contactNo}</td>

                  <td>
                    <span className={`elite-badge ${badgeClass(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>

                  <td>
                    {c.status || <span className="text-muted">New</span>}
                  </td>

                  <td>
                    {c.nextFollowupDate ||
                      <span className="text-muted">Not scheduled</span>}
                  </td>

                  <td>
                    <div className="elite-actions">

                      <button
                        onClick={()=>setSelected(c)}
                        className="icon-btn call"
                      >
                        <i className="bi bi-telephone"></i>
                      </button>

                      {role==="ADMIN"&&(
                        <>
                          <button
                            onClick={()=>navigate(`/app/edit-customer/${c.id}`)}
                            className="icon-btn edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          <button
                            onClick={()=>handleDelete(c.id)}
                            className="icon-btn danger"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
                      )}

                      <button
                        onClick={()=>setViewId(c.id)}
                        className="icon-btn primary"
                      >
                        <i className="bi bi-eye"></i>
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      <div className="d-flex justify-content-center gap-2 mt-3">

        <button
          className="elite-add-btn"
          disabled={page===0}
          onClick={()=>setPage(p=>p-1)}
        >
          Prev
        </button>

        <span className="fw-semibold">
          Page {page+1} of {totalPages}
        </span>

        <button
          className="elite-add-btn"
          disabled={page+1>=totalPages}
          onClick={()=>setPage(p=>p+1)}
        >
          Next
        </button>

      </div>

      {selected&&(
        <CallModal
          customer={selected}
          onClose={()=>setSelected(null)}
          onSaved={()=>load(page,direction)}
        />
      )}

      {viewId&&(
        <CustomerDrawer
          customerId={viewId}
          onClose={()=>setViewId(null)}
        />
      )}

    </div>
  );
};

export default Customers;
