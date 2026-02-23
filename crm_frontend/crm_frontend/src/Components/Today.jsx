import { useEffect, useMemo, useState } from "react";
import api from "./api";
import CallModal from "./CallModal";
import { CRM_EVENTS } from "./events";

const columns = ["New", "Follow-up", "Interested", "Closed"];

const Today = () => {

  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapStatus = (s) => {
    if (!s) return "Follow-up";
    if (s === "Interested") return "Interested";
    if (s === "Converted" || s === "Closed") return "Closed";
    return "Follow-up";
  };

  const load = async () => {
    try {
      setLoading(true);

      const [iRes, cRes] = await Promise.all([
        api.get("/interactions"),
        api.get("/customers/all")
      ]);

      const interactionsData = iRes.data || [];

      const latestMap = new Map();

      interactionsData.forEach(i => {
        const cid = i.customer?.id;
        if (!cid) return;

        if (
          !latestMap.has(cid) ||
          new Date(i.interactionDate) >
          new Date(latestMap.get(cid).interactionDate)
        ) {
          latestMap.set(cid, i);
        }
      });

      setInteractions([...latestMap.values()]);
      setCustomers(cRes.data || []);

    } catch (err) {
      console.error(err);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    load();

    const reload = () => load();

    window.addEventListener(CRM_EVENTS.DATA_UPDATED, reload);

    return () =>
      window.removeEventListener(CRM_EVENTS.DATA_UPDATED, reload);

  }, []);

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;

    const selected = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0,0,0,0);

    return selected.getTime() < today.getTime();
  };

  const filteredInteractions = useMemo(() => {
    return interactions.filter(i =>
      i.customer?.customerName
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [interactions, search]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.customerName
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [customers, search]);

  const customerWithInteraction = useMemo(() => {
    return new Set(interactions.map(i => i.customer?.id));
  }, [interactions]);

  const newCustomers = useMemo(() => {
    return filteredCustomers.filter(
      c => !customerWithInteraction.has(c.id)
    );
  }, [filteredCustomers, customerWithInteraction]);

  const grouped = useMemo(() => {

    const g = {
      "Follow-up": [],
      "Interested": [],
      "Closed": []
    };

    filteredInteractions.forEach(i => {
      const status = mapStatus(i.status);
      if (g[status]) g[status].push(i);
    });

    return g;

  }, [filteredInteractions]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="ds-card">
          Loading pipeline...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">

      <div className="elite-header">
        <div>
          <h3>Followups Pipeline</h3>
          <p>Visual sales follow-up board</p>
        </div>
      </div>

      <div className="elite-search">
        <i className="bi bi-search"/>
        <input
          placeholder="Search customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ✅ FIXED: replaced inline gridTemplateColumns with className */}
      <div className="pipeline-board">

        {columns.map(col => {

          if (col === "New") {
            return (
              <div key={col} className="glass p-3 pipeline-col">
                <h6 className="fw-bold mb-3">New</h6>

                {newCustomers.map(c => (
                  <div key={c.id} className="pipeline-card">

                    <b>{c.customerName}</b>
                    <div>{c.contactNo}</div>
                    <small className="text-muted">
                      No interactions yet
                    </small>

                    <button
                      onClick={() => setSelected(c)}
                      className="icon-btn call mt-2"
                    >
                      <i className="bi bi-telephone"/>
                    </button>

                  </div>
                ))}
              </div>
            );
          }

          return (
            <div key={col} className="glass p-3 pipeline-col">

              <h6 className="fw-bold mb-3">{col}</h6>

              {(grouped[col] || []).map(i => (
                <div key={i.id} className="pipeline-card">

                  <b>{i.customer?.customerName}</b>
                  <div>{i.customer?.contactNo}</div>

                  <div className="pc-note">
                    {i.followupDetails || "No notes"}
                  </div>

                  <div className="pc-date">
                    📅 {i.nextFollowupDate || "-"}
                    {isOverdue(i.nextFollowupDate) &&
                      <span className="pc-overdue">⚠ Overdue</span>}
                  </div>

                  <button
                    onClick={() => setSelected(i.customer)}
                    className="icon-btn call mt-2"
                  >
                    <i className="bi bi-telephone"/>
                  </button>

                </div>
              ))}

            </div>
          );
        })}

      </div>

      {selected && (
        <CallModal
          customer={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {}}
        />
      )}

    </div>
  );
};

export default Today;
