import { Link, Navigate } from "react-router-dom";
import { getToken } from "./auth";

const Home = () => {

  const token = getToken();

  if (token) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="container-fluid vh-100 overflow-hidden">

      <div className="row h-100">

        <div className="col-md-6 d-flex flex-column justify-content-center p-5 bg-white">

          <h1 className="fw-bold mb-3" style={{ fontSize: "46px", lineHeight: 1.2 }}>
            Smart CRM <br />
            <span style={{ color: "#2563eb" }}>
              For Follow-Ups
            </span>
          </h1>

          <p
            className="text-muted mb-4"
            style={{ fontSize: "18px", maxWidth: "520px" }}
          >
            Manage customers, track conversations, and automate follow-ups
            using a modern CRM designed for growing teams and sales-driven businesses.
          </p>

          <div className="d-flex gap-3">

            <Link
              to="/login"
              className="btn text-white px-4 py-3 fw-semibold shadow-sm"
              style={{
                background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                borderRadius: "12px",
                minWidth: "140px",
                transition: "0.25s"
              }}
            >
              Login
            </Link>

            <Link
              to="/register"
              className="btn btn-outline-dark px-4 py-3 fw-semibold"
              style={{
                borderRadius: "12px",
                minWidth: "160px"
              }}
            >
              Create Account
            </Link>

          </div>

          <p className="text-muted mt-4 small">
            Simple • Fast • Reliable CRM Platform
          </p>

        </div>


        <div
          className="col-md-6 d-none d-md-flex align-items-end text-white"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1400&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative"
          }}
        >

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(37,99,235,0.45),rgba(0,0,0,0.75))"
            }}
          />

          <div style={{ position: "relative", padding: "60px" }}>

            <h2 className="fw-bold" style={{ lineHeight: 1.3 }}>
              Close more deals.
              <br />
              Build better relationships.
            </h2>

            <p className="opacity-75 mt-3" style={{ maxWidth: "420px" }}>
              Stay organized, follow up on time, and increase conversions —
              without CRM complexity.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Home;
