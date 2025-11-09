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
  geojson?: any;
}

export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [searchResults, setSearchResults] = useState<Charity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [currentCharity, setCurrentCharity] = useState<Charity | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if charity is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charities/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentCharity(data);
        } else {
          setCurrentCharity(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCurrentCharity(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

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

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
          <p className="text-xl text-[#004225]">Loading...</p>
        </div>
      </>
    );
  }

  // Render charity dashboard if logged in
  if (currentCharity) {
    return (
      <>
        <Navbar />
        <div>
          {/* Welcome Banner Section - Similar to public hero */}
          <section className="min-h-[60vh] flex flex-col justify-center items-center bg-[#004225] py-16 px-8 relative overflow-hidden">
            <div className="relative z-10 max-w-[900px] w-full text-center">
              <h1 className="text-6xl md:text-5xl sm:text-4xl font-extrabold text-[#FFB000] mb-6 tracking-wider drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
                Welcome, {currentCharity.name}!
              </h1>
              <p className="text-2xl md:text-xl text-[#F5F5DC] mb-8 font-light">
                Need volunteers or donations? Keep your charity information up to date.
              </p>
              <a
                href={`/charities/${currentCharity.id}/edit`}
                className="inline-block py-4 px-8 bg-[#FFB000] text-[#004225] rounded-full text-xl font-semibold transition-all duration-300 hover:bg-[#FFCF9D] hover:-translate-y-0.5 hover:shadow-[0_5px_20px_rgba(255,176,0,0.5)] no-underline"
              >
                Configure Charity Information
              </a>
            </div>
          </section>

          {/* Charity Info Summary */}
          <section className="py-16 px-8 bg-[#F5F5DC]">
            <div className="max-w-[900px] mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-[#004225] mb-6">
                  Your Charity Profile
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">Address</h3>
                    <p className="text-gray-700">{currentCharity.address}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">Description</h3>
                    <p className="text-gray-700">{currentCharity.description || "No description provided"}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">Contact</h3>
                    <p className="text-gray-700">{currentCharity.contact}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">Website</h3>
                    <a 
                      href={currentCharity.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#FFB000] hover:text-[#FFCF9D] underline"
                    >
                      {currentCharity.website}
                    </a>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-2">Current Needs</h3>
                    <div className="flex gap-3 flex-wrap">
                      <span className={`py-2 px-4 rounded-lg font-medium ${
                        currentCharity.needs_volunteers 
                          ? "bg-green-100 text-green-800 border-2 border-green-500" 
                          : "bg-gray-100 text-gray-600 border-2 border-gray-300"
                      }`}>
                        {currentCharity.needs_volunteers ? "✓ Needs Volunteers" : "Not Seeking Volunteers"}
                      </span>
                      <span className={`py-2 px-4 rounded-lg font-medium ${
                        currentCharity.needs_donations 
                          ? "bg-green-100 text-green-800 border-2 border-green-500" 
                          : "bg-gray-100 text-gray-600 border-2 border-gray-300"
                      }`}>
                        {currentCharity.needs_donations ? "✓ Needs Donations" : "Not Seeking Donations"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <a
                      href={`/charities/${currentCharity.id}`}
                      className="inline-block py-2 px-5 bg-[#004225] text-white rounded-lg font-medium transition-all duration-300 hover:bg-[#003319] no-underline"
                    >
                      View Public Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // Render public home page if not logged in
  return (
    <>
      <Navbar />
      <div>
        {/* Hero Section: Zip Code Search */}
        <section className="min-h-screen flex flex-col justify-center items-center bg-[#004225] py-16 px-8 relative overflow-hidden">
          <div className="relative z-10 max-w-[700px] w-full text-center animate-[fadeInUp_0.8s_ease-out]">
            <h1 className="text-6xl md:text-5xl sm:text-4xl font-extrabold text-[#FFB000] mb-6 tracking-wider drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
              NeverHungry
            </h1>
            <h2 className="text-5xl md:text-4xl sm:text-3xl font-bold text-[#F5F5DC] mb-4 tracking-tight">
              Find Local Charities
            </h2>
            <p className="text-xl md:text-lg sm:text-base text-[#FFCF9D] mb-12 font-light">
              Discover charities in your area and make a difference in your
              community
            </p>

            <div className="w-full max-w-[600px] mx-auto">
              <form
                className="flex gap-4 bg-[#F5F5DC] p-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] transition-all duration-300 focus-within:shadow-[0_15px_50px_rgba(255,176,0,0.3)] focus-within:-translate-y-0.5 md:flex-col md:rounded-2xl md:gap-2"
                onSubmit={handleZipCodeSearch}
              >
                <input
                  type="text"
                  className="flex-1 border-none outline-none py-4 px-6 text-lg rounded-full text-[#004225] bg-[#F5F5DC] placeholder:text-gray-600 md:rounded-xl md:w-full"
                  placeholder="Enter your zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={5}
                />
                <button
                  type="submit"
                  className="py-4 px-10 bg-[#FFB000] text-[#004225] border-none rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-[0_5px_20px_rgba(255,176,0,0.5)] hover:bg-[#FFCF9D] disabled:opacity-60 disabled:cursor-not-allowed md:rounded-xl md:w-full"
                  disabled={isSearching}
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </form>

              {searchError && (
                <div className="bg-[#F5F5DC] text-[#d32f2f] py-4 px-6 rounded-lg mt-4 font-medium border-2 border-[#FFB000]">
                  {searchError}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-8 w-full max-w-[800px]">
                  <h3 className="text-white text-xl mb-6 font-medium">
                    Found {searchResults.length}{" "}
                    {searchResults.length === 1 ? "charity" : "charities"}
                  </h3>
                  <ul className="list-none grid gap-4">
                    {searchResults.map((charity, index) => (
                      <li
                        key={charity.id}
                        className="bg-white p-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] animate-[fadeInUp_0.5s_ease-out_backwards]"
                        style={{
                          animationDelay: `${(index + 1) * 0.1}s`,
                        }}
                      >
                        <h4 className="text-2xl text-[#004225] mb-2 font-semibold">
                          {charity.name}
                        </h4>
                        <p className="text-gray-600 mb-3 text-[0.95rem]">
                          {charity.address}
                        </p>
                        {charity.description && (
                          <p className="text-gray-800 leading-relaxed mt-3">
                            {charity.description}
                          </p>
                        )}
                        {charity.contact && (
                          <p className="text-gray-800 leading-relaxed mt-3">
                            <strong>Contact:</strong> {charity.contact}
                          </p>
                        )}
                        {charity.website && (
                          <p className="text-gray-800 leading-relaxed mt-3">
                            <strong>Website:</strong>{" "}
                            <a
                              href={charity.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#004225] underline"
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
        <section className="min-h-[50vh] flex flex-col justify-center items-center py-20 px-8 bg-[#F5F5DC] md:py-12 md:px-6">
          <div className="max-w-[700px] w-full text-center">
            <h2 className="text-4xl md:text-3xl text-[#004225] mb-4 font-bold">
              Are you a charity?
            </h2>
            <p className="text-lg text-[#004225] mb-10 leading-relaxed opacity-80">
              Register or log in to connect with volunteers and donors in your
              community
            </p>
            <div className="flex gap-6 justify-center flex-wrap md:flex-col md:items-stretch">
              <button
                className="py-4 px-10 text-lg font-semibold border-none rounded-lg cursor-pointer transition-all duration-300 min-w-[180px] bg-[#FFB000] text-[#004225] shadow-[0_4px_15px_rgba(255,176,0,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(255,176,0,0.4)] hover:bg-[#FFCF9D] md:w-full"
                onClick={() => (window.location.href = "/charities/new")}
              >
                Register as Charity
              </button>
              <button
                className="py-4 px-10 text-lg font-semibold rounded-lg cursor-pointer transition-all duration-300 min-w-[180px] bg-[#F5F5DC] text-[#004225] border-2 border-[#004225] hover:bg-[#004225] hover:text-[#F5F5DC] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,66,37,0.3)] md:w-full"
                onClick={() => (window.location.href = "/charities/login")}
              >
                Log In
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}