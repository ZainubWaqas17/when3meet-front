import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { loadGoogleIdentity } from "../lib/google";

const GOOGLE_CLIENT_ID =
  "1001839997214-8n0b2cs605n52ltdri13ccgqnct2furc.apps.googleusercontent.com";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";
const BACKENDPORT = 50001;

export default function Login() {
  const navigate = useNavigate();
  const gBtnRef = useRef(null);

  // useEffect and loadGoogleIdentity are for google login
  useEffect(() => {
    // define inside effect to satisfy exhaustive-deps
    async function handleCredentialResponse(response) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: response.credential }),
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("isLoggedIn", "true");
          navigate("/home");
        } else {
          alert("Google login failed: " + (data.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Google login error:", error);
        alert("Google login failed. Please try again.");
      }
    }

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
  }, [navigate]);

  //handleLogin is for simple login using email and password created for the website
  async function handleLogin() {
    const email = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;

    if (!email || !password) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:${BACKENDPORT}/test/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");
        navigate("/home");
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to server. Please try again later.");
    }
  }

  return (
    <div className="page">
      {/* Flowers only on login page */}
      <div className="bottom-decor">
        <div className="flower-gradient"></div>
        <img src="/image.png" alt="Lavender Field" className="bottom-flowers" />
      </div>

      <div className="content">
        <header className="header">
          {/* Logo in same spot as original */}
          <img src="/logo.png" alt="When3Meet Logo" className="logo" />
          <h1>When3Meet</h1>
        </header>

        <h2>Log In</h2>
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Email" required />
          <input
            type="password"
            placeholder="Password"
            required
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button type="button" onClick={handleLogin}>
            Log In
          </button>
          <a href="#">Forgot password?</a>
          <p>
            Not a user? <a href="#">Register</a>
          </p>
          <hr className="separator" />
          <div ref={gBtnRef} className="g-btn" />
        </form>
      </div>
    </div>
  );
}
