import { FabricImage } from "fabric";
import { AlertTriangle, Loader2, X } from "lucide-react";
import React from "react";
import { API_URL } from "../../utils/fetchConfig";
import ImageLoader from "../../utils/ImageLoader";
const { getFullQualityUrl } = ImageLoader;

export default function BackgroundRemovalModal({ isOpen, onClose, canvas }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [shouldCrop, setShouldCrop] = React.useState(false);

  const handleRemoveBackground = async () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || !canvas) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dataURL = activeObject.toDataURL();
      const blob = await (await fetch(dataURL)).blob();

      const formData = new FormData();
      formData.append("image", blob, "image.png");

      const response = await fetch(
        `${API_URL}/api/remove-background?crop=${shouldCrop}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      if (response.status === 429) {
        throw new Error(
          "You can only remove background once per minute. Please try again later.",
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove background");
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to remove background");
      }

      const currentAngle = activeObject.angle || 0;
      const currentScaleX = activeObject.scaleX || 1;
      const currentScaleY = activeObject.scaleY || 1;
      const flipX = activeObject.flipX;
      const flipY = activeObject.flipY;

      const imageUrl = getFullQualityUrl(data.image_path);
      const img = await FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      });

      const imgProps = {
        left: activeObject.left,
        top: activeObject.top,
        angle: currentAngle,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        flipX: flipX,
        flipY: flipY,
      };

      if (!shouldCrop) {
        imgProps.width = activeObject.width;
        imgProps.height = activeObject.height;
      }

      img.set(imgProps);

      canvas.remove(activeObject);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      onClose();
    } catch (err) {
      const errorMessage =
        err.message || "An error occurred while removing the background";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isRateLimit = error?.includes("once per minute");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-neutral-200 rounded-xl shadow-xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-violet-600 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">
            Remove Background
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Select an image first, then click remove background
          </p>
        </div>

        {error && (
          <div
            className={`mb-4 sm:mb-6 p-4 rounded-lg ${isRateLimit ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 ${isRateLimit ? "text-amber-500" : "text-red-500"}`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${isRateLimit ? "text-amber-800" : "text-red-800"}`}>
                  {isRateLimit ? "Rate Limit Reached" : "Error"}
                </p>
                <p
                  className={`mt-1 text-sm ${isRateLimit ? "text-amber-700" : "text-red-700"}`}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <label className="flex items-center justify-between p-4 rounded-lg bg-neutral-300/80 cursor-pointer group transition-colors hover:bg-gray-300/50">
            <span className="text-sm font-medium text-neutral-600">
              Crop to content
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={shouldCrop}
                onChange={(e) => setShouldCrop(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 rounded-full bg-gray-200 dark:bg-neutral-500 peer-checked:bg-violet-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4"></div>
            </div>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg font-medium bg-neutral-300/80 text-gray-600 hover:bg-neutral-300/50 transition-colors">
            Cancel
          </button>

          <button
            onClick={handleRemoveBackground}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Remove Background"
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          Note: Processed image will expire in 10 minutes on our server.
        </p>
      </div>
    </div>
  );
}
