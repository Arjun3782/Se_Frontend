import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper functions for toast notifications
const handleError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 3000,
  });
};

const handleSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
  });
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    role: "staff",
    department: "",
    phone: ""
  });

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    const copySignupInfo = { ...signupInfo };
    copySignupInfo[name] = value;
    setSignupInfo(copySignupInfo);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { name, email, password, company_name } = signupInfo;
    if (!name || !email || !password || !company_name) {
      return handleError("Please fill all required fields");
    }
    try {
      const url = "http://localhost:5000/api/auth/signup";
      const response = await axios.post(url, signupInfo, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = response.data; // Removed unnecessary await
      const { message, success, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          setIsLogin(true); // Switch to login form after successful signup
        }, 3000);
      } else if (error && response.data.details) {
        return handleError(response.data.details.message);
      } else {
        return handleError(message);
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        handleError(error.response.data.message);
      } else if (error.response && error.response.data.error && error.response.data.error.details) {
        handleError(error.response.data.error.details[0].message);
      } else {
        handleError(error.message || "An error occurred during signup");
      }
    }
  };

  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });
  
  const navigate = useNavigate();
  
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    const copyLoginInfo = { ...loginInfo };
    copyLoginInfo[name] = value;
    setLoginInfo(copyLoginInfo);
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("Please fill all the fields");
    }
    try {
      const url = "http://localhost:5000/api/auth/login";
      const response = await axios.post(url, loginInfo, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // Important for refresh tokens
      });
      const result = response.data; // Removed unnecessary await
      const { message, success, accessToken, name, role, company_name, error } = result;
      if (success) {
        handleSuccess(message);
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify({
          name,
          role,
          company_name
        }));
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else if (error && response.data.details) {
        return handleError(response.data.details.message);
      } else {
        return handleError(message);
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        handleError(error.response.data.message);
      } else if (error.response && error.response.data.error && error.response.data.error.details) {
        handleError(error.response.data.error.details[0].message);
      } else {
        handleError(error.message || "An error occurred during login");
      }
    }
  };

  return (
    <div className="container">
      <div className={`form-container ${isLogin ? "" : "right-panel-active"}`}>
        {/* Login Form */}
        <div className="form-box login-box">
          <h2>Login to Inventory System</h2>
          <form onSubmit={handleLogin}>
            <div className="input-field">
              <input
                type="email"
                name="email"
                id="login-email"
                placeholder="Enter your email"
                value={loginInfo.email}
                onChange={handleLoginChange}
                autoFocus
              />
            </div>
            <div className="input-field">
              <input
                type="password"
                name="password"
                id="login-password"
                placeholder="Enter your password"
                value={loginInfo.password}
                onChange={handleLoginChange}
              />
            </div>
            <button type="submit" className="btn">
              Login
            </button>
            <p className="toggle-text">
              Don't have an account? <span className="toggle-link" onClick={toggleForm}>Sign up</span>
            </p>
          </form>
        </div>

        {/* Signup Form */}
        <div className="form-box signup-box">
          <h2>Sign Up for Inventory System</h2>
          <form onSubmit={handleSignUp}>
            <div className="input-field">
              <input
                type="text"
                name="name"
                id="name"
                placeholder="Full Name"
                value={signupInfo.name}
                onChange={handleSignupChange}
              />
            </div>
            <div className="input-field">
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                value={signupInfo.email}
                onChange={handleSignupChange}
              />
            </div>
            <div className="input-field">
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                value={signupInfo.password}
                onChange={handleSignupChange}
              />
            </div>
            <div className="input-field">
              <input
                type="text"
                name="company_name"
                id="company_name"
                placeholder="Company Name"
                value={signupInfo.company_name}
                onChange={handleSignupChange}
              />
            </div>
            <div className="input-field">
              <select
                name="role"
                id="role"
                value={signupInfo.role}
                onChange={handleSignupChange}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="input-field">
              <input
                type="text"
                name="department"
                id="department"
                placeholder="Department (optional)"
                value={signupInfo.department}
                onChange={handleSignupChange}
              />
            </div>
            <div className="input-field">
              <input
                type="text"
                name="phone"
                id="phone"
                placeholder="Phone Number (optional)"
                value={signupInfo.phone}
                onChange={handleSignupChange}
              />
            </div>
            <button type="submit" className="btn">
              Sign Up
            </button>
            <p>
              Already have an account? <span onClick={toggleForm}>Login</span>
            </p>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;