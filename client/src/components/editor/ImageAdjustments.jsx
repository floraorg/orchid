import { filters } from "fabric";
import {
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  RotateCw,
  Sliders,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const ImageAdjustments = ({ canvas }) => {
  const [activeObject, setActiveObject] = useState(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  });

  const handleSelection = useCallback(() => {
    const selected = canvas.getActiveObject();
    if (selected && selected.type === "image") {
      setActiveObject(selected);
      setAdjustments({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
      });
    } else {
      setActiveObject(null);
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    const selectionEvents = [
      "selection:created",
      "selection:cleared",
      "selection:updated",
    ];

    selectionEvents.forEach((event) => {
      canvas.on(event, handleSelection);
    });

    handleSelection();

    return () => {
      selectionEvents.forEach((event) => {
        canvas.off(event, handleSelection);
      });
    };
  }, [canvas, handleSelection]);

  const applyFilter = useCallback(
    (filterType, value) => {
      if (!activeObject || !canvas) return;

      setAdjustments((prev) => ({ ...prev, [filterType]: value }));

      requestAnimationFrame(() => {
        const currentFilters = activeObject.filters || [];
        const newFilters = currentFilters.filter(
          (f) =>
            !["Blur", "Brightness", "Contrast", "Saturation"].some(
              (type) => f instanceof filters[type],
            ),
        );
        const filterMap = {
          blur: () => new filters.Blur({ blur: value / 10 }),
          brightness: () => new filters.Brightness({ brightness: value / 100 }),
          contrast: () => new filters.Contrast({ contrast: value / 100 }),
          saturation: () => new filters.Saturation({ saturation: value / 100 }),
        };

        if (filterMap[filterType]) {
          newFilters.push(filterMap[filterType]());
        }

        activeObject.filters = newFilters;
        activeObject.applyFilters();
        canvas.requestRenderAll();
      });
    },
    [activeObject, canvas],
  );

  const handleRotate = useCallback(() => {
    if (!activeObject || !canvas) return;

    requestAnimationFrame(() => {
      const currentAngle = activeObject.angle || 0;
      activeObject.rotate((currentAngle + 90) % 360);
      canvas.requestRenderAll();
    });
  }, [activeObject, canvas]);

  const handleFlip = useCallback(
    (direction) => {
      if (!activeObject || !canvas) return;

      requestAnimationFrame(() => {
        if (direction === "horizontal") {
          activeObject.set("flipX", !activeObject.flipX);
        } else {
          activeObject.set("flipY", !activeObject.flipY);
        }
        canvas.requestRenderAll();
      });
    },
    [activeObject, canvas],
  );

  const resetAdjustments = useCallback(() => {
    if (!activeObject || !canvas) return;

    requestAnimationFrame(() => {
      setAdjustments({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
      });

      activeObject.filters = [];
      activeObject.set({
        flipX: false,
        flipY: false,
        angle: 0,
      });

      activeObject.applyFilters();
      canvas.requestRenderAll();
    });
  }, [activeObject, canvas]);

  // Render optimization
  const renderSlider = useCallback(
    (label, value, onChange, min = -100, max = 100) => (
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm">{label}</label>
          <span className="text-sm text-neutral-500">{value}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full accent-violet-500 hover:cursor-pointer"
        />
      </div>
    ),
    [],
  );

  if (!activeObject) {
    return (
      <div className="fixed left-24 top-6 bg-neutral-200 box-shadow-3d text-neutral-900 p-4 rounded-lg">
        <p className="text-sm">Select an image to adjust</p>
      </div>
    );
  }

  return (
    <div className="fixed left-24 top-6 bg-neutral-200 text-neutral-900 box-shadow-3d p-4 rounded-lg w-72">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders size={16} />
          <h3 className="font-bold">Image Adjustments</h3>
        </div>
        <button
          onClick={resetAdjustments}
          className="p-2 hover:bg-neutral-700 rounded-full transition-colors"
          title="Reset all adjustments">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {renderSlider("Brightness", adjustments.brightness, (val) =>
          applyFilter("brightness", val),
        )}
        {renderSlider("Contrast", adjustments.contrast, (val) =>
          applyFilter("contrast", val),
        )}
        {renderSlider("Saturation", adjustments.saturation, (val) =>
          applyFilter("saturation", val),
        )}
        {renderSlider(
          "Blur",
          adjustments.blur,
          (val) => applyFilter("blur", val),
          0,
          100,
        )}

        <div className="flex justify-between pt-2 gap-2">
          {[
            { icon: RotateCw, label: "Rotate", onClick: handleRotate },
            {
              icon: FlipHorizontal,
              label: "Flip H",
              onClick: () => handleFlip("horizontal"),
            },
            {
              icon: FlipVertical,
              label: "Flip V",
              onClick: () => handleFlip("vertical"),
            },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex-1 p-2 bg-neutral-300 rounded hover:bg-neutral-400 transition-colors flex items-center justify-center gap-2">
              <Icon size={16} />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageAdjustments;
