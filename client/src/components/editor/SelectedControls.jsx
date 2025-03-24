import { ChevronDown, Copy, Trash, ChevronUp, FlipHorizontal2, FlipVertical2, Scissors } from "lucide-react";
import * as React from "react";

export function SelectedControls({ canvas, moveObjectUp, moveObjectDown, duplicateObject, deleteObject, mirrorObject, mirrorObjectVertically }) {
  const selectedControlsRef = React.useRef(null);
  const [isImageSelected, setIsImageSelected] = React.useState(false);

  const updateSelectedControlsPosition = React.useCallback(() => {
    if (!canvas || !selectedControlsRef.current) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      selectedControlsRef.current.style.display = "none";
      setIsImageSelected(false);
      return;
    }

    const isImage = activeObject.type === 'image';
    setIsImageSelected(isImage);

    const bound = activeObject.getBoundingRect();
    const zoom = canvas.getZoom();
    const viewportTransform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

    const transformedLeft = (bound.left * zoom) + viewportTransform[4];
    const transformedTop = (bound.top * zoom) + viewportTransform[5];
    const transformedHeight = bound.height * zoom;

    selectedControlsRef.current.style.display = "flex";

    const controlsWidth = selectedControlsRef.current.offsetWidth;
    const controlsHeight = selectedControlsRef.current.offsetHeight;

    const controlLeft = transformedLeft - controlsWidth - 10; // 10px padding
    const controlTop = transformedTop + (transformedHeight / 2) - (controlsHeight / 2);

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const clampedLeft = Math.max(0, Math.min(controlLeft, canvasWidth - controlsWidth));
    const clampedTop = Math.max(0, Math.min(controlTop, canvasHeight - controlsHeight));

    selectedControlsRef.current.style.left = `${clampedLeft}px`;
    selectedControlsRef.current.style.top = `${clampedTop}px`;
  }, [canvas]);

  React.useEffect(() => {
    if (!canvas) return;

    const handleSelectionCreated = () => {
      updateSelectedControlsPosition();
    };

    const handleSelectionUpdated = () => {
      updateSelectedControlsPosition();
    };

    const handleSelectionCleared = () => {
      if (selectedControlsRef.current) {
        selectedControlsRef.current.style.display = "none";
      }
      setIsImageSelected(false);
    };

    const handleObjectModified = () => {
      updateSelectedControlsPosition();
    };

    const handleCanvasRendered = () => {
      updateSelectedControlsPosition();
    };

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionUpdated);
    canvas.on("selection:cleared", handleSelectionCleared);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("object:moving", handleObjectModified);
    canvas.on("object:scaling", handleObjectModified);
    canvas.on("object:rotating", handleObjectModified);
    canvas.on("after:render", handleCanvasRendered);
    canvas.on("mouse:wheel", handleObjectModified);

    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionUpdated);
      canvas.off("selection:cleared", handleSelectionCleared);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("object:moving", handleObjectModified);
      canvas.off("object:scaling", handleObjectModified);
      canvas.off("object:rotating", handleObjectModified);
      canvas.off("after:render", handleCanvasRendered);
      canvas.off("mouse:wheel", handleObjectModified);
    };
  }, [canvas, updateSelectedControlsPosition]);

  return (
    <div
      ref={selectedControlsRef}
      className="absolute z-20 flex flex-col gap-2 bg-white rounded shadow-md p-1"
      style={{ display: "none" }}
    >
      <button
        onClick={moveObjectUp}
        className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
        title="Move Up Layer (Ctrl+↑)"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <button
        onClick={moveObjectDown}
        className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
        title="Move Down Layer (Ctrl+↓)"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
      <button
        onClick={duplicateObject}
        className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
        title="Duplicate Layer (Ctrl+D)"
      >
        <Copy className="w-5 h-5" />
      </button>
      <button
        onClick={mirrorObject}
        className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
        title="Mirror Horizontally (M)"
      >
        <FlipHorizontal2 className="w-5 h-5" />
      </button>
      <button
        onClick={mirrorObjectVertically}
        className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
        title="Mirror Vertically (Shift+M)"
      >
        <FlipVertical2 className="w-5 h-5" />
      </button>
      {isImageSelected && (
        <button
          className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
          title="Crop Image (C)"
        >
          <Scissors className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={deleteObject}
        className="p-1.5 bg-violet-100 rounded hover:bg-violet-200 text-sm flex items-center"
        title="Delete Layer (Delete/Backspace)"
      >
        <Trash className="w-5 h-5" />
      </button>
    </div>
  );
}