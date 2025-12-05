// src/pages/Login.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { loadGoogleIdentity } from "../lib/google";

const GOOGLE_CLIENT_ID =
  "1001839997214-8n0b2cs605n52ltdri13ccgqnct2furc.apps.googleusercontent.com";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

export default function Login() {
  const navigate = useNavigate();
  const gBtnRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Email/password login – only works for registered users
  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    console.log(API_BASE_URL)

    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  }

  // Google login
  async function handleCredentialResponse(response) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Google login failed.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Google login error. Please try again.");
    }
  }

  // Set up Google Identity button
  useEffect(() => {
    loadGoogleIdentity().then(() => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        ux_mode: "popup",
      });

      if (gBtnRef.current) {
        window.google.accounts.id.renderButton(gBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 260,
        });
      }
    });
  }, []);

  return (
    <div className="page">
      {/* Flowers only on login/register pages */}
      <div className="bottom-decor">
        <div className="flower-gradient"></div>
        <img
          src="/image.png"
          alt="Lavender Field"
          className="bottom-flowers"
        />
      </div>

      <div className="content">
        <header className="header">
          {/* Logo in same spot as original */}
          <img src="/logo.png" alt="When3Meet Logo" className="logo" />
          <h1>When3Meet</h1>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <h2>Welcome back</h2>
          <p>Log in to manage your meetings.</p>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </label>

          {error && (
            <p style={{ color: "crimson", margin: "4px 0", fontSize: 14 }}>
              {error}
            </p>
          )}

          <button type="submit">Log In</button>

          <a href="#">Forgot password?</a>

          <p>
            Not a user?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Register
            </a>
          </p>

          <hr className="separator" />
          <div ref={gBtnRef} className="g-btn" />
        </form>
      </div>
    </div>
  );
}
