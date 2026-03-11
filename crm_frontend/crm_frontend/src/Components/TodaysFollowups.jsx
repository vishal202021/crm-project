import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import CallModal from "./CallModal";
import { CRM_EVENTS } from "./events";

const TodaysFollowups = () => {

  const navigate = useNavigate();

  const [list,     setList]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res  = await api.get("/interactions/today");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.content || [];
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const reload = () => load();
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, reload);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, reload);
  }, []);

  const statusClass = s => s ? s.replace(/\s+/g, "-") : "";

  return (
    <div className="page-wrap">

      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>✅ Today's Followups</h3>
          <p style={{ margin: 0, fontSize: 13 }}>All followups scheduled for today</p>
        </div>
        <span style={{
          fontSize: 13, fontWeight: 700,
          background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 20, padding: "6px 16px"
        }}>
          {list.length} {list.length === 1 ? "followup" : "followups"}
        </span>
      </div>

      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="ds-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Customer</th>
                <th style={{ minWidth: 130 }}>Mobile</th>
                <th style={{ minWidth: 140 }}>Contact Person</th>
                <th style={{ minWidth: 120 }}>Position</th>
                <th style={{ minWidth: 110 }}>Status</th>
                <th style={{ minWidth: 120 }}>Follow-up Date</th>
                <th style={{ minWidth: 120, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "48px 16px", color: "#475569" }}>
                    Loading followups...
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "52px 16px", color: "#334155" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                    No followups today
                  </td>
                </tr>
              )}

              {!loading && list.map(i => (
                <tr key={i.interactionId}>

                  <td
                    className="fw-semibold"
                    style={{ cursor: "pointer", wordBreak: "break-word", whiteSpace: "normal" }}
                    onClick={() => navigate(`/app/customer/${i.customerId}`)}
                  >
                    {i.customerName}
                  </td>

                  <td style={{ color: "#94a3b8", fontSize: 13 }}>
                    {i.mobileNo || "—"}
                  </td>

                  <td style={{ fontSize: 13 }}>
                    {i.contactName || "—"}
                  </td>

                  <td style={{ color: "#a5b4fc", fontSize: 13 }}>
                    {i.position || "—"}
                  </td>

                  <td>
                    <span className={`ds-badge ${statusClass(i.status)}`}>
                      {i.status || "New"}
                    </span>
                  </td>

                  <td style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                    📅 {i.nextFollowupDate}
                  </td>

                  <td>
                    <div className="action-group" style={{ justifyContent: "center", gap: 8 }}>

                      <button
                        className="icon-btn call"
                        title="Log Call"
                        onClick={() => setSelected({
                          id:           i.customerId,
                          customerName: i.customerName,
                          contactName:  i.contactName,
                          contactNo:    i.mobileNo
                        })}
                      >
                        <i className="bi bi-telephone" />
                      </button>

                      <button
                        className="icon-btn primary"
                        title="View Details"
                        onClick={() => navigate(`/app/customer/${i.customerId}`)}
                      >
                        <i className="bi bi-eye" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <CallModal
          customer={selected}
          onClose={() => setSelected(null)}
          onSaved={load}
        />
      )}

    </div>
  );
};

export default TodaysFollowups;
