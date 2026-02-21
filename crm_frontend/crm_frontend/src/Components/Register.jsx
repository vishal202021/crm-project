import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";

const Register = () => {

  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [agree,setAgree] = useState(false);

  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

 const register = async () => {

  if(!email || !password){
    return setError("Email & password required");
  }

  if(!agree){
    return setError("Please accept Terms");
  }

  try{
    setLoading(true);
    setError("");

    await api.post("/auth/register",{
      email,
      password
    });

    toast.success(
      "Registration submitted! Waiting for admin approval."
    );

    setTimeout(()=>{
      navigate("/login");
    },1500);

  }catch(err){

    const backendError =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Registration failed";

    setError(backendError);

  }finally{
    setLoading(false);
  }
};


  return (

    <div className="app-dark container-fluid vh-100">

      <div className="row h-100">

      
        <div className="col-md-6 d-flex flex-column justify-content-center p-5">

          <h2 className="fw-bold mb-2">
            Create Account
          </h2>

          <p className="text-muted mb-4">
            Start managing your customers smarter
          </p>

          {error && (
            <div className="alert alert-danger py-2">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email address"
            className="form-control mb-3 p-3 elite-input"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password (min 8 chars)"
            className="form-control mb-3 p-3 elite-input"
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />

          <div className="mb-3 small">
            <input
              type="checkbox"
              checked={agree}
              onChange={()=>setAgree(!agree)}
            />{" "}
            I agree to Terms & Privacy
          </div>

          <button
            onClick={register}
            disabled={loading}
            className="btn w-100 py-3 fw-bold text-white"
            style={{
              borderRadius:"10px",
              background:"linear-gradient(135deg,#111827,#1f2937)",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="mt-4 text-center text-muted">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>

        </div>

       
        <div
          className="col-md-6 d-none d-md-flex align-items-end text-white"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop')",
            backgroundSize:"cover",
            backgroundPosition:"center",
            position:"relative"
          }}
        >
          <div style={{
            position:"absolute",
            inset:0,
            background:"linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.7))"
          }}/>

          <div style={{position:"relative", padding:"60px"}}>
            <h2 className="fw-bold">
              We help teams move faster
            </h2>

            <p className="opacity-75 mt-3" style={{maxWidth:"400px"}}>
              Manage leads, follow-ups, and customer
              relationships in one powerful CRM platform.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
