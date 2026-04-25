import "./LoyaltyScheme.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function LoyaltyScheme() {
  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = "http://localhost:8080";

  const [tab, setTab] = useState(location.state?.tab || "login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    const savedMember = localStorage.getItem("member");

    if (savedMember) {
      try {
        const parsed = JSON.parse(savedMember);
        if (parsed && parsed.memberId) {
          loadMember(parsed.memberId);
          setTab("profile");
        }
      } catch (error) {
        console.log("local storage error");
      }
    }
  }, []);

  const loadMember = async (memberId) => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${BASE_URL}/api/loyalty/${memberId}`);

      if (!response.ok) {
        throw new Error("Cannot load member info");
      }

      const data = await response.json();

      const savedMember = {
        memberId: data.memberId,
        name: data.name,
        email: data.email,
        totalOrders: data.totalOrders
      };

      setMember(savedMember);
      localStorage.setItem("member", JSON.stringify(savedMember));
      setTab("profile");
    } catch (error) {
      console.log(error);
      setMessage("Failed to load member information.");
      localStorage.removeItem("member");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setMessage("Please fill in all register fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/api/loyalty/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Register success. Please log in.");
        setRegisterForm({
          name: "",
          email: "",
          password: ""
        });
        setTab("login");
      } else {
        setMessage(data.message || "Register failed.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!loginForm.email || !loginForm.password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/api/loyalty/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        const savedMember = {
          memberId: data.memberId,
          name: data.name,
          email: data.email,
          totalOrders: data.totalOrders
        };

        localStorage.setItem("member", JSON.stringify(savedMember));
        setMember(savedMember);
        setTab("profile");
        setMessage("Login success.");
        setLoginForm({
          email: "",
          password: ""
        });
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("member");
    setMember(null);
    setTab("login");
    setMessage("You have logged out.");
  };

  const handleRefresh = () => {
    if (member && member.memberId) {
      loadMember(member.memberId);
    }
  };

  const totalOrders = member ? member.totalOrders : 0;
  const progressValue = totalOrders % 10;
  const progressPercent = (progressValue / 9) * 100;
  const nextOrderFree = progressValue === 9;

  return (
    <div style={styles.page}>
      <div style={styles.phoneBox}>
        <div style={styles.header}>
          <div style={styles.logo}>☕</div>
          <div>
            <h1 style={styles.brandTitle}>Whistlestop Loyalty</h1>
            <p style={styles.brandSubTitle}>Coffee rewards for regular customers</p>
          </div>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.heroContent}>
            <p style={styles.heroSmall}>LOYALTY SCHEME</p>
            <h2 style={styles.heroTitle}>Collect 9 orders and get your next one free</h2>
          </div>
        </div>

        <div style={styles.mainCard}>
          <div style={styles.tabRow}>
            <button
              style={tab === "login" ? styles.activeTab : styles.tab}
              onClick={() => setTab("login")}
            >
              Login
            </button>

            <button
              style={tab === "register" ? styles.activeTab : styles.tab}
              onClick={() => setTab("register")}
            >
              Register
            </button>

            <button
              style={tab === "profile" ? styles.activeTab : styles.tab}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>
          </div>

          {message && <div style={styles.messageBox}>{message}</div>}

          {tab === "login" && (
            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                />
              </div>

              <button type="submit" style={styles.primaryButton} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <p style={styles.bottomText}>
                New customer?{" "}
                <span style={styles.linkText} onClick={() => setTab("register")}>
                  Create an account
                </span>
              </p>
            </form>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  style={styles.input}
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                />
              </div>

              <button type="submit" style={styles.primaryButton} disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          {tab === "profile" && (
            <div>
              {member ? (
                <>
                  <div style={styles.profileCard}>
                    <div style={styles.avatar}>
                      {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div>
                      <h3 style={styles.profileName}>{member.name}</h3>
                      <p style={styles.profileEmail}>{member.email}</p>
                    </div>
                  </div>

                  <div style={styles.infoCard}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Successful orders</span>
                      <span style={styles.infoValue}>{totalOrders}</span>
                    </div>

                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Reward progress</span>
                      <span style={styles.infoValue}>{progressValue} / 9</span>
                    </div>

                    <div style={styles.progressOuter}>
                      <div
                        style={{
                          ...styles.progressInner,
                          width: `${progressPercent}%`
                        }}
                      ></div>
                    </div>

                    {nextOrderFree ? (
                      <div style={styles.greenBox}>
                        Great news! Your next order is FREE.
                      </div>
                    ) : (
                      <p style={styles.smallInfoText}>
                        Keep collecting completed orders. After 9 successful orders,
                        your next order will be free.
                      </p>
                    )}
                  </div>

                  <div style={styles.howCard}>
                    <h4 style={styles.howTitle}>How it works</h4>
                    <p style={styles.howText}>• Register for a loyalty account</p>
                    <p style={styles.howText}>• Collect completed coffee orders</p>
                    <p style={styles.howText}>• After 9 orders, enjoy 1 free order</p>
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.secondaryButton} onClick={handleRefresh}>
                      Refresh
                    </button>
                    <button style={styles.secondaryButton} onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div style={styles.emptyBox}>
                  <p style={styles.smallInfoText}>
                    Please log in to view your loyalty profile.
                  </p>
                  <button style={styles.primaryButton} onClick={() => setTab("login")}>
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.footerButtons}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <button style={styles.menuButton} onClick={() => navigate("/")}>
            Go to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f7f6",
    display: "flex",
    justifyContent: "center",
    padding: "0",
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif'
  },

  phoneBox: {
    width: "100%",
    maxWidth: "430px",
    minHeight: "100vh",
    backgroundColor: "#f7f7f6",
    display: "flex",
    flexDirection: "column"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 18px 14px 18px"
  },

  logo: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    backgroundColor: "#4a3621",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    boxShadow: "0 8px 20px rgba(74, 54, 33, 0.18)"
  },

  brandTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#4a3621"
  },

  brandSubTitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#7a6b5d"
  },

  heroCard: {
    margin: "0 18px 18px 18px",
    height: "170px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #6b4c2f 0%, #4a3621 100%)",
    boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
    overflow: "hidden",
    position: "relative"
  },

  heroContent: {
    position: "absolute",
    left: "20px",
    right: "20px",
    bottom: "20px"
  },

  heroSmall: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "1.5px",
    color: "rgba(255,255,255,0.88)",
    fontWeight: "700"
  },

  heroTitle: {
    margin: "8px 0 0 0",
    color: "white",
    fontSize: "24px",
    lineHeight: "30px",
    fontWeight: "800"
  },

  mainCard: {
    backgroundColor: "white",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    padding: "22px 18px 24px 18px",
    flex: 1,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.04)"
  },

  tabRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "18px"
  },

  tab: {
    flex: 1,
    height: "44px",
    borderRadius: "999px",
    border: "1px solid #e8e2db",
    backgroundColor: "#f7f7f6",
    color: "#6f6255",
    fontWeight: "600",
    cursor: "pointer"
  },

  activeTab: {
    flex: 1,
    height: "44px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#4a3621",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(74, 54, 33, 0.2)"
  },

  messageBox: {
    backgroundColor: "#f9f2ea",
    color: "#6b4c2f",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    marginBottom: "16px"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#4a3621"
  },

  input: {
    width: "100%",
    height: "52px",
    borderRadius: "14px",
    border: "1px solid #e5ddd3",
    backgroundColor: "#ffffff",
    padding: "0 14px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box"
  },

  primaryButton: {
    marginTop: "6px",
    height: "52px",
    border: "none",
    borderRadius: "14px",
    backgroundColor: "#4a3621",
    color: "white",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(74, 54, 33, 0.2)"
  },

  bottomText: {
    margin: 0,
    textAlign: "center",
    fontSize: "14px",
    color: "#7a6b5d"
  },

  linkText: {
    color: "#4a3621",
    fontWeight: "700",
    cursor: "pointer"
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    backgroundColor: "#faf7f3",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px"
  },

  avatar: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    backgroundColor: "#4a3621",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "800"
  },

  profileName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#4a3621"
  },

  profileEmail: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#7a6b5d"
  },

  infoCard: {
    backgroundColor: "white",
    border: "1px solid #eee5db",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px"
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },

  infoLabel: {
    color: "#6f6255",
    fontSize: "14px",
    fontWeight: "600"
  },

  infoValue: {
    color: "#4a3621",
    fontSize: "15px",
    fontWeight: "800"
  },

  progressOuter: {
    width: "100%",
    height: "14px",
    borderRadius: "999px",
    backgroundColor: "#efe7de",
    overflow: "hidden",
    marginBottom: "14px"
  },

  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg, #8b5e3c 0%, #4a3621 100%)",
    borderRadius: "999px"
  },

  greenBox: {
    backgroundColor: "#ecf9ef",
    color: "#1d7a36",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "700"
  },

  smallInfoText: {
    margin: 0,
    color: "#7a6b5d",
    fontSize: "14px",
    lineHeight: "22px"
  },

  howCard: {
    backgroundColor: "#faf7f3",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px"
  },

  howTitle: {
    margin: "0 0 10px 0",
    color: "#4a3621",
    fontSize: "16px",
    fontWeight: "800"
  },

  howText: {
    margin: "6px 0",
    fontSize: "14px",
    color: "#6f6255"
  },

  emptyBox: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  actionRow: {
    display: "flex",
    gap: "10px"
  },

  secondaryButton: {
    flex: 1,
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #d9cfc3",
    backgroundColor: "white",
    color: "#4a3621",
    fontWeight: "700",
    cursor: "pointer"
  },

  footerButtons: {
    display: "flex",
    gap: "10px",
    padding: "16px 18px 22px 18px",
    backgroundColor: "#f7f7f6"
  },

  backButton: {
    flex: 1,
    height: "50px",
    borderRadius: "14px",
    border: "1px solid #d9cfc3",
    backgroundColor: "white",
    color: "#4a3621",
    fontWeight: "700",
    cursor: "pointer"
  },

  menuButton: {
    flex: 1.3,
    height: "50px",
    borderRadius: "14px",
    border: "none",
    backgroundColor: "#4a3621",
    color: "white",
    fontWeight: "700",
    cursor: "pointer"
  }
};

export default LoyaltyScheme;