import { ChevronDown, Copy, Trash, ChevronUp, FlipHorizontal2, FlipVertical2 } from "lucide-react";
import * as React from "react";

export function SelectedControls({ canvas, moveObjectUp, moveObjectDown, duplicateObject, deleteObject, mirrorObject, mirrorObjectVertically }) {
  const selectedControlsRef = React.useRef(null);

  const updateSelectedControlsPosition = React.useCallback(() => {
    if (!canvas || !selectedControlsRef.current) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      selectedControlsRef.current.style.display = "none";
      return;
    }

    const bound = activeObject.getBoundingRect();

    const zoom = canvas.getZoom();
    const viewportTransform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

    const transformedLeft = (bound.left * zoom) + viewportTransform[4];
    const transformedTop = (bound.top * zoom) + viewportTransform[5];
    const transformedWidth = bound.width * zoom;

    const controlLeft = transformedLeft + (transformedWidth / 2);
    const controlTop = transformedTop - 60; 

    selectedControlsRef.current.style.display = "flex";
    selectedControlsRef.current.style.left = `${controlLeft}px`;
    selectedControlsRef.current.style.top = `${controlTop}px`;
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
      className="absolute z-20 flex gap-2 bg-white rounded shadow-md p-1"
      style={{ display: "none", transform: "translateX(-50%)" }}
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
