import { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import LoginModal from "./components/Auth/LoginModal";
import Logo from "./assets/ngo_connect_logo.png";

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState("login");
  const [user, setUser] = useState(null);

  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  /* ================= LOAD USER FROM LOCAL STORAGE ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  /* ================= CLOSE DROPDOWN ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setUserOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        {/* LEFT */}
        <div className="navbar-left">
          <img src={Logo} alt="NGO Connect" className="logo" />
        </div>

        {/* CENTER */}
        <div className="navbar-center">
          <ul className="nav-links">
            <li onClick={() => (window.location.href = "/")}>Home</li>
            <li onClick={() => (window.location.href = "/listing")}>Listing</li>
            <li onClick={() => (window.location.href = "/pages")}>Pages</li>
            <li onClick={() => (window.location.href = "/blog")}>Blog</li>
            <li onClick={() => (window.location.href = "/contact")}>Contact</li>
          </ul>
        </div>

        {/* RIGHT */}
        <div className="navbar-right">
          {/* USER DROPDOWN */}
          <div className="user-wrapper" ref={userRef}>
            <div
              className="user"
              onClick={() => setUserOpen((prev) => !prev)}
            >
              <i className="fa-regular fa-user"></i>
              <span>{user ? user.email : "Account"} ▾</span>
            </div>

            {userOpen && (
              <div className="user-dropdown">
                <ul>
                  {user ? (
                    <>
                      <li>Dashboard</li>
                      <li>Profile</li>
                      <li className="logout" onClick={handleLogout}>
                        Logout
                      </li>
                    </>
                  ) : (
                    <li
                      onClick={() => {
                        setAuthType("login");
                        setAuthOpen(true);
                        setUserOpen(false);
                      }}
                    >
                      Login / Register
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* ================= ROLE BASED BUTTON (DESKTOP) ================= */}
          {user?.role === "admin" && (
            <button
              className="add-btn"
              onClick={() => (window.location.href = "/addProperty")}
            >
              Add Property
            </button>
          )}

          {user?.role === "user" && (
            <button
              className="add-btn"
              onClick={() => (window.location.href = "/raiseRequest")}
            >
              Raise Request
            </button>
          )}

          {/* HAMBURGER */}
          <span className="hamburger" onClick={() => setOpen(!open)}>
            ☰
          </span>
        </div>
      </nav>

      {/* ================= MOBILE MENU ================= */}
      {open && (
        <div className="mobile-menu">
          <ul>
            <li onClick={() => (window.location.href = "/")}>Home</li>
            <li onClick={() => (window.location.href = "/listing")}>Listing</li>
            <li onClick={() => (window.location.href = "/pages")}>Pages</li>
            <li onClick={() => (window.location.href = "/blog")}>Blog</li>
            <li onClick={() => (window.location.href = "/contact")}>
              Contact
            </li>

            {/* ROLE BASED ACTION (MOBILE) */}
            {user?.role === "admin" && (
              <li onClick={() => (window.location.href = "/addProperty")}>
                Add Property
              </li>
            )}

            {user?.role === "user" && (
              <li onClick={() => (window.location.href = "/raiseRequest")}>
                Raise Request
              </li>
            )}

            {!user && (
              <li
                onClick={() => {
                  setAuthType("login");
                  setAuthOpen(true);
                  setOpen(false);
                }}
              >
                Login / Register
              </li>
            )}

            {user && (
              <li className="logout" onClick={handleLogout}>
                Logout
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ================= AUTH MODAL ================= */}
      {authOpen && (
        <LoginModal
          type={authType}
          onClose={() => setAuthOpen(false)}
          switchToRegister={() => setAuthType("register")}
          switchToLogin={() => setAuthType("login")}
        />
      )}
    </>
  );
}
