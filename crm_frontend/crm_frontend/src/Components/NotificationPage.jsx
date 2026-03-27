import { useEffect, useState } from "react";
import api from "./api";

const MISSED_STATUSES = ["Not Answered", "Busy", "Switched Off"];

const NotificationPage = () => {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/interactions");
      const all = Array.isArray(res.data) ? res.data : res.data?.content || [];

      const missed = all.filter(i =>
        MISSED_STATUSES.includes(i.status)
      );

      setNotifications(missed);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ minHeight: "80vh", color: "white" }}>

      <h2 style={{ marginBottom: 20 }}>📵 Missed Calls</h2>

      {loading && <p>Loading...</p>}

      {!loading && notifications.length === 0 && (
        <p>No missed calls</p>
      )}

      {!loading && notifications.map(n => (
        <div key={n.id} style={{
          padding: 10,
          borderBottom: "1px solid #333"
        }}>
          {n.customerName || "Unknown"} - {n.status}
        </div>
      ))}

    </div>
  );
};

export default NotificationPage;