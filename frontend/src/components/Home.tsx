import { useState } from "react";
import "../styles/Home.css";

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

export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [searchResults, setSearchResults] = useState<Charity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const extractZipCode = (address: string): string | null => {
    // Match 5-digit or 5+4 digit zip codes
    const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
    return zipMatch ? zipMatch[0].slice(0, 5) : null;
  };

  const handleZipCodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate zip code
    if (!/^\d{5}$/.test(zipCode)) {
      setSearchError("Please enter a valid 5-digit zip code");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const response = await fetch(`${API_BASE_URL}/charities`);
      if (!response.ok) {
        throw new Error("Failed to fetch charities");
      }
      const charities: Charity[] = await response.json();

      // Filter charities by zip code using extraction method
      const filtered = charities.filter((charity) => {
        const charityZip = extractZipCode(charity.address);
        return charityZip === zipCode && charity.is_approved;
      });

      setSearchResults(filtered);

      if (filtered.length === 0) {
        setSearchError("No charities found in this zip code");
      }
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section: Zip Code Search */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find Local Charities</h1>
          <p className="hero-subtitle">
            Discover charities in your area and make a difference in your
            community
          </p>

          <div className="search-container">
            <form className="search-form" onSubmit={handleZipCodeSearch}>
              <input
                type="text"
                className="search-input"
                placeholder="Enter your zip code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
              />
              <button
                type="submit"
                className="search-button"
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </form>

            {searchError && <div className="error-message">{searchError}</div>}

            {searchResults.length > 0 && (
              <div className="search-results">
                <h3 className="results-header">
                  Found {searchResults.length}{" "}
                  {searchResults.length === 1 ? "charity" : "charities"}
                </h3>
                <ul className="results-list">
                  {searchResults.map((charity) => (
                    <li key={charity.id} className="result-card">
                      <h4 className="result-card-title">{charity.name}</h4>
                      <p className="result-card-address">{charity.address}</p>
                      {charity.description && (
                        <p className="result-card-description">
                          {charity.description}
                        </p>
                      )}
                      {charity.contact && (
                        <p className="result-card-description">
                          <strong>Contact:</strong> {charity.contact}
                        </p>
                      )}
                      {charity.website && (
                        <p className="result-card-description">
                          <strong>Website:</strong>{" "}
                          <a
                            href={charity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#667eea",
                              textDecoration: "underline",
                            }}
                          >
                            {charity.website}
                          </a>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Charity Registration/Login Section */}
      <section className="charity-section">
        <div className="charity-content">
          <h2 className="charity-title">Are you a charity?</h2>
          <p className="charity-description">
            Register or log in to connect with volunteers and donors in your
            community
          </p>
          <div className="charity-buttons">
            <button
              className="charity-button charity-button-primary"
              onClick={() => (window.location.href = "/charities/register")}
            >
              Register as Charity
            </button>
            <button
              className="charity-button charity-button-secondary"
              onClick={() => (window.location.href = "/charities/login")}
            >
              Log In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
