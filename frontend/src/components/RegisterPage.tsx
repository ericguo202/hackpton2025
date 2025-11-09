import { useState, type FormEvent } from "react";
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
              Join NeverHungry and connect with volunteers and donors
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

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, City, State ZIP"
                  required
                  minLength={5}
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                />
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
