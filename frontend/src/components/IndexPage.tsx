import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Navbar from "@/components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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
  geojson: {
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
    properties: any;
  };
}

export default function IndexPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Fetch charities data
  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charities`);
        if (!response.ok) {
          throw new Error("Failed to fetch charities");
        }
        const data: Charity[] = await response.json();
        setCharities(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharities();
  }, []);

  // Initialize map and add markers
  useEffect(() => {
    if (!mapContainer.current || isLoading || error || charities.length === 0) {
      return;
    }

    if (!MAPBOX_TOKEN) {
      setError("Mapbox token not found. Please set VITE_MAPBOX_TOKEN in your .env file");
      return;
    }

    // Initialize map only once
    if (!map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Calculate center point from all charities
      const avgLng =
        charities.reduce(
          (sum, charity) => sum + charity.geojson.geometry.coordinates[0],
          0
        ) / charities.length;
      const avgLat =
        charities.reduce(
          (sum, charity) => sum + charity.geojson.geometry.coordinates[1],
          0
        ) / charities.length;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [avgLng, avgLat],
        zoom: 9,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add markers for each charity
      charities.forEach((charity) => {
        if (!charity.geojson?.geometry?.coordinates) {
          console.warn(`Charity ${charity.id} missing coordinates`);
          return;
        }

        const [lng, lat] = charity.geojson.geometry.coordinates;

        // Create popup content
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #004225;">
              ${charity.name}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
              ${charity.address}
            </p>
            ${charity.description ? `
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #333; max-height: 60px; overflow: hidden;">
                ${charity.description.substring(0, 100)}${charity.description.length > 100 ? "..." : ""}
              </p>
            ` : ""}
            <div style="margin-bottom: 8px;">
              ${charity.needs_volunteers ? `
                <span style="display: inline-block; padding: 4px 8px; background: #FFCF9D; border: 1px solid #FFB000; border-radius: 4px; font-size: 11px; margin-right: 4px; margin-bottom: 4px;">
                  Needs Volunteers
                </span>
              ` : ""}
              ${charity.needs_donations ? `
                <span style="display: inline-block; padding: 4px 8px; background: #FFCF9D; border: 1px solid #FFB000; border-radius: 4px; font-size: 11px; margin-bottom: 4px;">
                  Needs Donations
                </span>
              ` : ""}
            </div>
            <a 
              href="/charities/${charity.id}" 
              style="display: inline-block; padding: 6px 12px; background: #FFB000; color: #004225; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; transition: background 0.2s;"
              onmouseover="this.style.background='#FFCF9D'"
              onmouseout="this.style.background='#FFB000'"
            >
              View Details →
            </a>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(popupContent);

        // Create marker and add to map (popup opens on click by default)
        new mapboxgl.Marker({ color: "#FFB000" })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [charities, isLoading, error]);

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 80px)", backgroundColor: "#F5F5DC" }}>
        {/* Header Section */}
        <div
          style={{
            backgroundColor: "#004225",
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "#FFB000",
              margin: "0 0 0.5rem 0",
            }}
          >
            Find Charities Near You
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#F5F5DC",
              margin: 0,
            }}
          >
            Click on any marker to learn more about a charity
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <p style={{ fontSize: "1.2rem", color: "#004225" }}>
              Loading charities...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              maxWidth: "600px",
              margin: "2rem auto",
              padding: "1.5rem",
              backgroundColor: "#F5F5DC",
              border: "2px solid #FFB000",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#d32f2f", marginBottom: "0.5rem" }}>Error</h2>
            <p style={{ color: "#d32f2f", fontWeight: "600" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#FFB000",
                color: "#004225",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Map Container */}
        {!isLoading && !error && (
          <div
            style={{
              padding: "1.5rem",
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            <div
              ref={mapContainer}
              style={{
                width: "100%",
                height: "calc(100vh - 280px)",
                minHeight: "500px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "2px solid #004225",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

