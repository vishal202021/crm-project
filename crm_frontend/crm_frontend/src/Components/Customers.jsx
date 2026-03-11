import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { getRole } from "./auth";
import CallModal from "./CallModal";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { CRM_EVENTS } from "./events";

const exportToExcel = (rows, fileName) => {
  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headers = Object.keys(rows[0]);

  const headerRow = headers
    .map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${esc(h)}</Data></Cell>`)
    .join("");

  const dataRows = rows.map(row =>
    "<Row>" +
    headers.map(h => {
      const val  = row[h];
      const type = typeof val === "number" ? "Number" : "String";
      return `<Cell><Data ss:Type="${type}">${esc(val)}</Data></Cell>`;
    }).join("") +
    "</Row>"
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Customers">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};


const Customers = () => {

  const role     = getRole();
  const navigate = useNavigate();

  const [list,         setList]         = useState([]);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected,     setSelected]     = useState(null);
  const [exporting,    setExporting]    = useState(false);
  const [exportProgress, setExportProgress] = useState("");

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

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportProgress("Fetching customer list...");

      const summaryRows = [];
      let p = 0, totalP = 1;

      while (p < totalP) {
        const res = await api.get("/customers/summary", {
          params: { page: p, size: 200, sortBy, direction }
        });
        totalP = res.data.totalPages || 1;

        const filtered = (res.data.content || []).filter(c => {
          const matchSearch =
            c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
            c.contactNo?.includes(search);
          const matchStatus = !statusFilter || c.status === statusFilter;
          return matchSearch && matchStatus;
        });

        summaryRows.push(...filtered);
        p++;
      }

      if (summaryRows.length === 0) {
        toast.warning("No data to export with current filters");
        return;
      }

      const BATCH = 10;
      const fullData = [];

      for (let i = 0; i < summaryRows.length; i += BATCH) {
        const batch = summaryRows.slice(i, i + BATCH);
        setExportProgress(
          `Loading details... ${Math.min(i + BATCH, summaryRows.length)} / ${summaryRows.length}`
        );

        const results = await Promise.allSettled(
          batch.map(s => api.get("/customers/" + s.id))
        );

        results.forEach((res, idx) => {
          if (res.status === "fulfilled") {
            fullData.push(res.value.data);
          } else {
            fullData.push(batch[idx]);
          }
        });
      }

      setExportProgress("Building Excel file...");

      const exportData = fullData.map((c, idx) => {
        const primary = c.contacts?.find(ct => ct.primaryContact) || c.contacts?.[0];

        return {
          "Sr. No.":         idx + 1,
          "Customer Name":   c.customerName           || "",
          "Contact Person":  primary?.name            || c.contactName  || "",
          "Mobile No.":      primary?.phone           || c.contactNo    || "",
          "Position":        primary?.position        || "",
          "Status":          c.status                 || "New",
          "Last Call Date":  c.lastCallDate ? formatDate(c.lastCallDate) : "No calls",
          "Priority":        c.priority               || "",
          "Branches":        c.branches               || "",
          "Reference By":    c.referenceBy            || "",
          "Lead Date":       c.leadGenerationDate      || "",
          "Address":         c.address                || "",
          "State":           c.state                  || "",
          "District":        c.district               || "",
          "Taluka":          c.taluka                 || "",
          "Pin Code":        c.pinCode                || "",
        };
      });

      const datePart   = new Date().toISOString().split("T")[0];
      const statusPart = statusFilter
        ? `_${statusFilter.replace(/\s+/g, "-")}`
        : "_All";
      const fileName = `Customers${statusPart}_${datePart}.xls`;

      exportToExcel(exportData, fileName);
      toast.success(`✅ Exported ${exportData.length} customers`);

    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
      setExportProgress("");
    }
  };

  const filterLabel = statusFilter || (search ? `"${search}"` : "All");

  return (
    <div className="page-wrap">

      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3>Customers</h3>
          <p>Main working screen for follow-ups</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

          <button
            onClick={handleExport}
            disabled={exporting}
            title={`Export ${filterLabel} customers to Excel`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: exporting
                ? "rgba(16,185,129,0.15)"
                : "linear-gradient(135deg,#10b981,#059669)",
              color: exporting ? "#10b981" : "#fff",
              fontWeight: 700, fontSize: 13,
              cursor: exporting ? "not-allowed" : "pointer",
              boxShadow: exporting ? "none" : "0 6px 20px rgba(16,185,129,0.35)",
              transition: "all 0.25s",
              opacity: exporting ? 0.8 : 1,
              whiteSpace: "nowrap",
              minWidth: 160,
            }}
          >
            <span style={{ fontSize: 16 }}>📊</span>
            <span>
              {exporting
                ? (exportProgress || "Exporting...")
                : "Export to Excel"
              }
            </span>
            {(statusFilter || search) && !exporting && (
              <span style={{
                background: "rgba(255,255,255,0.25)",
                borderRadius: 8, padding: "2px 8px",
                fontSize: 11, fontWeight: 600
              }}>
                {filterLabel}
              </span>
            )}
          </button>

          {role === "ADMIN" && (
            <button
              onClick={() => navigate("/app/add-customers")}
              className="elite-add-btn"
            >
              <i className="bi bi-plus-lg"></i> Add Customer
            </button>
          )}
        </div>
      </div>

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
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Status</option>
              <option>Interested</option>
              <option>Follow-up</option>
              <option>Connected</option>
              <option>Converted</option>
              <option>Not Interested</option>
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

      {/* ── Active filter chips ── */}
      {(statusFilter || search) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 12, flexWrap: "wrap"
        }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Active filters:</span>

          {statusFilter && (
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 12, fontWeight: 600
            }}>
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("")} style={{
                background: "none", border: "none", color: "#a5b4fc",
                cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1
              }}>✕</button>
            </span>
          )}

          {search && (
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(245,158,11,0.12)", color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 12, fontWeight: 600
            }}>
              Search: "{search}"
              <button onClick={() => setSearch("")} style={{
                background: "none", border: "none", color: "#f59e0b",
                cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1
              }}>✕</button>
            </span>
          )}

          <span style={{ fontSize: 12, color: "#475569" }}>
            — Export will include only these results
          </span>
        </div>
      )}

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
                <th style={{ minWidth: 130, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px 16px", color: "#334155" }}>
                    No customers found
                  </td>
                </tr>
              )}
              {filtered.map(c => (
                <tr key={c.id}>
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
                  <td>
                    <div className="action-group" style={{ justifyContent: "center", gap: 8 }}>
                      <button
                        onClick={() => setSelected(c)}
                        className="icon-btn call"
                        title="Log Call"
                      >
                        <i className="bi bi-telephone"></i>
                      </button>
                      <button
                        onClick={() => navigate(`/app/customer/${c.id}`)}
                        className="icon-btn primary"
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
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
