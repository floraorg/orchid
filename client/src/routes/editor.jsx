import { createFileRoute } from "@tanstack/react-router";
import { Canvas, FabricImage, Group } from "fabric";
import { Crop, ImageDown, Store, Upload } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function Market({handleAddHat}) {
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];
  return <div className="fixed right-0 h-screen w-[30rem] top-0 bg-gray-900 transform  z-10  flex-wrap gap-4 p-4 flex space-x-2">
    {HATS.map((hat, i) => (
      <img
        key={i}
        src={hat}
        alt={`Hat ${i + 1}`}
        className="h-20 z-10 cursor-pointer hover:opacity-70"
        onClick={() => handleAddHat(hat)}
      />
    ))}
  </div>
}

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  const [market, setMarket] = React.useState(true)

  React.useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#02061700",
        allowTouchScrolling: true,
        preserveObjectStacking: true,
      });

      const handleResize = () => {
        initCanvas.setWidth(window.innerWidth);
        initCanvas.setHeight(window.innerHeight);
        initCanvas.renderAll();
      };
      window.addEventListener('resize', handleResize);

      // Key event handlers
      const handleKeyDown = (event) => {
        // Delete selected object (including groups)
          
        if ((event.key === "Backspace" || event.key === "Delete") && initCanvas) {
          const activeObject = initCanvas.getActiveObject();
          if (activeObject) {
            const parentGroup = activeObject.group;
            
            if (parentGroup) {
              parentGroup.remove(activeObject);
              
              if (parentGroup.getObjects().length === 0) {
                initCanvas.remove(parentGroup);
              }
            } else {
              initCanvas.remove(activeObject);
            }
            
            initCanvas.discardActiveObject();
            initCanvas.renderAll();
          }
        }
        
        // Group objects with Ctrl + G
        if (event.ctrlKey && event.key === "g") {
          event.preventDefault();
          const selectedObjects = initCanvas.getActiveObjects();
          if (selectedObjects.length > 1) {
            const group = new Group(selectedObjects, {
              interactive: true, 
              subTargetCheck: true, 
              backgroundColor: '#f00f0022'
            });

            selectedObjects.forEach(obj => initCanvas.remove(obj));
            initCanvas.add(group);
            initCanvas.setActiveObject(group);
            initCanvas.renderAll();
          }
        }

        // Ungroup with Ctrl + Shift + G
        if (event.ctrlKey &&  event.key === "u") {
          event.preventDefault();
          const activeObject = initCanvas.getActiveObject();
          
          if (activeObject && activeObject.type === 'group') {
            // Ungroup the objects
            const items = activeObject.getObjects();
            initCanvas.remove(activeObject);
            
            // Add each item back to the canvas
            items.forEach(item => {
              initCanvas.add(item);
            });
            
            // Select the ungrouped items
            initCanvas.discardActiveObject();
            const sel = new fabric.ActiveSelection(items, {
              canvas: initCanvas
            });
            initCanvas.setActiveObject(sel);
            initCanvas.renderAll();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      setCanvas(initCanvas);
      initCanvas.renderAll()

      return () => {
        initCanvas.dispose();
        window.removeEventListener('resize', handleResize);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  // Rest of the component code remains the same as in previous implementation
  const handleExportImage = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const dataURL = activeObject.toDataURL({
        format: "png",
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.download = "selected-object.png";
      link.href = dataURL;
      link.click();
    } else {
      canvas.discardActiveObject();
      canvas.renderAll();
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.download = "canvas-image.png";
      link.href = dataURL;
      link.click();
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const imgSrc = e.target.result;
      let imageElement = document.createElement("img");
      imageElement.src = imgSrc;
      imageElement.onload = function () {
        let image = new FabricImage(imageElement);

        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9;

        if (image.width > maxWidth || image.height > maxHeight) {
          const scaleFactorWidth = maxWidth / image.width;
          const scaleFactorHeight = maxHeight / image.height;
          const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
          image.scale(scaleFactor);
        }

        image.set({
          selectable: true,  // Still selectable
          hasControls: true,  // Remove resize/rotate controls
          hoverCursor: 'default',  // Remove move cursor
          lockMovementX: false,  // Prevent horizontal movement
          lockMovementY: false,  // Prevent vertical movement
          evented: true,  // Prevent interaction that would change its position
        });

        canvas.add(image);
        canvas.centerObject(image);
        canvas.renderAll();
      };
    };
  };

  const handleAddHat = (hatUrl) => {
    if (!canvas) return;
    let imageElement = document.createElement("img");
    imageElement.src = hatUrl;
    imageElement.onload = function () {
      let image = new FabricImage(imageElement);
      canvas.add(image);
      canvas.centerObject(image);
      canvas.renderAll();
    };
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="fixed h-screen w-20 z-10 p-4">
        <div className="w-full h-full flex flex-col items-center py-4  rounded-lg bg-gray-900">
          <div className="group flex gap-5 flex-col items-center  cursor-pointer">
            <img src="https://sakura.rex.wf/linear/orchird" alt="orchird" className="h-8 rounded-full" />
            <label htmlFor="fileinp" className="text-gray-100 hover:text-blue-400 transition cursor-pointer" >
              <Upload size={24} />
            </label>
            <input
              hidden
              id="fileinp"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button className="text-gray-100 hover:text-blue-400 transition" onClick={handleExportImage}>
              <ImageDown size={24}/>
            </button>
            <button onClick={() => setMarket(!market)} className="text-gray-100 hover:text-blue-400 transition">
              <Store size={24}/>
            </button>
            <div className="py-[1px] px-3 bg-gray-700 rounded-md"></div>
            <button  className="text-gray-100 hover:text-blue-400 transition">
              <Crop size={24}/>
            </button>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      ></canvas>
      {market && <Market handleAddHat={handleAddHat}/>}
    </div>
  );
}

export default RouteComponent;