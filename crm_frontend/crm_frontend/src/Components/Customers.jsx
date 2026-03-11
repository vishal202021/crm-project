import { useEffect, useState, useCallback, useRef } from "react";
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
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
};

/* ─────────────────────────────────────────────── */

const Customers = () => {

  const role     = getRole();
  const navigate = useNavigate();

  const [list,           setList]           = useState([]);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [selected,       setSelected]       = useState(null);
  const [exporting,      setExporting]      = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportDateFrom,  setExportDateFrom]  = useState("");
  const [exportDateTo,    setExportDateTo]    = useState("");
  const [exportStatus,    setExportStatus]    = useState("");
  const [panelPos,        setPanelPos]        = useState({ top: 0, right: 0 });

  const panelRef  = useRef(null);
  const buttonRef = useRef(null);

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

  /* Close panel on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setShowExportPanel(false);
      }
    };
    if (showExportPanel) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportPanel]);

  const togglePanel = () => {
    if (exporting) return;
    if (!showExportPanel && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({
        top:   rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
    setShowExportPanel(v => !v);
  };

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
            setPage(newPage); load(newPage, direction);
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

  const applyPreset = (preset) => {
    const today = new Date();
    const fmt   = d => d.toISOString().split("T")[0];
    if (preset === "today") {
      setExportDateFrom(fmt(today)); setExportDateTo(fmt(today));
    } else if (preset === "week") {
      const mon = new Date(today);
      mon.setDate(today.getDate() - today.getDay() + 1);
      setExportDateFrom(fmt(mon)); setExportDateTo(fmt(today));
    } else if (preset === "month") {
      setExportDateFrom(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
      setExportDateTo(fmt(today));
    } else if (preset === "last30") {
      const d = new Date(today); d.setDate(d.getDate() - 30);
      setExportDateFrom(fmt(d)); setExportDateTo(fmt(today));
    } else if (preset === "clear") {
      setExportDateFrom(""); setExportDateTo("");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setShowExportPanel(false);
      setExportProgress("Fetching customer list...");

      const fromDate = exportDateFrom ? new Date(exportDateFrom)             : null;
      const toDate   = exportDateTo   ? new Date(exportDateTo + "T23:59:59") : null;

      if (fromDate && toDate && fromDate > toDate) {
        toast.error("From date cannot be after To date");
        return;
      }

      const summaryRows = [];
      let p = 0, totalP = 1;

      while (p < totalP) {
        const res = await api.get("/customers/summary", {
          params: { page: p, size: 200, sortBy, direction }
        });
        totalP = res.data.totalPages || 1;

        (res.data.content || []).forEach(c => {
          const matchStatus = !exportStatus || c.status === exportStatus;
          const matchSearch =
            !search ||
            c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
            c.contactNo?.includes(search);

          let matchDate = true;
          if (fromDate || toDate) {
            const created = c.createdDate ? new Date(c.createdDate) : null;
            if (created) {
              if (fromDate && created < fromDate) matchDate = false;
              if (toDate   && created > toDate)   matchDate = false;
            } else {
              matchDate = false;
            }
          }

          if (matchStatus && matchSearch && matchDate) summaryRows.push(c);
        });

        p++;
      }

      if (summaryRows.length === 0) {
        toast.warning("No customers found for selected filters");
        return;
      }

      const BATCH    = 10;
      const fullData = [];

      for (let i = 0; i < summaryRows.length; i += BATCH) {
        const batch = summaryRows.slice(i, i + BATCH);
        setExportProgress(
          `Loading details... ${Math.min(i + BATCH, summaryRows.length)} / ${summaryRows.length}`
        );
        const results = await Promise.allSettled(
          batch.map(s => api.get("/customers/" + s.id))
        );
        results.forEach((res, idx) =>
          fullData.push(res.status === "fulfilled" ? res.value.data : batch[idx])
        );
      }

      setExportProgress("Building Excel file...");

      const exportData = fullData.map((c, idx) => {
        const primary = c.contacts?.find(ct => ct.primaryContact) || c.contacts?.[0];
        return {
          "Sr. No.":        idx + 1,
          "Customer Name":  c.customerName            || "",
          "Contact Person": primary?.name             || c.contactName || "",
          "Mobile No.":     primary?.phone            || c.contactNo   || "",
          "Position":       primary?.position         || "",
          "Status":         c.status                  || "New",
          "Last Call Date": c.lastCallDate ? formatDate(c.lastCallDate) : "No calls",
          "Priority":       c.priority                || "",
          "Branches":       c.branches                || "",
          "Reference By":   c.referenceBy             || "",
          "Lead Date":      c.leadGenerationDate       || "",
          "Address":        c.address                 || "",
          "State":          c.state                   || "",
          "District":       c.district                || "",
          "Taluka":         c.taluka                  || "",
          "Pin Code":       c.pinCode                 || "",
        };
      });

      const today  = new Date().toISOString().split("T")[0];
      const sPart  = exportStatus ? `_${exportStatus.replace(/\s+/g, "-")}` : "_All";
      const dPart  = exportDateFrom && exportDateTo
        ? `_${exportDateFrom}_to_${exportDateTo}`
        : exportDateFrom ? `_from_${exportDateFrom}`
        : exportDateTo   ? `_till_${exportDateTo}`
        : "";
      exportToExcel(exportData, `Customers${sPart}${dPart}_${today}.xls`);
      toast.success(`✅ Exported ${exportData.length} customers`);

    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
      setExportProgress("");
    }
  };

  const exportFilterCount =
    (exportStatus ? 1 : 0) + (exportDateFrom ? 1 : 0) + (exportDateTo ? 1 : 0);

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 12 }}>
        <div>
          <h3>Customers</h3>
          <p>Main working screen for follow-ups</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

          {/* Export Button */}
          <button
            ref={buttonRef}
            onClick={togglePanel}
            disabled={exporting}
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
              whiteSpace: "nowrap", minWidth: 170,
            }}
          >
            <span style={{ fontSize: 16 }}>📊</span>
            <span>{exporting ? (exportProgress || "Exporting...") : "Export to Excel"}</span>
            {exportFilterCount > 0 && !exporting && (
              <span style={{
                background: "rgba(255,255,255,0.3)", borderRadius: "50%",
                width: 20, height: 20, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800
              }}>
                {exportFilterCount}
              </span>
            )}
            {!exporting && (
              <span style={{ fontSize: 10, opacity: 0.7 }}>{showExportPanel ? "▲" : "▼"}</span>
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

      {/* ── Export Filter Panel (fixed portal-style) ── */}
      {showExportPanel && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top:   panelPos.top,
            right: panelPos.right,
            zIndex: 99999,
            background: "rgba(13,17,28,0.98)",
            border: "1px solid rgba(148,163,184,0.15)",
            borderRadius: 18,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            padding: "22px 24px",
            width: 350,
            backdropFilter: "blur(20px)",
          }}
        >
          {/* top accent */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            borderRadius: "18px 18px 0 0",
            background: "linear-gradient(90deg,transparent,#10b981,#059669,transparent)"
          }} />

          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>
            📊 Export Options
          </div>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 10, fontWeight: 700, color: "#64748b",
              textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 7
            }}>
              Filter by Status
            </label>
            <select
              className="elite-input w-100"
              value={exportStatus}
              onChange={e => setExportStatus(e.target.value)}
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

          {/* Date range */}
          <div style={{ marginBottom: 12 }}>
            <label style={{
              display: "block", fontSize: 10, fontWeight: 700, color: "#64748b",
              textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 7
            }}>
              Filter by Date Added
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 5 }}>From</div>
                <input
                  type="date"
                  className="elite-input"
                  value={exportDateFrom}
                  onChange={e => setExportDateFrom(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 5 }}>To</div>
                <input
                  type="date"
                  className="elite-input"
                  value={exportDateTo}
                  min={exportDateFrom || undefined}
                  onChange={e => setExportDateTo(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 8, fontWeight: 600 }}>
              QUICK SELECT
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { key: "today",  label: "Today"      },
                { key: "week",   label: "This Week"  },
                { key: "month",  label: "This Month" },
                { key: "last30", label: "Last 30d"   },
                { key: "clear",  label: "✕ Clear"    },
              ].map(pr => (
                <button
                  key={pr.key}
                  onClick={() => applyPreset(pr.key)}
                  style={{
                    padding: "5px 12px", borderRadius: 8, border: "none",
                    background: pr.key === "clear"
                      ? "rgba(239,68,68,0.12)" : "rgba(99,102,241,0.15)",
                    color: pr.key === "clear" ? "#ef4444" : "#a5b4fc",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter preview */}
          {(exportStatus || exportDateFrom || exportDateTo) && (
            <div style={{
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 12, color: "#10b981",
              marginBottom: 16, lineHeight: 1.7
            }}>
              {exportStatus   && <div>📌 Status: <b>{exportStatus}</b></div>}
              {exportDateFrom && <div>📅 From: <b>{exportDateFrom}</b></div>}
              {exportDateTo   && <div>📅 To: <b>{exportDateTo}</b></div>}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#10b981,#059669)",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
              }}
            >
              📥 Download Excel
            </button>
            <button
              onClick={() => setShowExportPanel(false)}
              style={{
                padding: "12px 16px", borderRadius: 10, border: "none",
                background: "rgba(148,163,184,0.1)", color: "#94a3b8",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Table Filters ── */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Active filters:</span>
          {statusFilter && (
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600
            }}>
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("")} style={{ background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", padding: 0, fontSize: 13 }}>✕</button>
            </span>
          )}
          {search && (
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(245,158,11,0.12)", color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600
            }}>
              Search: "{search}"
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", padding: 0, fontSize: 13 }}>✕</button>
            </span>
          )}
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
                  <td style={{ color: "#94a3b8", fontSize: 13 }}>{formatDate(c.lastCallDate)}</td>
                  <td>
                    <div className="action-group" style={{ justifyContent: "center", gap: 8 }}>
                      <button onClick={() => setSelected(c)} className="icon-btn call" title="Log Call">
                        <i className="bi bi-telephone"></i>
                      </button>
                      <button onClick={() => navigate(`/app/customer/${c.id}`)} className="icon-btn primary" title="View">
                        <i className="bi bi-eye"></i>
                      </button>
                      {role === "ADMIN" && (
                        <button onClick={() => handleDelete(c.id)} className="icon-btn danger" title="Delete">
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
        <button className="elite-add-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="fw-semibold" style={{ color: "#94a3b8", fontSize: 14 }}>Page {page + 1} of {totalPages}</span>
        <button className="elite-add-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
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
