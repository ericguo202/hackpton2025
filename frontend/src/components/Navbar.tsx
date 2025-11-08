import { useState, useEffect } from 'react';

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
        // You'll need to add this endpoint to your backend
        const response = await fetch('http://localhost:8000/charities/me', {
          method: 'GET',
          credentials: 'include', // Send cookies
        });

        if (response.ok) {
          const data = await response.json();
          setCharity(data);
        } else {
          setCharity(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setCharity(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // You'll need to add this endpoint to your backend
      await fetch('http://localhost:8000/charities/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setCharity(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6'
    }}>
      {/* Website Name */}
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        <a href="/" style={{ textDecoration: 'none', color: '#333' }}>
          NeverHungry.org
        </a>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {isLoading ? (
          <span>Loading...</span>
        ) : charity ? (
          // Logged in state
          <>
            <span style={{ fontWeight: '500' }}>
              Welcome, {charity.name}
            </span>
            <button 
              onClick={handleLogout}
              style={{ 
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          // Not logged in state
          <>
            <a href="/charities/login" style={{ textDecoration: 'none', color: '#007bff' }}>
              Login
            </a>
            <a href="/charities/new" style={{ textDecoration: 'none', color: '#007bff' }}>
              Register Your Charity
            </a>
          </>
        )}
      </div>
    </nav>
  );
}