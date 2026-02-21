import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AnimatePresence } from "framer-motion";

import Layout from "./Layout";
import Dashboard from "./Dashboard";
import Customers from "./Customers";
import AddCustomer from "./AddCustomer";
import EditCustomer from "./EditCustomer";
import Interactions from "./Interactions";
import AddInteraction from "./AddInteraction";
import Timeline from "./Timeline";
import Today from "./Today";
import Tasks from "./Tasks";
import Reports from "./Reports";
import UserRequests from "./UserRequests";
import TodaysFollowups from "./TodaysFollowups";
import MasterAdmin from "./MasterAdmin";

import Login from "./Login";
import Register from "./Register";
import Home from "./Home";

import RoleProtectedRoute from "./RoleProtectedRoute";
import RequireAuth from "./RequireAuth";
import { getToken } from "./auth";


function AppRoutes() {

  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={!getToken() ? <Login /> : <Navigate to="/app" replace />}
        />

        <Route
          path="/register"
          element={!getToken() ? <Register /> : <Navigate to="/app" replace />}
        />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >

          <Route index element={<Dashboard />} />

          <Route
            path="customers"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <Customers />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="add-customers"
            element={
              <RoleProtectedRoute roles={["ADMIN"]}>
                <AddCustomer />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="edit-customer/:id"
            element={
              <RoleProtectedRoute roles={["ADMIN"]}>
                <EditCustomer />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="interactions"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <Interactions />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="add-interactions"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <AddInteraction />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="timeline"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <Timeline />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="today"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <Today />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="tasks"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <Tasks />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="todays-followups"
            element={
              <RoleProtectedRoute roles={["ADMIN", "USER"]}>
                <TodaysFollowups />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <RoleProtectedRoute roles={["ADMIN"]}>
                <Reports />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="user-requests"
            element={
              <RoleProtectedRoute roles={["ADMIN"]}>
                <UserRequests />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="master-admin"
            element={
              <RoleProtectedRoute roles={["ADMIN"]}>
                <MasterAdmin />
              </RoleProtectedRoute>
            }
          />

        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </AnimatePresence>
  );
}


function App() {

  return (
    <BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        newestOnTop
        pauseOnHover
        draggable
        theme="colored"
      />

      <AppRoutes />

    </BrowserRouter>
  );
}

export default App;
