import { useState, useEffect, type FormEvent } from 'react';
import Navbar from "@/components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    name: '',
    description: '',
    website: '',
    contact: '',
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
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('You must be logged in to edit your charity profile');
            window.location.href = '/charities/login';
          } else {
            setError('Failed to load charity data');
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
        setError('Network error. Please check your connection.');
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
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
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
      setError('Name is required');
      return;
    }

    if (formData.description.length === 0) {
      setError('Description is required');
      return;
    }

    if (formData.website.length === 0) {
      setError('Website is required');
      return;
    }

    if (!urlRegex.test(formData.website)) {
      setError('Website must be a valid URL (starting with http:// or https://)');
      return;
    }

    if (formData.contact.length < 5) {
      setError('Contact must be at least 5 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (!charity) {
        setError('Charity data not loaded');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/charities/${charity.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          setError(errorData.detail || 'Invalid form data. Please check your inputs.');
        } else if (response.status === 401 || response.status === 405) {
          setError('You are not authorized to edit this charity. Please log in again.');
          setTimeout(() => {
            window.location.href = '/charities/login';
          }, 2000);
        } else if (response.status === 404) {
          setError('Charity not found');
        } else {
          setError('Update failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Update successful
      const updatedCharity: Charity = await response.json();
      setCharity(updatedCharity);
      setSuccessMessage('✅ Charity profile updated successfully!');
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Network error. Please check your connection.');
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
        method: 'DELETE',
        credentials: 'include',
      });
  
      if (!response.ok) {
        if (response.status === 401 || response.status === 405) {
          setError('You are not authorized to delete this charity.');
        } else if (response.status === 404) {
          setError('Charity not found');
        } else {
          setError('Failed to delete account. Please try again.');
        }
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }
  
      // Deletion successful - redirect to home
      alert('Your account has been successfully deleted.');
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please check your connection.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state while fetching data
  if (isFetching) {
    return (
      <>
        <Navbar />
        <div>
          <p>Loading your charity information...</p>
        </div>
      </>
    );
  }

  // Show error if data couldn't be loaded
  if (!charity && error) {
    return (
      <>
        <Navbar />
        <div>
          <div className="error-message">
            <p>{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div>
        <h1>Edit Charity Profile</h1>
        <p>Update your charity's information</p>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Display current address (read-only) */}
          <div>
            <label>Current Address (cannot be changed)</label>
            <p>{charity?.address}</p>
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="name">Charity Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
            />
          </div>

          {/* Website Field */}
          <div>
            <label htmlFor="website">Website *</label>
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

          {/* Contact Field */}
          <div>
            <label htmlFor="contact">Contact Information *</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="Email or phone number"
              required
              minLength={5}
            />
          </div>

          {/* Boolean Fields Section */}
          <div>
            <h3>What does your charity need?</h3>

            {/* Needs Volunteers Checkbox */}
            <div>
              <input
                type="checkbox"
                id="needs_volunteers"
                name="needs_volunteers"
                checked={formData.needs_volunteers}
                onChange={handleChange}
              />
              <label htmlFor="needs_volunteers">
                We need volunteers
              </label>
            </div>

            {/* Needs Donations Checkbox */}
            <div>
              <input
                type="checkbox"
                id="needs_donations"
                name="needs_donations"
                checked={formData.needs_donations}
                onChange={handleChange}
              />
              <label htmlFor="needs_donations">
                We need donations
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>

          {/* Cancel/Back Button */}
          <button
            type="button"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
        </form>
            {/* Delete Account Section */}
        <div>
            <h2>Danger Zone</h2>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
  
            {!showDeleteConfirm ? (
            <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
            >
            Delete Account
            </button>
            ) : (
            <div>
                <p><strong>Are you sure you want to delete your account?</strong></p>
                <p>This action cannot be undone.</p>
                <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
            >
            {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
            <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
            >
            Cancel
            </button>
            </div>
    )}
    </div>
    </div>
    </>
  );
}