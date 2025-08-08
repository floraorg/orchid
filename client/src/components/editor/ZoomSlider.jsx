import { useCallback } from "react";

export const ZoomSlider = ({ canvas, zoomLevel, onZoomChange }) => {
  const handleZoomChange = useCallback(
    (event) => {
      const newZoomLevel = Number(event.target.value);

      if (canvas) {
        const centerPoint = {
          x: canvas.width / 2,
          y: canvas.height / 2,
        };
        canvas.zoomToPoint(centerPoint, newZoomLevel / 100);
        canvas.fire('zoom:changed');
        canvas.requestRenderAll();
      }

      if (onZoomChange) {
        onZoomChange(newZoomLevel);
      }
    },
    [canvas, onZoomChange],
  );

  return (
    <div className="fixed bottom-6 box-shadow-3d left-[260px] transform -translate-x-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-neutral-200 z-50 flex items-center space-x-4">
      <span className="text-sm text-neutral-600 font-medium">Zoom</span>

      <div className="flex items-center space-x-2">
        <input
          type="range"
          min="25"
          max="200"
          step="1"
          value={zoomLevel}
          onChange={handleZoomChange}
          className="w-48 accent-violet-500 h-2 rounded-lg cursor-pointer"
        />

        <span className="text-sm text-neutral-600 font-semibold w-12 text-right">
          {zoomLevel}%
        </span>
      </div>
    </div>
  );
};

export default ZoomSlider;
