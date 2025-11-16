import axios from "axios";

// Set the base URL for all axios requests
// For production deployment on Vercel
const getBaseURL = () => {
  // If running on Vercel production (check window.location)
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return "https://backend-38w5dq9mo-karuppaiyas-projects-9a0989eb.vercel.app";
  }
  
  // Try to get from environment variable
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) {
    // Clean the URL to remove any BOM characters, line breaks, or extra whitespace
    return envURL.replace(/[\uFEFF\r\n\t]/g, "").trim();
  }
  
  // Default to localhost for development
  return "http://localhost:4000";
};

const baseURL = getBaseURL();
console.log("🔧 Axios Base URL:", baseURL);

axios.defaults.baseURL = baseURL;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(
      "📡 API Request:",
      config.method?.toUpperCase(),
      config.baseURL + config.url
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.config?.url,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

export default axios;
