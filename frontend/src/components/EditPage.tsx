import { useState, useEffect, type FormEvent } from "react";
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

interface EditFormData {
  name: string;
  description: string;
  website: string;
  contact: string;
  needs_volunteers: boolean;
  needs_donations: boolean;
}

export default function EditPage() {
  const [charity, setCharity] = useState<Charity | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    name: "",
    description: "",
    website: "",
    contact: "",
    needs_volunteers: false,
    needs_donations: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // URL validation regex pattern
  const urlRegex = /^https?:\/\/.+/;

  // Fetch current charity data on mount
  useEffect(() => {
    const fetchCurrentCharity = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charities/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("You must be logged in to edit your charity profile");
            window.location.href = "/charities/login";
          } else {
            setError("Failed to load charity data");
          }
          setIsFetching(false);
          return;
        }

        const data: Charity = await response.json();
        setCharity(data);

        // Pre-fill form with existing data
        setFormData({
          name: data.name,
          description: data.description,
          website: data.website,
          contact: data.contact,
          needs_volunteers: data.needs_volunteers,
          needs_donations: data.needs_donations,
        });
      } catch (err) {
        setError("Network error. Please check your connection.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCurrentCharity();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear messages when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (formData.name.length === 0) {
      setError("Name is required");
      return;
    }

    if (formData.description.length === 0) {
      setError("Description is required");
      return;
    }

    if (formData.website.length === 0) {
      setError("Website is required");
      return;
    }

    if (!urlRegex.test(formData.website)) {
      setError(
        "Website must be a valid URL (starting with http:// or https://)"
      );
      return;
    }

    if (formData.contact.length < 5) {
      setError("Contact must be at least 5 characters");
      return;
    }

    setIsLoading(true);

    try {
      if (!charity) {
        setError("Charity data not loaded");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/charities/${charity.id}/edit`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          setError(
            errorData.detail || "Invalid form data. Please check your inputs."
          );
        } else if (response.status === 401 || response.status === 405) {
          setError(
            "You are not authorized to edit this charity. Please log in again."
          );
          setTimeout(() => {
            window.location.href = "/charities/login";
          }, 2000);
        } else if (response.status === 404) {
          setError("Charity not found");
        } else {
          setError("Update failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Update successful
      const updatedCharity: Charity = await response.json();
      setCharity(updatedCharity);

      // Redirect to the charity's show page
      window.location.href = `/charities/${updatedCharity.id}`;
    } catch (err) {
      setError("Network error. Please check your connection.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!charity) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/charities/${charity.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 405) {
          setError("You are not authorized to delete this charity.");
        } else if (response.status === 404) {
          setError("Charity not found");
        } else {
          setError("Failed to delete account. Please try again.");
        }
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      // Deletion successful - redirect to home
      window.location.href = "/";
    } catch (err) {
      setError("Network error. Please check your connection.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state while fetching data
  if (isFetching) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F5F5DC] py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-[#004225]">
              Loading your charity information...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show error if data couldn't be loaded
  if (!charity && error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F5F5DC] py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="bg-[#F5F5DC] text-[#d32f2f] py-3 px-4 rounded-lg border-2 border-[#FFB000] font-medium">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F5F5DC] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#004225]">
            <h1 className="text-3xl font-bold text-[#004225] mb-2 text-center">
              Edit Charity Profile
            </h1>
            <p className="text-[#004225] opacity-80 text-center mb-8">
              Update your charity's information
            </p>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-[#d4edda] text-[#155724] py-3 px-4 rounded-lg border-2 border-[#28a745] font-medium mb-4">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-[#F5F5DC] text-[#d32f2f] py-3 px-4 rounded-lg border-2 border-[#FFB000] font-medium mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
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

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC] resize-none"
                  placeholder="Tell us about your charity"
                />
              </div>

              {/* Website Field */}
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                />
              </div>

              {/* Contact Field */}
              <div>
                <label
                  htmlFor="contact"
                  className="block text-sm font-medium text-[#004225] mb-1"
                >
                  Contact Information <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Email or phone number"
                  required
                  minLength={5}
                  className="w-full px-4 py-2 border-2 border-[#004225] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB000] focus:border-transparent text-[#004225] bg-[#F5F5DC]"
                />
              </div>

              {/* Boolean Fields Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#004225] mb-3">
                  What does your charity need?
                </h3>

                {/* Needs Volunteers Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="needs_volunteers"
                    name="needs_volunteers"
                    checked={formData.needs_volunteers}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#FFB000] border-2 border-[#004225] rounded focus:ring-2 focus:ring-[#FFB000] cursor-pointer"
                  />
                  <label
                    htmlFor="needs_volunteers"
                    className="ml-3 text-[#004225] font-medium cursor-pointer"
                  >
                    We need volunteers
                  </label>
                </div>

                {/* Needs Donations Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="needs_donations"
                    name="needs_donations"
                    checked={formData.needs_donations}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#FFB000] border-2 border-[#004225] rounded focus:ring-2 focus:ring-[#FFB000] cursor-pointer"
                  />
                  <label
                    htmlFor="needs_donations"
                    className="ml-3 text-[#004225] font-medium cursor-pointer"
                  >
                    We need donations
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-[#FFB000] text-[#004225] rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-[#FFCF9D] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,176,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>

              {/* Cancel/Back Button */}
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-full py-3 px-6 bg-[#F5F5DC] text-[#004225] border-2 border-[#004225] rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-[#004225] hover:text-[#F5F5DC] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,66,37,0.3)]"
              >
                Cancel
              </button>
            </form>

            {/* Delete Account Section */}
            <div className="mt-8 pt-8 border-t-2 border-[#004225]">
              <h2 className="text-2xl font-bold text-[#d32f2f] mb-2">
                Account Deletion
              </h2>
              <p className="text-[#004225] opacity-80 mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2 px-4 bg-[#d32f2f] text-white rounded-lg font-semibold transition-all duration-300 hover:bg-[#b71c1c] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(211,47,47,0.3)]"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#004225] font-semibold">
                    <strong>
                      Are you sure you want to delete your account?
                    </strong>
                  </p>
                  <p className="text-[#004225] opacity-80">
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="py-2 px-4 bg-[#d32f2f] text-white rounded-lg font-semibold transition-all duration-300 hover:bg-[#b71c1c] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(211,47,47,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="py-2 px-4 bg-[#F5F5DC] text-[#004225] border-2 border-[#004225] rounded-lg font-semibold transition-all duration-300 hover:bg-[#004225] hover:text-[#F5F5DC] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
