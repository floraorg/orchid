import { createFileRoute } from "@tanstack/react-router";
import { Canvas, FabricImage, Group, ActiveSelection } from "fabric";
import * as React from "react";
import { ZoomSlider } from "../components/editor/ZoomSlider.jsx";
import { useKeyboard } from "../hooks/useKeyboard.jsx";
import { SelectedControls } from "../components/editor/SelectedControls.jsx";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const cumulativeDeltaX = React.useRef(0);
  const cumulativeDeltaY = React.useRef(0);
  const [canvas, setCanvas] = React.useState(null);
  const [isHandMode, setIsHandMode] = React.useState(false);
  const lastPosXRef = React.useRef(0);
  const lastPosYRef = React.useRef(0);
  const isDragging = React.useRef(false);
  const [error, setError] = React.useState(null);
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [gridSize, setGridSize] = React.useState(48);

  React.useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        setZoomLevel((prev) => {
          const newZoom = prev - delta * 0.1;
          return Math.min(Math.max(newZoom, 25), 500);
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = null;

    const getDistance = (touches) => {
      const [touch1, touch2] = touches;
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistance !== null) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scaleChange = currentDistance / initialDistance;
        setZoomLevel((prev) => {
          const newZoom = prev * scaleChange;
          return Math.min(Math.max(newZoom, 25), 500);
        });
        initialDistance = currentDistance;
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialDistance = null;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

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

      const loadImage = async (url) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const reader = new FileReader();

          reader.onload = (e) => {
            const imgElement = new window.Image();
            imgElement.src = e.target.result;

            imgElement.onload = () => {
              const fabricImage = new FabricImage(imgElement, {
                scaleX: 0.5,
                scaleY: 0.5,
              });

              initCanvas.add(fabricImage);
              initCanvas.centerObject(fabricImage);
              initCanvas.setActiveObject(fabricImage);
              initCanvas.renderAll();
            };
          };

          reader.readAsDataURL(blob);
        } catch {
          setError("Failed to load image. Please try again.");
        }
      };

      loadImage("https://wisp.rex.wf/x/namishh__");
      loadImage("https://wisp.rex.wf/x/reallyrawn");
      loadImage("https://wisp.rex.wf/x/zoriya_dev");
      loadImage("/orchid.png");

      return () => {
        initCanvas.dispose();
      };
    }
  }, []);

  React.useEffect(() => {
    if (canvas) {
      let renderPending = false;

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

          const zoomFactor = zoomLevel / 100;
          const adjustedDeltaX = deltaX / zoomFactor;
          const adjustedDeltaY = deltaY / zoomFactor;

          cumulativeDeltaX.current += adjustedDeltaX;
          cumulativeDeltaY.current += adjustedDeltaY;

          const container = containerRef.current;
          if (container) {
            container.style.backgroundPosition = `${cumulativeDeltaX.current}px ${cumulativeDeltaY.current}px`;
          }

          canvas.getObjects().forEach((obj) => {
            obj.left += deltaX;
            obj.top += deltaY;
            obj.setCoords();
          });

          if (!renderPending) {
            renderPending = true;
            requestAnimationFrame(() => {
              canvas.renderAll();
              renderPending = false;
            });
          }

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
  }, [canvas, isHandMode, zoomLevel]);

  React.useEffect(() => {
    const handleResize = () => {
      if (canvas) {
        canvas.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        canvas.renderAll();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvas]);

  const toggleMode = () => {
    setIsHandMode((prev) => !prev);
    if (canvas) {
      canvas.discardActiveObject();
      canvas.getObjects().forEach((obj) => {
        obj.selectable = !isHandMode;
      });
      canvas.renderAll();
    }
  };

  React.useEffect(() => {
    if (canvas) {
      canvas.selection = !isHandMode;
      canvas.defaultCursor = isHandMode ? "grab" : "default";
      if (isHandMode) {
        canvas.discardActiveObject();
      }
      canvas.getObjects().forEach((obj) => {
        obj.selectable = !isHandMode;
      });
      canvas.renderAll();
    }
  }, [isHandMode, canvas]);

  const handleGrouping = React.useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    if (activeObject.type === "group") {
      const clonePromises = activeObject._objects.map((item) => item.clone());
      Promise.all(clonePromises).then((items) => {
        const groupLeft = activeObject.left || 0;
        const groupTop = activeObject.top || 0;
        const groupScaleX = activeObject.scaleX || 1;
        const groupScaleY = activeObject.scaleY || 1;
        const groupAngle = activeObject.angle || 0;

        canvas.remove(activeObject);

        items.forEach((item) => {
          let itemLeft = item.left || 0;
          let itemTop = item.top || 0;

          itemLeft = itemLeft * groupScaleX;
          itemTop = itemTop * groupScaleY;

          if (groupAngle !== 0) {
            const angleRadians = (groupAngle * Math.PI) / 180;
            const rotatedX =
              itemLeft * Math.cos(angleRadians) -
              itemTop * Math.sin(angleRadians);
            const rotatedY =
              itemLeft * Math.sin(angleRadians) +
              itemTop * Math.cos(angleRadians);
            itemLeft = rotatedX;
            itemTop = rotatedY;
          }

          itemLeft += groupLeft;
          itemTop += groupTop;

          item.canvas = null;

          item.set({
            left: itemLeft,
            top: itemTop,
            scaleX: (item.scaleX || 1) * groupScaleX,
            scaleY: (item.scaleY || 1) * groupScaleY,
            angle: (item.angle || 0) + groupAngle,
            selectable: !isHandMode,
          });

          canvas.add(item);
          item.setCoords();
        });

        canvas.requestRenderAll();
      });
    } else {
      const selectedObjects = canvas.getActiveObjects();
      if (selectedObjects.length <= 1) return;

      let minX = Number.MAX_VALUE,
        minY = Number.MAX_VALUE;
      let maxX = Number.MIN_VALUE,
        maxY = Number.MIN_VALUE;

      selectedObjects.forEach((obj) => {
        const objCoords = obj.getBoundingRect();
        minX = Math.min(minX, objCoords.left);
        minY = Math.min(minY, objCoords.top);
        maxX = Math.max(maxX, objCoords.left + objCoords.width);
        maxY = Math.max(maxY, objCoords.top + objCoords.height);
      });

      const selectionCenter = {
        x: minX + (maxX - minX) / 2,
        y: minY + (maxY - minY) / 2,
      };

      const group = new Group(selectedObjects, {
        left: selectionCenter.x,
        top: selectionCenter.y,
        originX: "center",
        originY: "center",
        canvas: canvas,
      });

      selectedObjects.forEach((obj) => canvas.remove(obj));
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
    }
  }, [canvas, isHandMode]);

  const moveObjectUp = React.useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    const objects = canvas.getObjects();
    const selectedObjectsWithIndices = activeObjects.map((obj) => ({
      object: obj,
      currentIndex: objects.indexOf(obj),
    }));

    selectedObjectsWithIndices.sort((a, b) => b.currentIndex - a.currentIndex);

    let changed = false;
    selectedObjectsWithIndices.forEach((item) => {
      const currentIndex = objects.indexOf(item.object);
      const newIndex = Math.min(currentIndex + 1, objects.length - 1);
      if (newIndex !== currentIndex) {
        canvas.moveObjectTo(item.object, newIndex);
        changed = true;
      }
    });

    if (changed) {
      canvas.requestRenderAll();
    }
  }, [canvas]);

  const moveObjectDown = React.useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    const objects = canvas.getObjects();
    const selectedObjectsWithIndices = activeObjects.map((obj) => ({
      object: obj,
      currentIndex: objects.indexOf(obj),
    }));

    selectedObjectsWithIndices.sort((a, b) => a.currentIndex - b.currentIndex);

    let changed = false;
    selectedObjectsWithIndices.forEach((item) => {
      const currentIndex = objects.indexOf(item.object);
      const newIndex = Math.max(currentIndex - 1, 0);
      if (newIndex !== currentIndex) {
        canvas.moveObjectTo(item.object, newIndex);
        changed = true;
      }
    });

    if (changed) {
      canvas.requestRenderAll();
    }
  }, [canvas]);

  const duplicateObject = React.useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    if (activeObjects.length === 1) {
      const activeObject = activeObjects[0];
      activeObject.clone().then((cloned) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
          evented: true,
          selectable: !isHandMode,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
      }).catch((err) => console.error("Error duplicating object:", err));
    } else {
      const clonePromises = activeObjects.map((obj) => obj.clone());
      canvas.discardActiveObject();

      Promise.all(clonePromises)
        .then((clonedObjects) => {
          clonedObjects.forEach((cloned, index) => {
            const original = activeObjects[index];
            cloned.set({
              left: (original.left || 0) + 20,
              top: (original.top || 0) + 20,
              evented: true,
              selectable: !isHandMode,
              canvas: null,
            });
            canvas.add(cloned);
          });

          if (clonedObjects.length > 1) {
            const selection = new ActiveSelection(clonedObjects, { canvas });
            canvas.setActiveObject(selection);
          } else if (clonedObjects.length === 1) {
            canvas.setActiveObject(clonedObjects[0]);
          }
          canvas.requestRenderAll();
        })
        .catch((err) => console.error("Error duplicating objects:", err));
    }
  }, [canvas, isHandMode]);

  const deleteObject = React.useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      canvas.remove(...activeObjects);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    } else {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  }, [canvas]);

  const mirrorObject = React.useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    activeObjects.forEach((obj) => {
      obj.set("scaleX", -(obj.scaleX || 1));
      obj.setCoords();
    });
    canvas.requestRenderAll();
  }, [canvas]);

  const mirrorObjectVertically = React.useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    activeObjects.forEach((obj) => {
      obj.set("scaleY", -(obj.scaleY || 1));
      obj.setCoords();
    });
    canvas.requestRenderAll();
  }, [canvas]);

  // Set hand mode
  const setHandMode = React.useCallback(() => {
    setIsHandMode(true);
    if (canvas) {
      canvas.selection = false;
      canvas.defaultCursor = "grab";
      canvas.setCursor("grab");
    }
  }, [canvas]);

  const setSelectionMode = React.useCallback(() => {
    setIsHandMode(false);
    if (canvas) {
      canvas.selection = true;
      canvas.defaultCursor = "default";
      canvas.setCursor("default");
    }
  }, [canvas]);

  useKeyboard({
    "ctrl g": handleGrouping,
    "ctrl up": moveObjectUp,
    "ctrl down": moveObjectDown,
    "ctrl d": duplicateObject,
    delete: deleteObject,
    backspace: deleteObject,
    "shift m": mirrorObjectVertically,
    m: mirrorObject,
    h: setHandMode,
    v: setSelectionMode,
    "ctrl =": () => setZoomLevel((prev) => Math.min(prev + 10, 500)),
    "ctrl -": () => setZoomLevel((prev) => Math.max(prev - 10, 25)),
  });

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden bg-violet-400 bg-[linear-gradient(to_right,#80808042_1px,transparent_1px),linear-gradient(to_bottom,#80808042_1px,transparent_1px)] inset-0"
      style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
    >
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={toggleMode}
          className="px-4 py-2 bg-white rounded shadow hover:bg-gray-100"
        >
          {isHandMode ? "Switch to Selection Mode" : "Switch to Hand Mode"}
        </button>
        <button
          onClick={handleGrouping}
          className="px-4 py-2 bg-white rounded shadow hover:bg-gray-100"
          disabled={isHandMode}
        >
          {canvas?.getActiveObject()?.type === "group"
            ? "Ungroup"
            : "Group"}{" "}
          (Ctrl+G)
        </button>
      </div>
      {error && (
        <p className="absolute top-16 left-4 text-red-500">{error}</p>
      )}
      <canvas ref={canvasRef} />

      <SelectedControls
        canvas={canvas}
        moveObjectUp={moveObjectUp}
        moveObjectDown={moveObjectDown}
        duplicateObject={duplicateObject}
        deleteObject={deleteObject}
        mirrorObject={mirrorObject}
        mirrorObjectVertically={mirrorObjectVertically}
      />

      <ZoomSlider
        canvas={canvas}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        setGridSize={setGridSize}
      />
    </div>
  );
}

export default RouteComponent;