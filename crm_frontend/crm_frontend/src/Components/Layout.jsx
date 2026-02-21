import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { getRole, getUsername, logout } from "./auth";
import { useEffect, useState, useCallback } from "react";
import api from "./api";
import "../Css/index.css";
import { motion } from "framer-motion";
import { CRM_EVENTS } from "./events";

const Layout = () => {

  const role = getRole();
  const username = getUsername();
  const navigate = useNavigate();
  const location = useLocation();

  const [todayFollowups, setTodayFollowups] = useState(0);

  const loadFollowups = useCallback(() => {
    api.get("/interactions/today")
      .then(res => {
        setTodayFollowups(res.data?.length || 0);
      })
      .catch(() => {
        setTodayFollowups(0);
      });
  }, []);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  useEffect(() => {
    loadFollowups();
  }, [location.pathname, loadFollowups]);

  useEffect(() => {

    const reload = () => loadFollowups();

    window.addEventListener(
      CRM_EVENTS.DATA_UPDATED,
      reload
    );

    return () => {
      window.removeEventListener(
        CRM_EVENTS.DATA_UPDATED,
        reload
      );
    };

  }, [loadFollowups]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    "menu-link " + (isActive ? "active-link" : "");

  return (
    <div className="app-dark">

      <nav className="glass px-4 py-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold m-0">CRM Follow Ups</h5>

        <div className="d-flex gap-3 align-items-center">
          <span>👤 {username} ({role})</span>

          <button
            onClick={handleLogout}
            className="btn btn-sm btn-danger"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="layout-body">

        <div className="ds-sidebar p-3">

          <h6 className="ds-menu-title">MENU</h6>

          <NavLink to="" end className={linkClass}>📊 Dashboard</NavLink>
          <NavLink to="customers" className={linkClass}>👥 Customers</NavLink>
          <NavLink to="interactions" className={linkClass}>📞 Interactions</NavLink>
          <NavLink to="timeline" className={linkClass}>🕒 Timeline</NavLink>
          <NavLink to="today" className={linkClass}>🔔 Followups</NavLink>
          <NavLink to="tasks" className={linkClass}>📝 Tasks</NavLink>

          <NavLink to="todays-followups" className={linkClass}>
            ✅ Today's Followups
            {todayFollowups > 0 && (
              <span className="sidebar-badges">
                {todayFollowups}
              </span>
            )}
          </NavLink>

          {role === "ADMIN" && (
            <>
              <hr />
              <h6 className="text-muted">ADMIN</h6>

              <NavLink to="add-customers" className={linkClass}>➕ Add Customer</NavLink>
              <NavLink to="reports" className={linkClass}>📊 Reports</NavLink>
              <NavLink to="user-requests" className={linkClass}>📨 User Requests</NavLink>
              <NavLink to="master-admin" className={linkClass}>👑 Master Admin</NavLink>
            </>
          )}
        </div>

        <div className="flex-grow-1 p-4">
          <div className="glass p-4">

          <motion.div
  key={location.pathname}
  layout={false}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.15,
    ease: "easeOut"
  }}
><Outlet /></motion.div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Layout; 