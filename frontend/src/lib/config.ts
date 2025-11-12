// Compute the API base URL at runtime in a robust way.
// Behavior:
// - If VITE_API_URL is an absolute URL (http(s)://...) use it as-is.
// - If it's a relative path (starts with "/"), prefix it with the current origin.
// - If it's empty/undefined, default to the current origin.
const _env = (import.meta as any).env || {};
const _viteApi = _env.VITE_API_URL;

export const API_BASE_URL = (() => {
  if (!_viteApi || _viteApi === "") {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  try {
    if (_viteApi.startsWith("http://") || _viteApi.startsWith("https://")) {
      return _viteApi;
    }
    if (_viteApi.startsWith("/")) {
      return (typeof window !== "undefined" ? window.location.origin : "") + _viteApi;
    }
    // Fallback: return as-is
    return _viteApi;
  } catch (e) {
    return _viteApi;
  }
})();

export default API_BASE_URL;
