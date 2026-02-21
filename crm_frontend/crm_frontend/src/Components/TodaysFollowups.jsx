import { useEffect, useState } from "react";
import api from "./api";
import CallModal from "./CallModal";
import CustomerDrawer from "./CustomerDrawer";
import { CRM_EVENTS } from "./events";

const TodaysFollowups = () => {

  const [list,setList] = useState([]);
  const [selected,setSelected] = useState(null);
  const [viewId,setViewId] = useState(null);
  const [loading,setLoading] = useState(true);

  const load = async () => {
    try{
      setLoading(true);

      const res = await api.get("/interactions/today");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.content || [];

      setList(data);

    }catch{
      setList([]);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{

    load();

    const reload = () => load();

    window.addEventListener(
      CRM_EVENTS.DATA_UPDATED,
      reload
    );

    return ()=> {
      window.removeEventListener(
        CRM_EVENTS.DATA_UPDATED,
        reload
      );
    };

  },[]);

  const statusClass = s =>
    s ? s.replace(/\s+/g,"-") : "";

  return(
    <div className="page-wrap">

      <div className="ds-card mb-3">
        <h3>Today's Followups</h3>
        <p>All followups scheduled for today</p>
      </div>

      <div className="ds-card">

        <table className="table ds-table">

          <thead>
            <tr>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Position</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  Loading followups...
                </td>
              </tr>
            )}

            {!loading && list.length===0 &&(
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No followups today
                </td>
              </tr>
            )}

            {!loading && list.map(i=>(
              <tr key={i.interactionId}>

                <td
                  className="fw-semibold"
                  style={{cursor:"pointer"}}
                  onClick={()=>setViewId(i.customerId)}
                >
                  {i.customerName}
                </td>

                <td>{i.mobileNo}</td>

                <td>{i.position || "-"}</td>

                <td>
                  <span className={`ds-badge ${statusClass(i.status)}`}>
                    {i.status || "New"}
                  </span>
                </td>

                <td>{i.nextFollowupDate}</td>

                <td>
                  <div className="elite-actions">

                    <button
                      className="icon-btn call"
                                        onClick={()=>setSelected({
                        id: i.customerId,
                        customerName: i.customerName,
                        contactName: i.contactName, 
                        contactNo: i.mobileNo
                      })}
                    >
                      <i className="bi bi-telephone"/>
                    </button>

                    <button
                      className="icon-btn primary"
                      onClick={()=>setViewId(i.customerId)}
                    >
                      <i className="bi bi-eye"/>
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {selected && (
        <CallModal
          customer={selected}
          onClose={()=>setSelected(null)}
          onSaved={load}
        />
      )}

      {viewId && (
        <CustomerDrawer
          customerId={viewId}
          onClose={()=>setViewId(null)}
        />
      )}

    </div>
  );
};

export default TodaysFollowups;
