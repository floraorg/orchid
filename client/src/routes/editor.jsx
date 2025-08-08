import { createFileRoute } from "@tanstack/react-router";
import { Canvas, FabricImage } from "fabric";
import {
  Crop,
  Eraser,
  ImageDown,
  Layers,
  Sliders,
  Store,
  Type,
  Upload,
  UserSquare2,
} from "lucide-react";
import * as React from "react";
import BackgroundRemovalModal from "../components/editor/BackgroundRemovalModal";
import CropControlsExports from "../components/editor/CropControls";
import HandleExportImage from "../components/editor/HandleExportImage";
import History from "../components/editor/History";
import ImageAdjustments from "../components/editor/ImageAdjustments";
import LayerPanel from "../components/editor/LayerPanel";
import Market from "../components/editor/Market";
import PFPModal from "../components/editor/PFPModal";
import ProfileSection from "../components/editor/ProfileSection";
import TextEditor from "../components/editor/TextEditor";
import { ButtonWithTooltip } from "../components/editor/Tooltip";
import ZoomSlider from "../components/editor/ZoomSlider";
import { useEditor } from "../contexts/EditorContext";
import useCanvasHistory from "../hooks/useHistory";
import {
  ALLOWED_TYPES,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleImageUpload,
} from "../utils/ImageHandlers";
import { createKeyboardHandler } from "../utils/KeyboardHandlers";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  const [market, setMarket] = React.useState(false);
  const [showPFPModal, setShowPFPModal] = React.useState(false);
  const [showBgRemovalModal, setShowBgRemovalModal] = React.useState(false);
  const [showTextPanel, setShowTextPanel] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const [showAdjustments, setShowAdjustments] = React.useState(false);
  const [showLayers, setShowLayers] = React.useState(window.innerWidth >= 900);
  const [isDragging, setIsDragging] = React.useState(false);
  const undoRef = React.useRef(null);
  const redoRef = React.useRef(null);
  const [zoomLevel, setZoomLevel] = React.useState(100);

  const { textOptions, setTextOptions, textMode, setTextMode } = useEditor();
  const { CropControls, useCropManager } = CropControlsExports;

  const { undo, redo, history, historyRedo } = useCanvasHistory(canvas);
  undoRef.current = undo;
  redoRef.current = redo;
  const defaultLayersPanelState = window.innerWidth >= 900;

  const handleMarketToggle = React.useCallback(() => {
    setMarket((prev) => {
      if (!prev) {
        setShowLayers(false);
      } else {
        setShowLayers(defaultLayersPanelState);
      }
      return !prev;
    });
  }, []);

  const handleLayerToggle = React.useCallback(() => {
    setShowLayers((prev) => {
      if (!prev) {
        setMarket(false);
      }
      return !prev;
    });
  }, []);

  React.useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#02061700",
        uniScaleKey: "shiftKey",
        allowTouchScrolling: true,
        preserveObjectStacking: true,
      });

      // For double-clicks
      let lastClickTime = 0;
      const dblClickDelay = 300;

      // To pan (or for panning, whichever is grammatically correct)
      let isPanning = false;
      let lastPosX, lastPosY;

      // Add event listener for mouse down to handle group selection
      initCanvas.on("mouse:down", (opt) => {
        const evt = opt.e;
        const target = opt.target;
        const activeObj = initCanvas.getActiveObject();

        // close marketplace when clicking on canvas
        if (!target) {
          setMarket(false);
          setShowLayers(defaultLayersPanelState);
        }

        if (activeObj && activeObj.type === "textbox") {
          setShowTextPanel(true);
          setTextOptions({
            text: activeObj.text,
            fontSize: activeObj.fontSize,
            fontFamily: activeObj.fontFamily,
            textAlign: activeObj.textAlign,
            fill: activeObj.fill,
            backgroundColor: activeObj.backgroundColor,
            bold: activeObj.fontWeight == "bold" ? true : false,
            italic: activeObj.fontStyle == "italic" ? true : false,
            stroke: activeObj.stroke,
            strokeWidth: activeObj.strokeWidth,
            underline: activeObj.underline,
          });
          setTextMode("edit");
        } else {
          setTextMode("create");
          setTextOptions({
            text: "Click to edit",
            fontSize: 32,
            fontFamily: "Chakra Petch",
            textAlign: "center",
            fill: "#ffffff",
            backgroundColor: "#00000000",
            bold: false,
            italic: false,
            stroke: "#00000000",
            strokeWidth: 0,
            underline: false,
          });
        }

        // Pan the canvas view while holding Ctrl and not dragging a cavas object
        if (!target && evt.ctrlKey) {
          isPanning = true;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
          initCanvas.setCursor("grabbing");
          return;
        }

        // Center canvas view to the center of double-clicked image
        const now = Date.now();
        let delay = (now - lastClickTime);
        if (activeObj && activeObj.type === "image" && target && delay < dblClickDelay) {
          const vpt = initCanvas.viewportTransform;
          const objCenter = target.getCenterPoint();
          vpt[4] = initCanvas.getWidth() / 2 - objCenter.x * vpt[0];
          vpt[5] = initCanvas.getHeight() / 2 - objCenter.y * vpt[3];
          target.setCoords();
          initCanvas.requestRenderAll();
        }
        lastClickTime = now;

        if (evt.ctrlKey) {
          const target = opt.target;
          if (target && target.group) {
            initCanvas.setActiveObject(target.group);
            initCanvas.renderAll();
          }
        }
      });

      // add zoom change handler
      initCanvas.on("zoom:changed", () => {
        const zoom = initCanvas.getZoom();
        setZoomLevel(Math.round(zoom * 100));
      });

      // Modify the selection behavior
      initCanvas.on("selection:created", (opt) => {
        const activeObj = opt.target;
        if (activeObj && activeObj.type === "group") {
          activeObj.subTargetCheck = !opt.e.ctrlKey;
          initCanvas.renderAll();
        }
      });

      initCanvas.on("object:removed", (opt) => {
        setTextMode("create");
        setTextOptions({
          text: "Click to edit",
          fontSize: 32,
          fontFamily: "Chakra Petch",
          textAlign: "center",
          fill: "#ffffff",
          backgroundColor: "#00000000",
          bold: false,
          italic: false,
          stroke: "#00000000",
          strokeWidth: 0,
          underline: false,
        });
      });

      // Update group interaction based on ctrl key
      initCanvas.on("mouse:move", (opt) => {
        if (isPanning) {
          const e = opt.e;
          const vpt = initCanvas.viewportTransform;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          initCanvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
          return;
        }

        const activeObj = initCanvas.getActiveObject();
        if (activeObj && activeObj.type === "group") {
          activeObj.subTargetCheck = !opt.e.ctrlKey;
        }
      });

      initCanvas.on("mouse:up", (opt) => {
        isPanning = false;
        initCanvas.setCursor("default");
      });

      initCanvas.on("text:changed", (opt) => {
        const textObj = opt.target;
        setTextOptions({ ...textOptions, text: textObj.text });
      });

      const handleResize = () => {
        initCanvas.setWidth(window.innerWidth);
        initCanvas.setHeight(window.innerHeight);
        initCanvas.renderAll();
      };
      window.addEventListener("resize", handleResize);

      const keyboardHandler = createKeyboardHandler(initCanvas, {
        onUpload: () => fileInputRef.current?.click(),
        onExport: () => HandleExportImage(initCanvas, setError),
        onMarket: handleMarketToggle,
        onCrop: () => (isCropping ? cancelCrop() : startCropping()),
        onPfp: () => setShowPFPModal(true),
        onBgRemove: () => setShowBgRemovalModal(true),
        onAdjustments: () => setShowAdjustments((prev) => !prev),
        onText: () => setShowTextPanel(true),
        onLayers: handleLayerToggle,
        onUndo: () => undoRef.current?.(),
        onRedo: () => redoRef.current?.(),
      });

      // TODO: very immature naming of functon also PLESAE do so keyboard handler is inside a functional component because my ass NEEDS to use hook
      const resetModes = (ev) => {
        const activeElement = document.activeElement;
        const isInputField =
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true";

        if (isInputField) return;
        if (ev.key == "Backspace" || ev.key == "Delete") {
          setTextMode("create");
          setTextOptions({
            text: "Click to edit",
            fontSize: 32,
            fontFamily: "Chakra Petch",
            textAlign: "center",
            fill: "#ffffff",
            backgroundColor: "#00000000",
            bold: false,
            italic: false,
            stroke: "#00000000",
            strokeWidth: 0,
            underline: false,
          });
        }
      };

      document.addEventListener("keydown", resetModes);
      document.addEventListener("keydown", keyboardHandler);

      setCanvas(initCanvas);
      initCanvas.renderAll();

      return () => {
        initCanvas.dispose();
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("keydown", keyboardHandler);
        document.removeEventListener("keydown", resetModes);
      };
    }
  }, []);

  React.useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2900);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLocalDragOver = (e) => {
    setIsDragging(handleDragOver(e));
  };

  const handleLocalDragLeave = (e) => {
    setIsDragging(handleDragLeave(e));
  };

  const handleLocalDrop = (e) => {
    setIsDragging(false);
    handleDrop(e, canvas, setError);
  };

  const handleLocalImageUpload = (event) => {
    handleImageUpload(event, canvas, setError);
  };

  const { isCropping, startCropping, applyCrop, cancelCrop } =
    useCropManager(canvas);

  const handlePFPSelect = async (url) => {
    if (!canvas || !url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = (e) => {
        const imgElement = new Image();
        imgElement.src = e.target.result;

        imgElement.onload = () => {
          const fabricImage = new FabricImage(imgElement, {
            scaleX: 0.5,
            scaleY: 0.5,
          });

          canvas.add(fabricImage);
          canvas.centerObject(fabricImage);
          canvas.setActiveObject(fabricImage);
          canvas.renderAll();
        };
      };

      reader.readAsDataURL(blob);
    } catch {
      setError("Failed to load profile picture. Please try again.");
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-violet-400 bg-[linear-gradient(to_right,#80808042_1px,transparent_1px),linear-gradient(to_bottom,#80808042_1px,transparent_1px)] bg-[size:48px_48px] inset-0">
      <ZoomSlider
        canvas={canvas}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
      />
      <History canvas={canvas} />
      <div className="fixed h-screen w-24 z-10 p-5">
        <div className="w-full box-shadow-3d h-full flex flex-col items-center justify-between py-4 bg-neutral-200 rounded-lg">
          <div className="flex gap-4 flex-col items-center">
            <ButtonWithTooltip
              icon={Upload}
              tooltip="Upload Image"
              shortcut="U"
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={handleLocalImageUpload}
              style={{ display: "none" }}
            />
            <ButtonWithTooltip
              icon={ImageDown}
              tooltip="Export Image"
              shortcut="E"
              onClick={() => HandleExportImage(canvas, setError)}
            />
            <ButtonWithTooltip
              icon={Store}
              tooltip="Toggle Marketplace"
              shortcut="M"
              onClick={handleMarketToggle}
              active={market}
            />
            <ButtonWithTooltip
              icon={Crop}
              tooltip="Crop Image"
              shortcut="C"
              onClick={isCropping ? cancelCrop : startCropping}
              active={isCropping}
            />
            <ButtonWithTooltip
              icon={UserSquare2}
              tooltip="Get Profile Picture"
              shortcut="P"
              onClick={() => setShowPFPModal(true)}
            />
            <ButtonWithTooltip
              icon={Eraser}
              tooltip="Remove Background"
              shortcut="B"
              onClick={() => setShowBgRemovalModal(true)}
            />
            <ButtonWithTooltip
              icon={Sliders}
              tooltip="Image Adjustments"
              shortcut="I"
              onClick={() => setShowAdjustments(!showAdjustments)}
              active={showAdjustments}
            />
            <ButtonWithTooltip
              icon={Type}
              tooltip="Add Text"
              shortcut="T"
              onClick={() => setShowTextPanel(true)}
              active={showTextPanel}
            />
            <ButtonWithTooltip
              icon={Layers}
              tooltip="Layers"
              shortcut="L"
              onClick={handleLayerToggle}
              active={showLayers}
            />
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="py-[1px] px-3 bg-neutral-300 w-full"></div>
            <ProfileSection />
          </div>
        </div>
      </div>
      <div
        className={`w-screen h-screen overflow-hidden ${isDragging ? "bg-violet-500/20" : ""} transition-all duration-300 ease-in-out`}
        onDragOver={handleLocalDragOver}
        onDragLeave={handleLocalDragLeave}
        onDrop={handleLocalDrop}>
        <canvas
          ref={canvasRef}
          className="w-full h-full transition-transform duration-300 ease-in-out"
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform scale-100 opacity-100">
              <p className="text-lg font-semibold text-violet-600 transition-colors duration-300">
                Drop your image here
              </p>
            </div>
          </div>
        )}
      </div>

      {showLayers && <LayerPanel canvas={canvas} />}
      {showAdjustments && <ImageAdjustments canvas={canvas} />}
      <TextEditor
        canvas={canvas}
        isOpen={showTextPanel}
        onClose={() => setShowTextPanel(false)}
      />
      {market && <Market canvas={canvas} />}
      <CropControls
        canvas={canvas}
        isActive={isCropping}
        onComplete={applyCrop}
        onCancel={cancelCrop}
      />

      <div
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 
          bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50
          transition-all duration-300 ease-in-out
          ${showError ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
        {error}
      </div>

      <PFPModal
        isOpen={showPFPModal}
        onClose={() => setShowPFPModal(false)}
        onSelect={handlePFPSelect}
      />
      <BackgroundRemovalModal
        isOpen={showBgRemovalModal}
        onClose={() => setShowBgRemovalModal(false)}
        canvas={canvas}
      />
    </div>
  );
}

export default RouteComponent;
