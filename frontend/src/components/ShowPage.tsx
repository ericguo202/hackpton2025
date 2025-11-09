import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Charity {
  id: number;
  username: string;
  name: string;
  address: string;
  description: string;
  website: string;
  contact: string;
  needs_volunteers: boolean;
  needs_donations: boolean;
  is_approved: boolean;
}

export default function ShowPage() {
  const [charity, setCharity] = useState<Charity | null>(null);
  const [currentUser, setCurrentUser] = useState<Charity | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract charity ID from URL path (e.g., /charities/1)
  const charityId = window.location.pathname.split("/").pop();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charities/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch charity data
  useEffect(() => {
    const fetchCharity = async () => {
      if (!charityId || isNaN(Number(charityId))) {
        setError("Invalid charity ID");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/charities/${charityId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Charity not found");
          } else {
            setError("Failed to load charity information");
          }
          setIsLoading(false);
          return;
        }

        const data: Charity = await response.json();
        setCharity(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while loading the charity"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharity();
  }, [charityId]);

  // Check if the logged-in user owns this charity profile
  const isOwner = currentUser && charity && currentUser.id === charity.id;

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#F5F5DC",
          paddingTop: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "2rem auto",
            padding: "0 1.5rem",
          }}
        >
          {isLoading && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p style={{ fontSize: "1.2rem", color: "#004225" }}>
                Loading charity information...
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#F5F5DC",
                border: "2px solid #FFB000",
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  color: "#d32f2f",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                }}
              >
                Error
              </h2>
              <p style={{ color: "#d32f2f", fontWeight: "600" }}>{error}</p>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#FFB000",
                  color: "#004225",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 15px rgba(255,176,0,0.3)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFCF9D";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(255,176,0,0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFB000";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(255,176,0,0.3)";
                }}
              >
                Return to Home
              </button>
            </div>
          )}

          {charity && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                padding: "2rem",
                border: "2px solid #004225",
              }}
            >
              {/* Header with Title and Edit Button */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                {/* Charity Name */}
                <h1
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    color: "#004225",
                    borderBottom: "3px solid #FFB000",
                    paddingBottom: "0.5rem",
                    flex: 1,
                  }}
                >
                  {charity.name}
                </h1>

                {/* Edit Button - Only show if user owns this charity */}
                {!isLoadingAuth && isOwner && (
                  <a
                    href={`/charities/${charity.id}/edit`}
                    style={{
                      display: "inline-block",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#FFB000",
                      color: "#004225",
                      textDecoration: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      marginLeft: "1rem",
                      transition: "all 0.2s",
                      boxShadow: "0 4px 15px rgba(255,176,0,0.3)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFCF9D";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(255,176,0,0.4)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFB000";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 15px rgba(255,176,0,0.3)";
                    }}
                  >
                    Edit Profile
                  </a>
                )}
              </div>

              {/* Address Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#004225",
                    marginBottom: "0.5rem",
                  }}
                >
                  Address
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#004225",
                    lineHeight: "1.6",
                    opacity: 0.8,
                  }}
                >
                  {charity.address}
                </p>
              </div>

              {/* Description Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#004225",
                    marginBottom: "0.5rem",
                  }}
                >
                  About
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#004225",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    opacity: 0.8,
                  }}
                >
                  {charity.description}
                </p>
              </div>

              {/* Website Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#004225",
                    marginBottom: "0.5rem",
                  }}
                >
                  Website
                </h3>
                <a
                  href={charity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "1rem",
                    color: "#004225",
                    textDecoration: "underline",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#FFB000")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#004225")}
                >
                  {charity.website}
                </a>
              </div>

              {/* Contact Section */}
              {charity.contact && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "600",
                      color: "#004225",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Contact
                  </h3>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#004225",
                      opacity: 0.8,
                    }}
                  >
                    {charity.contact}
                  </p>
                </div>
              )}

              {/* Needs Section */}
              <div style={{ marginTop: "2rem" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#004225",
                    marginBottom: "1rem",
                  }}
                >
                  How You Can Help
                </h3>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {/* Volunteers Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "8px",
                      backgroundColor: charity.needs_volunteers
                        ? "#FFCF9D"
                        : "#F5F5DC",
                      border: `2px solid ${
                        charity.needs_volunteers ? "#FFB000" : "#004225"
                      }`,
                      fontWeight: "600",
                    }}
                  >
                    <span
                      style={{
                        color: charity.needs_volunteers ? "#004225" : "#004225",
                        opacity: charity.needs_volunteers ? 1 : 0.6,
                      }}
                    >
                      {charity.needs_volunteers
                        ? "Needs Volunteers"
                        : "Not Seeking Volunteers"}
                    </span>
                  </div>

                  {/* Donations Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "8px",
                      backgroundColor: charity.needs_donations
                        ? "#FFCF9D"
                        : "#F5F5DC",
                      border: `2px solid ${
                        charity.needs_donations ? "#FFB000" : "#004225"
                      }`,
                      fontWeight: "600",
                    }}
                  >
                    <span
                      style={{
                        color: charity.needs_donations ? "#004225" : "#004225",
                        opacity: charity.needs_donations ? 1 : 0.6,
                      }}
                    >
                      {charity.needs_donations
                        ? "Needs Donations"
                        : "Not Seeking Donations"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <button
                  onClick={() => (window.location.href = "/")}
                  style={{
                    padding: "0.75rem 2rem",
                    backgroundColor: "#FFB000",
                    color: "#004225",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 15px rgba(255,176,0,0.3)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFCF9D";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(255,176,0,0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFB000";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 15px rgba(255,176,0,0.3)";
                  }}
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
