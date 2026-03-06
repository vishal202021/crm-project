import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { getRole } from "./auth";
import CallModal from "./CallModal";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { CRM_EVENTS } from "./events";

const Customers = () => {

  const role     = getRole();
  const navigate = useNavigate();

  const [list,        setList]        = useState([]);
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState("");
  const [selected,    setSelected]    = useState(null);

  const [page,       setPage]       = useState(0);
  const [size]                      = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [direction,  setDirection]  = useState("desc");
  const sortBy = "createdDate";

  const formatDate = (date) => {
    if (!date) return "No calls";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const load = useCallback((p = page, d = direction) => {
    api.get("/customers/summary", {
      params: { page: p, size, sortBy, direction: d }
    }).then(res => {
      setList(res.data.content);
      setTotalPages(res.data.totalPages);
    });
  }, [page, direction, size]);

  useEffect(() => { load(page, direction); }, [page, direction, load]);

  useEffect(() => {
    const reload = () => load(page, direction);
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, reload);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, reload);
  }, [page, direction]);

  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this customer?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280"
    }).then(result => {
      if (result.isConfirmed) {
        api.delete(`/customers/${id}`)
          .then(() => {
            toast.success("Customer deleted");
            const newPage = list.length === 1 && page > 0 ? page - 1 : page;
            setPage(newPage);
            load(newPage, direction);
          })
          .catch(() => toast.error("Delete failed"));
      }
    });
  };

  const filtered = list.filter(c => {
    const matchSearch =
      c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactNo?.includes(search);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3>Customers</h3>
          <p>Main working screen for follow-ups</p>
        </div>
        {role === "ADMIN" && (
          <button
            onClick={() => navigate("/app/add-customers")}
            className="elite-add-btn"
          >
            <i className="bi bi-plus-lg"></i> Add Customer
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="ds-card mb-3 compact">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="elite-input"
              placeholder="Search name or mobile"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="elite-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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
              onChange={e => { setPage(0); setDirection(e.target.value); }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="ds-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Customer Name</th>
                <th style={{ minWidth: 140 }}>Contact Person</th>
                <th style={{ minWidth: 120 }}>Mobile No.</th>
                <th style={{ minWidth: 100 }}>Status</th>
                <th style={{ minWidth: 120 }}>Last Call Date</th>
                {/* ← Single Actions column replacing 3 separate ones */}
                <th style={{ minWidth: 130, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: "40px 16px" }}>
                    No customers found
                  </td>
                </tr>
              )}

              {filtered.map(c => (
                <tr key={c.id}>

                  {/* Customer Name — clickable */}
                  <td
                    className="fw-semibold"
                    style={{ cursor: "pointer", maxWidth: 220, wordBreak: "break-word", whiteSpace: "normal" }}
                    onClick={() => navigate(`/app/customer/${c.id}`)}
                  >
                    {c.customerName}
                  </td>

                  <td>{c.contactName || "-"}</td>

                  <td>{c.contactNo || "-"}</td>

                  <td>
                    {c.status
                      ? <span className={`ds-badge ${c.status.replace(/\s+/g, "-")}`}>{c.status}</span>
                      : <span style={{ color: "#475569", fontSize: 13 }}>New</span>
                    }
                  </td>

                  <td style={{ color: "#94a3b8", fontSize: 13 }}>
                    {formatDate(c.lastCallDate)}
                  </td>

                  {/* ── All 3 actions in one cell ── */}
                  <td>
                    <div className="action-group" style={{ justifyContent: "center", gap: 8 }}>

                      {/* Call */}
                      <button
                        onClick={() => setSelected(c)}
                        className="icon-btn call"
                        title="Log Call"
                      >
                        <i className="bi bi-telephone"></i>
                      </button>

                      {/* View */}
                      <button
                        onClick={() => navigate(`/app/customer/${c.id}`)}
                        className="icon-btn primary"
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i>
                      </button>

                      {/* Delete — only for ADMIN */}
                      {role === "ADMIN" && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="icon-btn danger"
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
        <button
          className="elite-add-btn"
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >
          ← Prev
        </button>
        <span className="fw-semibold" style={{ color: "#94a3b8", fontSize: 14 }}>
          Page {page + 1} of {totalPages}
        </span>
        <button
          className="elite-add-btn"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next →
        </button>
      </div>

      {/* ── Call Modal ── */}
      {selected && (
        <CallModal
          customer={selected}
          onClose={() => setSelected(null)}
          onSaved={() => load(page, direction)}
        />
      )}

    </div>
  );
};

export default Customers;
