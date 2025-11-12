import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { API_BASE_URL } from "@/lib/config";

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
                Need volunteers or donations? Keep your charity information up
                to date.
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
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">
                      Address
                    </h3>
                    <p className="text-gray-700">{currentCharity.address}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">
                      Description
                    </h3>
                    <p className="text-gray-700">
                      {currentCharity.description || "No description provided"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">
                      Contact
                    </h3>
                    <p className="text-gray-700">{currentCharity.contact}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#004225] mb-1">
                      Website
                    </h3>
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
                    <h3 className="text-lg font-semibold text-[#004225] mb-2">
                      Current Needs
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      <span
                        className={`py-2 px-4 rounded-lg font-medium ${
                          currentCharity.needs_volunteers
                            ? "bg-green-100 text-green-800 border-2 border-green-500"
                            : "bg-gray-100 text-gray-600 border-2 border-gray-300"
                        }`}
                      >
                        {currentCharity.needs_volunteers
                          ? "✓ Needs Volunteers"
                          : "Not Seeking Volunteers"}
                      </span>
                      <span
                        className={`py-2 px-4 rounded-lg font-medium ${
                          currentCharity.needs_donations
                            ? "bg-green-100 text-green-800 border-2 border-green-500"
                            : "bg-gray-100 text-gray-600 border-2 border-gray-300"
                        }`}
                      >
                        {currentCharity.needs_donations
                          ? "✓ Needs Donations"
                          : "Not Seeking Donations"}
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
        {/* Hero Section: Food Assistance */}
        <section className="min-h-screen flex flex-col justify-center items-center bg-[#004225] py-16 px-8 relative overflow-hidden">
          <div className="relative z-10 max-w-[900px] w-full text-center animate-[fadeInUp_0.8s_ease-out]">
            <h1 className="text-6xl md:text-5xl sm:text-4xl font-extrabold text-[#FFB000] mb-6 tracking-wider drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
              Need Food Assistance?
            </h1>
            <h2 className="text-4xl md:text-3xl sm:text-2xl font-bold text-[#F5F5DC] mb-4 tracking-tight">
              Find Food Banks & Charities Near You
            </h2>
            <p className="text-xl md:text-lg sm:text-base text-[#FFCF9D] mb-12 font-light">
              Access local food resources and support services in your community
            </p>

            {/* Call to Action Button */}
            <div className="flex flex-col items-center gap-6">
              <a
                href="/charities/index"
                className="inline-block py-6 px-12 bg-[#FFB000] text-[#004225] rounded-full text-2xl font-bold transition-all duration-300 hover:bg-[#FFCF9D] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,176,0,0.5)] no-underline shadow-[0_6px_25px_rgba(255,176,0,0.4)]"
              >
                Find Food Resources
              </a>
              <p className="text-[#F5F5DC] text-lg opacity-90">
                Search for food banks, pantries, and assistance programs by location
              </p>
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

        {/* Volunteer/Donor Section */}
        <section className="min-h-[50vh] flex flex-col justify-center items-center py-20 px-8 bg-[#004225] md:py-12 md:px-6">
          <div className="max-w-[700px] w-full text-center">
            <h2 className="text-4xl md:text-3xl text-[#FFB000] mb-4 font-bold">
              Want to Help?
            </h2>
            <p className="text-lg text-[#F5F5DC] mb-10 leading-relaxed opacity-90">
              Find charities that need volunteers or donations and make a
              difference in your community
            </p>
            <a
              href="/volunteer-dashboard"
              className="inline-block py-4 px-10 text-lg font-semibold border-none rounded-lg cursor-pointer transition-all duration-300 min-w-[200px] bg-[#FFB000] text-[#004225] shadow-[0_4px_15px_rgba(255,176,0,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(255,176,0,0.4)] hover:bg-[#FFCF9D] no-underline md:w-full"
            >
              View Volunteer Dashboard
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
