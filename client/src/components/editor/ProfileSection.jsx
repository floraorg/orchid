import { LogIn, LogOut } from "lucide-react";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import LoginModal from "./LoginModal";

const ProfileSection = () => {
  const { user, logout, loading } = useAuth();
  const [imageError, setImageError] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!user?.name) return "";
    return user.name[0];
  }, [user?.name]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsLoggingOut(false);
  };

  React.useEffect(() => {
    setImageError(false);
  }, [user?.name]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center">
        <div className="flex gap-5 flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-neutral-300 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="flex gap-5 flex-col items-center">
        {user ? (
          <div className="flex flex-col items-center gap-5">
            {imageError ? (
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-500 text-white text-sm">
                {initials}
              </div>
            ) : (
              <img
                src={`https://sakura.rex.wf/linear/${user.name}?text=${initials.toUpperCase()}`}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
                onError={handleImageError}
              />
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-neutral-900 hover:text-violet-600 transition-colors flex flex-col items-center gap-1">
              <LogOut size={20} className={isLoggingOut ? "opacity-50" : ""} />
              <span className="text-xs">
                {isLoggingOut ? "Signing out..." : "Logout"}
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="group flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
              <LogIn
                size={16}
                className="text-violet-500 group-hover:text-white"
              />
            </div>
            <span className="text-xs text-neutral-900 group-hover:text-violet-400 transition-colors">
              Login
            </span>
          </button>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default ProfileSection;
