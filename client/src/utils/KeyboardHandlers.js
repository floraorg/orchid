import { ActiveSelection, FabricImage, Group } from "fabric";

let fabricClipboard = null;

export function createKeyboardHandler(
  canvas,
  {
    onUpload,
    onExport,
    onMarket,
    onCrop,
    onPfp,
    onBgRemove,
    onAdjustments,
    onText,
    onLayers,
    onUndo,
    onRedo,
  } = {},
) {
  // Add paste event listener
  document.addEventListener("paste", (e) => {
    const activeElement = document.activeElement;
    const isInputField =
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.contentEditable === "true";
    if (isInputField) return;
    handleImagePaste(e, canvas);
  });

  // Handle browser zoom controls
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) {
      e.preventDefault();
      const delta = (e.key === '-') ? -100 : 100;
      const zoom = canvas.getZoom();
      const newZoom = Math.min(Math.max(zoom + (delta * 0.001), 0.01), 20);
      const center = { x: canvas.width / 2, y: canvas.height / 2 };
      canvas.zoomToPoint(center, newZoom);
      canvas.fire('zoom:changed');
      canvas.requestRenderAll();
    }
  });

  // Handle Ctrl + mousewheel zoom
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const zoom = canvas.getZoom();
      const newZoom = Math.min(Math.max(zoom * (0.999 ** delta), 0.01), 20);
      const point = { x: e.offsetX, y: e.offsetY };
      canvas.zoomToPoint(point, newZoom);
      canvas.fire('zoom:changed');
      canvas.requestRenderAll();
    }
  }, { passive: false });

  return (event) => {
    const activeElement = document.activeElement;
    const isInputField =
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.contentEditable === "true";

    if (isInputField) return;

    handleDelete(event, canvas);
    handleGrouping(event, canvas);
    handleCopy(event, canvas);
    handleObjectPaste(event, canvas);
    handleUngroup(event, canvas);
    handleSelectAll(event, canvas);

    if (event.ctrlKey) {
      if (event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }
      if (event.key === "y") {
        event.preventDefault();
        onRedo?.();
        return;
      }
    }

    if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case "u":
          event.preventDefault();
          onUpload?.();
          break;
        case "e":
          event.preventDefault();
          onExport?.();
          break;
        case "m":
          event.preventDefault();
          onMarket?.();
          break;
        case "c":
          event.preventDefault();
          onCrop?.();
          break;
        case "p":
          event.preventDefault();
          onPfp?.();
          break;
        case "b":
          event.preventDefault();
          onBgRemove?.();
          break;
        case "i":
          event.preventDefault();
          onAdjustments?.();
          break;
        case "t":
          event.preventDefault();
          onText?.();
          break;
        case "l":
          event.preventDefault();
          onLayers?.();
          break;
      }
    }
  };
}

function handleDelete(event, canvas) {
  if (event.key !== "Backspace" && event.key !== "Delete") return;

  const selectedObjects = canvas.getActiveObjects();
  if (!selectedObjects || selectedObjects.length === 0) return;

  selectedObjects.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

function handleGrouping(event, canvas) {
  if (!(event.ctrlKey && event.key === "g")) return;

  event.preventDefault();
  const selectedObjects = canvas.getActiveObjects();
  if (selectedObjects.length <= 1) return;

  const group = new Group(selectedObjects, {
    canvas: canvas,
  });

  selectedObjects.forEach((obj) => canvas.remove(obj));
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
}

function handleCopy(event, canvas) {
  if (!(event.ctrlKey && event.key === "c")) return;

  event.preventDefault();
  canvas
    ?.getActiveObject()
    ?.clone(["name"])
    .then((cloned) => {
      fabricClipboard = cloned;
    });
}

async function handleImagePaste(event, canvas) {
  if (!event.clipboardData || !canvas) return;

  const items = Array.from(event.clipboardData.items);
  const imageItem = items.find((item) => item.type.startsWith("image/"));

  if (imageItem) {
    event.preventDefault();
    try {
      const blob = imageItem.getAsFile();
      // convert blob to base64 data URL
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });

      const imgElement = document.createElement("img");
      imgElement.crossOrigin = "anonymous";

      const fabricImage = await new Promise((resolve, reject) => {
        imgElement.onload = () => {
          const image = new FabricImage(imgElement, {
            id: `image-${Date.now()}`,
            name: `Pasted Image ${canvas.getObjects().length + 1}`,
          });

          const maxWidth = window.innerWidth * 0.9;
          const maxHeight = window.innerHeight * 0.9;

          if (image.width > maxWidth || image.height > maxHeight) {
            const scaleFactorWidth = maxWidth / image.width;
            const scaleFactorHeight = maxHeight / image.height;
            const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
            image.scale(scaleFactor);
          }

          resolve(image);
        };
        imgElement.onerror = () =>
          reject(new Error("Failed to load pasted image"));
        imgElement.src = dataUrl;
      });

      canvas.add(fabricImage);
      canvas.centerObject(fabricImage);
      canvas.setActiveObject(fabricImage);
      canvas.requestRenderAll();
    } catch (err) {
      console.error("Failed to paste image:", err);
    }
  }
}

async function handleObjectPaste(event, canvas) {
  if (!(event.ctrlKey && event.key === "v") || !fabricClipboard || !canvas)
    return;

  event.preventDefault();
  try {
    const clonedObj = await fabricClipboard.clone(["name", "padding"]);
    canvas.discardActiveObject();

    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });

    if (clonedObj instanceof ActiveSelection) {
      clonedObj.canvas = canvas;
      clonedObj.forEachObject((obj) => {
        canvas.add(obj);
      });
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }

    fabricClipboard.top += 10;
    fabricClipboard.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
    canvas.fire("custom:added");
  } catch (err) {
    console.error("Failed to paste fabric object:", err);
  }
}

function handleUngroup(event, canvas) {
  if (!(event.ctrlKey && event.key === "u")) return;

  event.preventDefault();
  const activeObject = canvas.getActiveObject();
  if (!activeObject || activeObject.type !== "group") return;

  const items = activeObject.getObjects();
  canvas.remove(activeObject);

  items.forEach((item) => canvas.add(item));

  canvas.discardActiveObject();
  const selection = new ActiveSelection(items, { canvas });
  canvas.setActiveObject(selection);
  canvas.requestRenderAll();
}

// Select all objects with Ctrl+A
function handleSelectAll(event, canvas) {
  if (!(event.ctrlKey && event.key === "a")) return;

  event.preventDefault();
  const allObjects = canvas.getObjects();
  if (allObjects.length === 0) return;

  const selection = new ActiveSelection(allObjects, { canvas: canvas });
  canvas.setActiveObject(selection);
  canvas.requestRenderAll();
}
