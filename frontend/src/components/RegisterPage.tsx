import { useState, type FormEvent } from 'react';
import Navbar from "@/components/Navbar";

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
  // Uses useState to store the form data
  const [formData, setFormData] = useState<RegisterFormData>({
    // initializes formData with empty fields
    username: '',
    password: '',
    name: '',
    address: '',
    description: '',
    website: '',
    contact: '',
  });

  // stores an error message string or null if none
  const [error, setError] = useState<string | null>(null);
  // boolean indicating if a registration request is in progress
  const [isLoading, setIsLoading] = useState(false);

  // URL validation regex pattern
  const urlRegex = /^https?:\/\/.+/;

  // when there is a change event to the input field, it updates the form data
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // gets the name and value of the input field that triggered the event
    const { name, value } = e.target;
    // updates formData by merging the previous state with the new value using the name as the key
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevents the default form submission behavior in order to have client-side validation
    setError(null); // clears any previous error messages

    // Client-side validation
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // if empty
    if (formData.name.length == 0) {
      setError('Name is required');
      return;
    }

    // if empty
    if (formData.address.length == 0) {
      setError('Address is required');
      return;
    }

    if (formData.description.length == 0) {
      setError('Description is required');
      return;
    }

    if (formData.website.length == 0) {
      setError('Website is required');
      return;
    }

    // tests if the website url matches the regex pattern
    if (!urlRegex.test(formData.website)) {
      setError('Website must be a valid URL (starting with http:// or https://)');
      return;
    }

    // sets isLoading to true to indicate that a registration request is in progress
    setIsLoading(true);

    try {
      // sends a POST request to the charities endpoint with the form data
      const response = await fetch('http://localhost:8000/charities', {
        method: 'POST',
        headers: {
          // set headers to send JSON data
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: allows cookies to be sent/received
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          address: formData.address,
          description: formData.description,
          website: formData.website,
          contact: formData.contact || '', // Send empty string if not provided
        }),
      });

      // error messages
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          setError(errorData.detail || 'Invalid form data. Please check your inputs.');
        } else if (response.status === 409) {
          setError('Username already exists. Please choose a different username.');
        } else {
          setError('Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Registration successful - redirect to login page
      window.location.href = '/charities/login';
    } catch (err) {
      setError('Network error. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div>
      <h1>Charity Registration</h1>

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

        <div>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Streetname, City, State Zipcode"
            required
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="contact">Contact</label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
          />
        </div>

        {error && <div>{error}</div>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
    </>
  );
}