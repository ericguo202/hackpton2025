import { useState, useEffect, useRef, type FormEvent } from "react";
import Navbar from "@/components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RegisterFormData {
  username: string;
  password: string;
  name: string;
  address: string;
  description: string;
  website: string;
  contact: string;
}

interface AddressSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    password: "",
    name: "",
    address: "",
    description: "",
    website: "",
    contact: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce timer
  const debounceTimerRef = useRef<number | null>(null);

  // Fetch address suggestions from backend
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "5",
      });

      if (sessionToken) {
        params.append("session_token", sessionToken);
      }

      const response = await fetch(`${API_BASE_URL}/api/suggest?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch address suggestions");
        setAddressSuggestions([]);
        return;
      }

      const data = await response.json();
      
      // Store the session token returned by the backend
      if (data._session_token) {
        setSessionToken(data._session_token);
      }

      const suggestions: AddressSuggestion[] = data.suggestions || [];
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (err) {
      console.error("Error fetching address suggestions:", err);
      setAddressSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle address input change with debouncing
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      address: value,
    }));

    if (error) setError(null);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    setIsLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        session_token: sessionToken,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/retrieve/${suggestion.mapbox_id}?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to retrieve address details");
        return;
      }

      const data = await response.json();
      const feature = data.features?.[0];

      if (feature) {
        // Use the full formatted address
        const fullAddress = 
          feature.properties?.full_address || 
          feature.properties?.place_formatted || 
          suggestion.full_address ||
          suggestion.place_formatted ||
          suggestion.name;

        setFormData((prev) => ({
          ...prev,
          address: fullAddress,
        }));
      }
    } catch (err) {
      console.error("Error retrieving address details:", err);
    } finally {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError("Username must be between 3 and 30 characters");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.name.length === 0) {
      setError("Charity name is required");
      return;
    }

    if (formData.address.length < 5) {
      setError("Address must be at least 5 characters");
      return;
    }

    if (formData.contact.length < 5) {
      setError("Contact information must be at least 5 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/charities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          address: formData.address,
          description: formData.description || "",
          website: formData.website || "",
          contact: formData.contact,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          setError(
            errorData.detail || "Invalid form data. Please check your inputs."
          );
        } else {
          setError("Registration failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Registration successful - redirect to login page
      window.location.href = "/charities/login";
    } catch (err) {
      setError("Network error. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F5F5DC] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-[#004225] mb-2 text-center">
              Register Your Charity
            </h1>
            <p className="text-[#004225] opacity-80 text-center mb-8">
              Join NeverHunger and connect with volunteers and donors
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Username <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                  placeholder="Choose a username (3-30 characters)"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Charity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                  placeholder="Your charity's name"
                />
              </div>

              {/* Address field with autocomplete */}
              <div className="relative">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Start typing your address..."
                  required
                  minLength={5}
                  autoComplete="off"
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                />

                {/* Suggestions dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border-2 border-[#004225] rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.mapbox_id || index}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="px-4 py-3 hover:bg-[#F5F5DC] cursor-pointer border-b border-[#004225] border-opacity-20 last:border-b-0 transition-colors"
                      >
                        <div className="text-[#004225] font-medium">
                          {suggestion.name}
                        </div>
                        {(suggestion.full_address || suggestion.place_formatted) && (
                          <div className="text-[#004225] text-sm opacity-70 mt-1">
                            {suggestion.full_address || suggestion.place_formatted}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading indicator */}
                {isLoadingSuggestions && (
                  <div className="absolute right-3 top-10 text-[#FFB000]">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Contact <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  minLength={5}
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                  placeholder="Email or phone number"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC] resize-none"
                  placeholder="Tell us about your charity (optional)"
                />
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com (optional)"
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                />
              </div>

              {error && (
                <div className="bg-[#F5F5DC] text-[#d32f2f] py-3 px-4 rounded-lg border-2 border-[#FFB000] font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-[#FFB000] text-[#004225] rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-[#FFCF9D] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,176,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? "Registering..." : "Register"}
              </button>

              <p className="text-center text-sm text-[#004225] opacity-70">
                Already have an account?{" "}
                <a
                  href="/charities/login"
                  className="text-[#FFB000] hover:text-[#FFCF9D] font-medium underline"
                >
                  Log in here
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}