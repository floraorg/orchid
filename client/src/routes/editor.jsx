import { createFileRoute } from "@tanstack/react-router";
import { Canvas, Rect } from "fabric";
import * as React from "react";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  const [isHandMode, setIsHandMode] = React.useState(false);
  const [backgroundPosition, setBackgroundPosition] = React.useState({ x: 0, y: 0 });
  const lastPosXRef = React.useRef(0);
  const lastPosYRef = React.useRef(0);
  const isDragging = React.useRef(false);

  React.useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#02061700",
        uniScaleKey: "shiftKey",
        allowTouchScrolling: false,
        preserveObjectStacking: true,
        selection: true,
      });

      setCanvas(initCanvas);

      const redSquare = new Rect({
        left: 100,
        top: 100,
        fill: "red",
        width: 100,
        height: 100,
        selectable: true,
      });

      const blueSquare = new Rect({
        left: 300,
        top: 150,
        fill: "blue",
        width: 80,
        height: 80,
        selectable: true,
      });

      initCanvas.add(redSquare, blueSquare);
      initCanvas.renderAll();

      return () => {
        initCanvas.dispose();
      };
    }
  }, []);

  const toggleMode = () => {
    setIsHandMode((prev) => !prev);
  };

  React.useEffect(() => {
    if (canvas) {
      canvas.selection = !isHandMode; 
      canvas.defaultCursor = isHandMode ? "grab" : "default";
      canvas.getObjects().forEach((obj) => {
        obj.selectable = !isHandMode; 
      });
      canvas.renderAll();
    }
  }, [isHandMode, canvas]);

  React.useEffect(() => {
    if (canvas) {
      const handleMouseDown = (e) => {
        if (isHandMode) {
          isDragging.current = true;
          lastPosXRef.current = e.pointer.x;
          lastPosYRef.current = e.pointer.y;
          canvas.defaultCursor = "grabbing";
          canvas.setCursor("grabbing");
        }
      };

      const handleMouseMove = (e) => {
        if (isHandMode && isDragging.current) {
          const deltaX = e.pointer.x - lastPosXRef.current;
          const deltaY = e.pointer.y - lastPosYRef.current;

          setBackgroundPosition((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
          canvas.getObjects().forEach((obj) => {
            obj.left += deltaX;
            obj.top += deltaY;
            obj.setCoords();
          });
          canvas.renderAll();

          lastPosXRef.current = e.pointer.x;
          lastPosYRef.current = e.pointer.y;
        }
      };

      const handleMouseUp = () => {
        if (isHandMode) {
          isDragging.current = false;
          canvas.defaultCursor = "grab";
          canvas.setCursor("grab");
        }
      };

      canvas.on("mouse:down", handleMouseDown);
      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:up", handleMouseUp);
      canvas.on("touch:start", handleMouseDown);
      canvas.on("touch:move", handleMouseMove);
      canvas.on("touch:end", handleMouseUp);

      return () => {
        canvas.off("mouse:down", handleMouseDown);
        canvas.off("mouse:move", handleMouseMove);
        canvas.off("mouse:up", handleMouseUp);
        canvas.off("touch:start", handleMouseDown);
        canvas.off("touch:move", handleMouseMove);
        canvas.off("touch:end", handleMouseUp);
      };
    }
  }, [canvas, isHandMode]);

  const backgroundStyle = {
    backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`,
  };

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden bg-violet-400 bg-[linear-gradient(to_right,#80808042_1px,transparent_1px),linear-gradient(to_bottom,#80808042_1px,transparent_1px)] bg-[size:48px_48px] inset-0"
      style={backgroundStyle}
    >
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={toggleMode}
          className="px-4 py-2 bg-white rounded shadow hover:bg-gray-100"
        >
          {isHandMode ? "Switch to Selection Mode" : "Switch to Hand Mode"}
        </button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default RouteComponent;
