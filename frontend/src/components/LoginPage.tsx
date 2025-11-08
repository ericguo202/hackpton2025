import { useState, type FormEvent } from 'react';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use relative URL since FastAPI serves the frontend
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/charities/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: allows cookies to be sent/received
        redirect: 'manual', // Don't automatically follow redirects
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
  
      // Check for redirect response (303)
      if (response.type === 'opaqueredirect' || response.status === 303) {
        // The backend set the cookie and wants to redirect
        // Get the redirect location from the response
        const location = response.headers.get('Location');
        if (location) {
          window.location.href = location;
        } else {
          // Fallback: just reload the page, the cookie is set
          window.location.href = '/';
        }
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          setError('Charity not found');
        } else if (response.status === 401) {
          setError('Invalid username or password');
        } else {
          setError('Login failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Charity Login</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={30}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        {error && <div>{error}</div>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}