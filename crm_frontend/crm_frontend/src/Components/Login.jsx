import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { setToken } from "./auth";

const ERRORS = {
  INACTIVE: "Account not active",
  INVALID: "Invalid credentials"
};

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const login = async () => {

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let res;

      try {
        res = await api.post("/auth/login", {
          email,
          password
        });

      } catch (err) {

        
        if (!err.response) {

          setError("Starting server... please wait");

          await new Promise(resolve => setTimeout(resolve, 15000));

          res = await api.post("/auth/login", {
            email,
            password
          });

        } else {
          throw err;
        }
      }

      setToken(res.data.token);

      navigate("/app", { replace: true });

    } catch (err) {

      const errorCode = err.response?.data?.error;

      if (errorCode === ERRORS.INACTIVE) {
        setError("Your account is deactivated by admin");
      }
      else if (errorCode === ERRORS.INVALID) {
        setError("Invalid email or password");
      }
      else {
        setError("Login failed");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-dark container-fluid vh-100">
      <div className="row h-100">

        <div
          className="col-md-6 d-none d-md-flex flex-column justify-content-center text-white p-5"
          style={{
            background: "linear-gradient(135deg,#1fae8b,#38cfa6)",
            borderTopRightRadius: "120px",
            borderBottomRightRadius: "120px"
          }}
        >
          <h1 className="fw-bold display-5">C.R.M</h1>

          <h5 className="mt-3">
            Customer Relationship Management
          </h5>

          <p className="mt-2 opacity-75">
            Manage leads, track follow-ups,
            and grow your business smarter.
          </p>
        </div>

        <div
          className="col-md-6 d-flex align-items-center justify-content-center"
          style={{ background: "#020617" }}
        >

          <div style={{ width: "350px" }}>

            <h2 className="mb-4 text-success text-center">
              Sign In to C.R.M
            </h2>

            {error && (
              <div className="alert alert-danger py-2">
                {error}
              </div>
            )}

            <input
              type="email"
              placeholder="Email"
              className="form-control mb-3 p-3 elite-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="form-control mb-3 p-3 elite-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <div className="d-flex justify-content-between mb-4 small">
              <div>
                <input type="checkbox" /> Remember me
              </div>
              <span className="text-muted">
                Forgot password?
              </span>
            </div>

            <button
              onClick={login}
              disabled={loading}
              className="btn w-100 text-white fw-bold mb-3"
              style={{
                background: "#1fae8b",
                padding: "12px",
                borderRadius: "25px"
              }}
            >
              {loading ? "Connecting server..." : "LOG IN"}
            </button>

            <button
              onClick={() => navigate("/")}
              className="btn btn-outline-secondary w-100"
              style={{ borderRadius: "25px" }}
            >
              ← Back to Home
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;