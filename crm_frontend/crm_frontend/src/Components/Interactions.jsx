import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Interactions = () => {

  const [list,setList] = useState([]);
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);

  const load = () => {
    setLoading(true);

    api.get("/interactions")
      .then(res => {
        setList(res.data || []);
      })
      .catch(() => {
        toast.error("Failed to load interactions");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = (id) => {

    Swal.fire({
      title: "Delete interaction?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      background:"#0f172a",
      color:"#fff",
      confirmButtonText: "Delete"
    }).then(result => {

      if (!result.isConfirmed) return;

      api.delete(`/interactions/${id}`)
        .then(() => {
          toast.success("Interaction deleted");
          load();
        })
        .catch(() => {
          toast.error("Delete failed");
        });
    });
  };

  const filtered = useMemo(() => {
    return list.filter(i =>
      i.followupDetails
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [list, search]);

  return (
    <div className="page-wrap">

      <div className="ds-card mb-3 d-flex justify-content-between align-items-center">
        <h3 className="m-0">Interactions</h3>

        <Link
          to="/app/add-interactions"
          className="elite-add-btn"
        >
          + Add Interaction
        </Link>
      </div>

      <div className="ds-card mb-3">
        <input
          className="elite-input"
          placeholder="🔍 Search discussion..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
      </div>

      <div className="ds-card">

        {loading ? (
          <div className="text-center p-4 text-muted">
            Loading interactions...
          </div>
        ) : (

        <table className="table ds-table">

          <thead>
            <tr>
              <th className="col-name">Customer</th>
              <th>Date</th>
              <th>Discussion</th>
              <th>Next Followup</th>
              <th>Status</th>
              <th>Type</th>
              <th className="col-actions"></th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted">
                  No interactions found
                </td>
              </tr>
            ) : (
              filtered.map(i => (

                <tr key={i.id}>

                  <td className="fw-semibold">
                    {i.customer?.customerName || "-"}
                  </td>

                  <td>{i.interactionDate || "-"}</td>

                  <td>{i.followupDetails || "-"}</td>

                  <td>{i.nextFollowupDate || "-"}</td>

                  <td>
                    <span
                      className={`ds-badge ${
                        i.status
                          ? i.status.replace(/\s+/g,'-')
                          : "unknown"
                      }`}
                    >
                      {i.status || "Unknown"}
                    </span>
                  </td>

                  <td>{i.callingType || "-"}</td>

                  <td className="col-actions">
                    <button
                      onClick={() => handleDelete(i.id)}
                      className="icon-btn"
                      style={{
                        background:"rgba(239,68,68,0.2)",
                        color:"#ef4444"
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
        )}

      </div>

    </div>
  );
};

export default Interactions;
