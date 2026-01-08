import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import mindstaLogo from "../assets/icons/mindsta2.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mb-6 flex justify-center items-center gap-3">
          <img src={mindstaLogo} alt="Mindsta Logo" className="w-20 h-20 rounded-xl object-contain" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Mindsta</h2>
        </div>
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
