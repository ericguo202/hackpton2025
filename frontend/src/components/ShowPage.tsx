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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract charity ID from URL path (e.g., /charities/1)
  const charityId = window.location.pathname.split("/").pop();

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
          err instanceof Error ? err.message : "An error occurred while loading the charity"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharity();
  }, [charityId]);

  return (
    <>
      <Navbar />
      <div style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "0 1.5rem"
      }}>
        {isLoading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1.2rem", color: "#666" }}>Loading charity information...</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#c00", marginBottom: "0.5rem" }}>Error</h2>
            <p style={{ color: "#c00" }}>{error}</p>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.5rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Return to Home
            </button>
          </div>
        )}

        {charity && (
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            padding: "2rem"
          }}>
            {/* Charity Name */}
            <h1 style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "1rem",
              borderBottom: "3px solid #667eea",
              paddingBottom: "0.5rem"
            }}>
              {charity.name}
            </h1>

            {/* Address Section */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#555",
                marginBottom: "0.5rem"
              }}>
                📍 Address
              </h3>
              <p style={{ fontSize: "1rem", color: "#666", lineHeight: "1.6" }}>
                {charity.address}
              </p>
            </div>

            {/* Description Section */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#555",
                marginBottom: "0.5rem"
              }}>
                About
              </h3>
              <p style={{
                fontSize: "1rem",
                color: "#666",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
              }}>
                {charity.description}
              </p>
            </div>

            {/* Website Section */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#555",
                marginBottom: "0.5rem"
              }}>
                Website
              </h3>
              <a
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "1rem",
                  color: "#667eea",
                  textDecoration: "underline"
                }}
              >
                {charity.website}
              </a>
            </div>

            {/* Contact Section */}
            {charity.contact && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#555",
                  marginBottom: "0.5rem"
                }}>
                  📧 Contact
                </h3>
                <p style={{ fontSize: "1rem", color: "#666" }}>
                  {charity.contact}
                </p>
              </div>
            )}

            {/* Needs Section */}
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#555",
                marginBottom: "1rem"
              }}>
                How You Can Help
              </h3>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {/* Volunteers Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "8px",
                  backgroundColor: charity.needs_volunteers ? "#d4edda" : "#f8f9fa",
                  border: `2px solid ${charity.needs_volunteers ? "#28a745" : "#dee2e6"}`,
                  fontWeight: "600"
                }}>
                  <span style={{
                    color: charity.needs_volunteers ? "#155724" : "#6c757d"
                  }}>
                    {charity.needs_volunteers ? "Needs Volunteers" : "Not Seeking Volunteers"}
                  </span>
                </div>

                {/* Donations Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "8px",
                  backgroundColor: charity.needs_donations ? "#d4edda" : "#f8f9fa",
                  border: `2px solid ${charity.needs_donations ? "#28a745" : "#dee2e6"}`,
                  fontWeight: "600"
                }}>
                  <span style={{
                    color: charity.needs_donations ? "#155724" : "#6c757d"
                  }}>
                    {charity.needs_donations ? "Needs Donations" : "Not Seeking Donations"}
                  </span>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#5568d3"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#667eea"}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}