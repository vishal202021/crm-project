import { useEffect, useState, useCallback } from "react";
import api from "./api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useNavigate } from "react-router-dom";
import { CRM_EVENTS } from "./events";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#34d399", "#6366f1", "#f59e0b"];


const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut"
    }
  }
};


const Dashboard = () => {

  const [newCustomers, setNewCustomers] = useState(0);
  const [todayCalls, setTodayCalls] = useState(0);
  const [todayFollowups, setTodayFollowups] = useState(0);
  const [converted, setConverted] = useState(0);

  const [weekData, setWeekData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  const navigate = useNavigate();

  const loadDashboard = useCallback(() => {

    api.get("/customers/summary")
      .then(res => {
        const data = res.data.content || [];

        setNewCustomers(
          data.filter(c => !c.status || c.status === "New").length
        );

        setConverted(
          data.filter(c => c.status === "Converted").length
        );
      });

    api.get("/interactions/today")
      .then(res => {
        setTodayFollowups(res.data.length);
      });

    api.get("/interactions")
      .then(res => {

        const interactions = res.data;

        const todayStr =
          new Date().toISOString().split("T")[0];

        setTodayCalls(
          interactions.filter(i =>
            i.interactionDate === todayStr
          ).length
        );

        const counts = {
          Mon: 0, Tue: 0, Wed: 0,
          Thu: 0, Fri: 0, Sat: 0, Sun: 0
        };

        interactions.forEach(i => {
          if (!i.nextFollowupDate) return;

          const d = new Date(i.nextFollowupDate)
            .toLocaleDateString("en-US", { weekday: "short" });

          if (counts[d] != null) counts[d]++;
        });

        setWeekData(
          Object.keys(counts).map(k => ({
            name: k,
            value: counts[k]
          }))
        );

        const map = {};

        interactions.forEach(i => {
          const s = i.status || "Unknown";
          map[s] = (map[s] || 0) + 1;
        });

        setStatusData(
          Object.keys(map).map(k => ({
            name: k,
            value: map[k]
          }))
        );

      });

  }, []);



  useEffect(() => {

    loadDashboard();

    window.addEventListener(
      CRM_EVENTS.DATA_UPDATED,
      loadDashboard
    );

    const timer = setInterval(loadDashboard, 60000);

    return () => {
      window.removeEventListener(
        CRM_EVENTS.DATA_UPDATED,
        loadDashboard
      );
      clearInterval(timer);
    };

  }, [loadDashboard]);



  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >

      <div className="row mb-4">

        <motion.div className="col-md-3" variants={cardVariants}>
          <div className="ds-stat-card">
            <p>New Leads</p>
            <h2>{newCustomers}</h2>
          </div>
        </motion.div>

        <motion.div className="col-md-3" variants={cardVariants}>
          <div className="ds-stat-card green">
            <p>Calls Today</p>
            <h2>{todayCalls}</h2>
          </div>
        </motion.div>

        <motion.div className="col-md-3" variants={cardVariants}>
          <div
            className="ds-stat-card orange"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/app/todays-followups")}
          >
            <p>Follow-ups Today</p>
            <h2>{todayFollowups}</h2>
          </div>
        </motion.div>

        <motion.div className="col-md-3" variants={cardVariants}>
          <div className="ds-stat-card purple">
            <p>Converted</p>
            <h2>{converted}</h2>
          </div>
        </motion.div>

      </div>


      <div className="row">

        <motion.div className="col-md-6" variants={cardVariants}>
          <div className="ds-card">

            <h5 className="ds-title">Weekly Follow-ups</h5>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekData}>
                <XAxis
                  dataKey="name"
                  stroke="#e5e7eb"
                  tick={{ fill: "#e5e7eb" }}
                />
                <YAxis
                  stroke="#e5e7eb"
                  tick={{ fill: "#e5e7eb" }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>

          </div>
        </motion.div>

        <motion.div className="col-md-6" variants={cardVariants}>
          <div className="ds-card">

            <h5 className="ds-title">Status Breakdown</h5>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

          </div>
        </motion.div>

      </div>

    </motion.div>
  );
};

export default Dashboard;
