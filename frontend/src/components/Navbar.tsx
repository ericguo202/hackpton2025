import { useState, useEffect } from "react";

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

export default function Navbar() {
  const [charity, setCharity] = useState<Charity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by trying to fetch current session
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charities/me`, {
          method: "GET",
          credentials: "include", // Send cookies
        });

        if (response.ok) {
          const data = await response.json();
          setCharity(data);
        } else {
          setCharity(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCharity(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/charities/logout`, {
        method: "POST",
        credentials: "include",
      });
      setCharity(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="flex justify-between items-center py-4 px-8 bg-[#F5F5DC] border-b-2 border-[#004225]">
      {/* Website Name */}
      <div className="text-2xl font-bold">
        <a
          href="/"
          className="no-underline text-[#004225] hover:text-[#FFB000] transition-colors duration-300"
        >
          NeverHungry.org
        </a>
      </div>

      {/* Navigation Links */}
      <div className="flex gap-6 items-center">
        {isLoading ? (
          <span className="text-[#004225]">Loading...</span>
        ) : charity ? (
          // Logged in state
          <>
            <span className="font-medium text-[#004225]">
              Welcome, {charity.name}
            </span>
            <button
              onClick={handleLogout}
              className="cursor-pointer py-2 px-4 bg-[#FFB000] text-[#004225] border-none rounded-lg font-semibold transition-all duration-300 hover:bg-[#FFCF9D] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,176,0,0.3)]"
            >
              Log Out
            </button>
          </>
        ) : (
          // Not logged in state
          <>
            <a
              href="/charities/login"
              className="no-underline text-[#004225] font-medium hover:text-[#FFB000] transition-colors duration-300"
            >
              Login
            </a>
            <a
              href="/charities/new"
              className="no-underline text-[#004225] font-medium hover:text-[#FFB000] transition-colors duration-300"
            >
              Register Your Charity
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
