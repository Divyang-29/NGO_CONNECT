import { useState } from "react";
import api from "../../utils/api";
import "./LoginModal.css";

export default function LoginModal({
  type,
  onClose,
  switchToRegister,
  switchToLogin,
}) {
  // 🔹 ROLE STATE (used only during register)
  const [role, setRole] = useState("user");

  // 🔹 LOGIN STATE
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // 🔹 REGISTER STATE
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", loginData);

      // ✅ SAVE USER FOR NAVBAR
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful");
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  /* ================= REGISTER ================= */
  const handleRegister = async () => {
    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        email: registerData.email,
        password: registerData.password,
        role, // 🔥 role sent only here
      });

      alert("Registered successfully");
      console.log("REGISTER RESPONSE:", res.data);

      // after register → go to login
      switchToLogin();
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* LEFT IMAGE */}
        <div className="auth-image"></div>

        {/* RIGHT FORM */}
        <div className="auth-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>

          {/* ================= LOGIN ================= */}
          {type === "login" ? (
            <>
              <h2>Login</h2>

              <input
                type="email"
                placeholder="Email address"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Your password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
              />

              <button className="primary-btn" onClick={handleLogin}>
                Login
              </button>

              <p className="switch-text">
                Don’t have an account?{" "}
                <span onClick={switchToRegister}>Register</span>
              </p>
            </>
          ) : (
            <>
              {/* ================= REGISTER ================= */}
              <h2>Register</h2>

              {/* 🔥 ROLE SELECT (REGISTER ONLY) */}
              <select
                className="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <input
                type="email"
                placeholder="Email address"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={registerData.confirmPassword}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    confirmPassword: e.target.value,
                  })
                }
              />

              <button className="primary-btn" onClick={handleRegister}>
                Sign Up
              </button>

              <p className="switch-text">
                Already have an account?{" "}
                <span onClick={switchToLogin}>Sign In</span>
              </p>
            </>
          )}

          <div className="divider">or login with</div>

          <div className="social-btns">
            <button>Google</button>
            <button>Facebook</button>
          </div>
        </div>
      </div>
    </div>
  );
}
