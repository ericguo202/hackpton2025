import { useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import { API_BASE_URL } from "@/lib/config";

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/charities/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("Charity not found");
        } else if (response.status === 401) {
          setError("Invalid username or password");
        } else {
          setError("Login failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success: server sets cookie on the response. Parse JSON for redirect.
      const data = await response.json().catch(() => ({}));
      const target = data.location || "/";
      window.location.href = target;
      return;
    } catch (err) {
      setError("Network error. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: "calc(100vh - 80px)", // Full height minus navbar
          backgroundColor: "#F5F5DC", // Page background color - adjust this!
          paddingTop: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            margin: "3rem auto",
            padding: "0 1.5rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#F5F5DC",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              padding: "2.5rem",
              border: "2px solid #004225",
            }}
          >
            {/* Header */}
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#004225",
                borderBottom: "3px solid #FFB000",
                paddingBottom: "0.5rem",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              Charity Login
            </h1>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  backgroundColor: "#F5F5DC",
                  border: "2px solid #FFB000",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#d32f2f", margin: 0, fontWeight: "600" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Username Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="username"
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#004225",
                    marginBottom: "0.5rem",
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={30}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "1rem",
                    border: "2px solid #004225",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    outline: "none",
                    backgroundColor: "#fff",
                    color: "#004225",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#FFB000")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#004225")
                  }
                />
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "2rem" }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#004225",
                    marginBottom: "0.5rem",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "1rem",
                    border: "2px solid #004225",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    outline: "none",
                    backgroundColor: "#fff",
                    color: "#004225",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#FFB000")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#004225")
                  }
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.75rem 2rem",
                  backgroundColor: isLoading ? "#999" : "#FFB000",
                  color: "#004225",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginBottom: "1rem",
                  boxShadow: isLoading
                    ? "none"
                    : "0 4px 15px rgba(255,176,0,0.3)",
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "#FFCF9D";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(255,176,0,0.4)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "#FFB000";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 15px rgba(255,176,0,0.3)";
                  }
                }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Register Link */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <p style={{ color: "#004225", marginBottom: "0.5rem" }}>
                Don't have an account?
              </p>
              <a
                href="/charities/new"
                style={{
                  color: "#004225",
                  textDecoration: "none",
                  fontWeight: "600",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#FFB000")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#004225")}
              >
                Register Your Charity
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
