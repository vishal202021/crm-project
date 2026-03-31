import { useEffect, useState, useCallback } from "react";
import api from "./api";
import { getRole, getUsername } from "./auth";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { CRM_EVENTS, emitCRMUpdate } from "./events";

const STATUS_FLOW = ["Pending", "In Progress", "Completed"];

const statusStyle = (s) => {
  if (s === "Pending")     return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)"  };
  if (s === "In Progress") return { color: "#6366f1", bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.3)"  };
  if (s === "Completed")   return { color: "#10b981", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)"  };
  return                          { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)" };
};

const Tasks = () => {

  const role     = getRole();
  const username = getUsername();
  const isAdmin  = role === "ADMIN";

  const [tasks,    setTasks]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState("All");

  const [form, setForm] = useState({
    title: "", description: "", dueDate: "",
    priority: "Medium", assignedToUserId: "",
  });

  /* Load tasks */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await api.get("/tasks");
      const all  = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setTasks(all);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Load users (admin only) */
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/auth/users")
      .then(res => setUsers(Array.isArray(res.data) ? res.data : res.data?.content || []))
      .catch(() => setUsers([]));
  }, [isAdmin]);

  useEffect(() => {
    load();
    window.addEventListener(CRM_EVENTS.DATA_UPDATED, load);
    return () => window.removeEventListener(CRM_EVENTS.DATA_UPDATED, load);
  }, [load]);

  /* Status change — assigned user or admin */
  const changeStatus = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      toast.success(`Status → ${newStatus}`);
      emitCRMUpdate();
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* Delete */
  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete task?", icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#334155",
      background: "#0f172a", color: "#fff",
      confirmButtonText: "Delete",
    }).then(r => {
      if (!r.isConfirmed) return;
      api.delete(`/tasks/${id}`)
        .then(() => { toast.success("Task deleted"); load(); })
        .catch(() => toast.error("Delete failed"));
    });
  };

  /* Save new task */
  const saveTask = async () => {
    if (!form.title.trim())          { toast.error("Title required"); return; }
    if (isAdmin && !form.assignedToUserId) { toast.error("Please assign the task to a user"); return; }
    try {
      setSaving(true);
      await api.post("/tasks", {
        ...form,
        assignedToUserId: form.assignedToUserId ? Number(form.assignedToUserId) : null,
        status: "Pending",
      });
      toast.success("✅ Task created");
      setShowForm(false);
      setForm({ title: "", description: "", dueDate: "", priority: "Medium", assignedToUserId: "" });
      emitCRMUpdate();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const filtered = tasks.filter(t => filter === "All" || t.status === filter);

  const counts = {
    All:          tasks.length,
    Pending:      tasks.filter(t => t.status === "Pending").length,
    "In Progress":tasks.filter(t => t.status === "In Progress").length,
    Completed:    tasks.filter(t => t.status === "Completed").length,
  };

  return (
    <div className="page-wrap">

      {/* Header */}
      <div className="ds-card mb-3 d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>📝 Tasks</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            {isAdmin ? "Manage & assign tasks to team members" : "Your assigned tasks"}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(v => !v)} className="elite-add-btn">
            {showForm ? "✕ Cancel" : "+ New Task"}
          </button>
        )}
      </div>

      {/* Create Task Form (Admin only) */}
      {isAdmin && showForm && (
        <div className="ds-card mb-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 16 }}>
            📝 Create New Task
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Title *
              </label>
              <input className="elite-input w-100" placeholder="Task title..."
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                🎯 Assign To *
              </label>
              <select className="elite-input w-100" value={form.assignedToUserId}
                onChange={e => setForm({ ...form, assignedToUserId: e.target.value })}>
                <option value="">— Select User —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username || u.email} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Priority
              </label>
              <select className="elite-input w-100" value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Due Date
              </label>
              <input type="date" className="elite-input w-100"
                value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Description
              </label>
              <textarea rows="3" className="elite-input w-100" placeholder="Task details..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={saveTask} disabled={saving} className="elite-save" style={{ padding: "10px 28px" }}>
              {saving ? "Saving..." : "💾 Create Task"}
            </button>
            <button onClick={() => setShowForm(false)} className="elite-cancel" style={{ padding: "10px 20px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { key: "All",         label: "All Tasks",   color: "#6366f1" },
          { key: "Pending",     label: "Pending",     color: "#f59e0b" },
          { key: "In Progress", label: "In Progress", color: "#818cf8" },
          { key: "Completed",   label: "Completed",   color: "#10b981" },
        ].map(tab => (
          <div
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              background: filter === tab.key ? `${tab.color}22` : "rgba(15,20,30,0.5)",
              border: `1px solid ${filter === tab.key ? tab.color + "55" : "rgba(148,163,184,0.1)"}`,
              borderRadius: 14, padding: "14px 18px",
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: tab.color }}>{counts[tab.key]}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{tab.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "52px 0", color: "#475569" }}>Loading tasks...</div>
        ) : (
          <div className="table-wrap">
            <table className="ds-table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Title</th>
                  <th style={{ minWidth: 150 }}>Description</th>
                  <th style={{ minWidth: 120 }}>Assigned To</th>
                  <th style={{ minWidth: 100 }}>Priority</th>
                  <th style={{ minWidth: 110 }}>Due Date</th>
                  <th style={{ minWidth: 130 }}>Status</th>
                  {isAdmin && <th style={{ minWidth: 80, textAlign: "center" }}>Delete</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: "center", padding: "48px 16px", color: "#334155" }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                      No tasks found
                    </td>
                  </tr>
                )}

                {filtered.map(t => {
                  const ss        = statusStyle(t.status);
                  const curIdx    = STATUS_FLOW.indexOf(t.status);
                  const nextStatus = curIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[curIdx + 1] : null;
                  const canChange = isAdmin || t.assignedTo === username || t.assignedToUsername === username;
                  const priorityColor = t.priority === "High" ? "#ef4444" : t.priority === "Medium" ? "#f59e0b" : "#10b981";

                  return (
                    <tr key={t.id}>
                      <td className="fw-semibold" style={{ color: "#e2e8f0", wordBreak: "break-word", whiteSpace: "normal", maxWidth: 220 }}>
                        {t.title}
                      </td>

                      <td style={{ color: "#94a3b8", fontSize: 12, maxWidth: 200, wordBreak: "break-word", whiteSpace: "normal" }}>
                        {t.description || "—"}
                      </td>

                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: "#a5b4fc",
                          background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.2)",
                          borderRadius: 8, padding: "3px 10px",
                          whiteSpace: "nowrap",
                        }}>
                          👤 {t.assignedTo || t.assignedToUsername || "Unassigned"}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, fontWeight: 700, color: priorityColor }}>
                          {t.priority || "—"}
                        </span>
                      </td>

                      <td style={{ color: "#94a3b8", fontSize: 13 }}>
                        {t.dueDate ? <>📅 {t.dueDate}</> : "—"}
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            background: ss.bg, color: ss.color,
                            border: `1px solid ${ss.border}`,
                            borderRadius: 20, padding: "3px 10px",
                            whiteSpace: "nowrap", display: "inline-block",
                          }}>
                            {t.status || "Pending"}
                          </span>

                          {/* Status advance button */}
                          {canChange && nextStatus && (
                            <button
                              onClick={() => changeStatus(t, nextStatus)}
                              style={{
                                background: "rgba(99,102,241,0.12)",
                                border: "1px solid rgba(99,102,241,0.25)",
                                color: "#a5b4fc", borderRadius: 8,
                                padding: "3px 8px", fontSize: 10,
                                fontWeight: 600, cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              → {nextStatus}
                            </button>
                          )}
                        </div>
                      </td>

                      {isAdmin && (
                        <td style={{ textAlign: "center" }}>
                          <button onClick={() => handleDelete(t.id)} className="icon-btn danger" title="Delete">
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
