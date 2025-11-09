import { useEffect, useState } from "react";
import LoginPage from "@/components/LoginPage";
import Home from "@/components/Home";
import RegisterPage from "@/components/RegisterPage";
import ShowPage from "@/components/ShowPage";
import EditPage from "@/components/EditPage";

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

  if (currentPath === "/charities/new") {
    return <RegisterPage />;
  }

  // Match /charities/{id}/edit pattern
  if (currentPath.match(/^\/charities\/\d+\/edit$/)) {
    return <EditPage />;
  }

  // Match /charities/{id} pattern (must come after /edit route)
  if (currentPath.match(/^\/charities\/\d+$/)) {
    return <ShowPage />;
  }

  // Default to Home page
  return <Home />;
}