import {X} from "lucide-react";
import React from "react";
import {useAuth} from "../contexts/AuthContext";
import {apiFetch} from "../utils/fetchConfig";

export default function LoginModal({isOpen, onClose}) {
  const [authUrls, setAuthUrls] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const {checkAuth} = useAuth();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const authCheckInterval = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      apiFetch("/api/auth/urls")
        .then((data) => {
          setAuthUrls(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Listen for successful auth in a popup window
  const handleAuth = (provider) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const authWindow = window.open(authUrls[provider], "Auth", `width=${width},height=${height},left=${left},top=${top}`);

    setIsAuthenticating(true);

    // Check periodically if auth was successful
    authCheckInterval.current = setInterval(async () => {
      try {
        if (authWindow.closed) {
          await checkAuth();
          clearInterval(authCheckInterval.current);
          setIsAuthenticating(false);
          onClose();
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    }, 500);
  };

  React.useEffect(() => {
    return () => {
      if (authCheckInterval.current) {
        clearInterval(authCheckInterval.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  if (isAuthenticating) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-xl p-8 m-4 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4 transform transition-all">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome!</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to continue</p>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="mt-8 text-center text-red-500">Error: {error}</div>
        ) : (
          <div className="mt-8 space-y-4">
            <button onClick={() => handleAuth("google")} className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button onClick={() => handleAuth("github")} className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Continue with GitHub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
