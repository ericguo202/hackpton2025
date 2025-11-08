import { useEffect, useState } from "react";
import LoginPage from "@/components/LoginPage";
import Home from "@/components/Home";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Listen for popstate events (back/forward buttons)
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Route based on current path
  if (currentPath === "/charities/login") {
    return <LoginPage />;
  }

  // Default to Home page
  return <Home />;
}
