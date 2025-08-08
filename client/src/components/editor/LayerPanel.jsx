import { ActiveSelection, Group } from "fabric";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
  EyeOff,
  Group as GroupIcon,
  Lock,
  Trash2,
  Ungroup,
  Unlock,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const LayerPanel = ({ canvas }) => {
  const [layers, setLayers] = useState([]);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [selectedLayers, setSelectedLayers] = useState(new Set());

  const initializeLayer = useCallback((obj, index) => {
    if (!obj.id) obj.id = `layer-${Date.now()}-${index}`;
    if (!obj.name) {
      obj.name =
        obj.type === "group" ? `Group ${index + 1}` : `Layer ${index + 1}`;
    }
  }, []);

  const processObjects = useCallback(
    (objects) => {
      return objects.map((obj, index) => {
        initializeLayer(obj, index);

        if (obj.type === "group") {
          return {
            id: obj.id,
            name: obj.name,
            visible: obj.visible,
            locked: obj.selectable === false,
            object: obj,
            type: "group",
            items: processObjects(obj.getObjects()),
          };
        }

        return {
          id: obj.id,
          name: obj.name,
          visible: obj.visible,
          locked: obj.selectable === false,
          object: obj,
          type: obj.type,
        };
      });
    },
    [initializeLayer],
  );

  const updateLayers = useCallback(() => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const processedLayers = processObjects(objects).reverse();
    setLayers(processedLayers);
  }, [canvas, processObjects]);

  useEffect(() => {
    if (!canvas) return;

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "object:visibility:changed",
      "selection:created",
      "selection:updated",
      "selection:cleared",
      "history:changed",
    ];

    events.forEach((eventName) => {
      canvas.on(eventName, updateLayers);
    });

    updateLayers();

    return () => {
      events.forEach((eventName) => {
        canvas.off(eventName, updateLayers);
      });
    };
  }, [canvas, updateLayers]);

  const toggleVisibility = (layer, e) => {
    e.stopPropagation();
    if (!canvas || !layer.object) return;

    const toggleVisibilityRecursive = (obj) => {
      obj.visible = !obj.visible;
      if (obj.type === "group") {
        obj.getObjects().forEach(toggleVisibilityRecursive);
      }
    };

    toggleVisibilityRecursive(layer.object);
    canvas.requestRenderAll();
    canvas.fire("object:visibility:changed");
  };

  const toggleLock = (layer, e) => {
    e.stopPropagation();
    if (!canvas || !layer.object) return;

    const toggleLockRecursive = (obj) => {
      obj.selectable = layer.locked;
      obj.evented = layer.locked;
      if (obj.type === "group") {
        obj.getObjects().forEach(toggleLockRecursive);
      }
    };

    toggleLockRecursive(layer.object);
    canvas.requestRenderAll();

    if (!layer.locked && canvas.getActiveObject() === layer.object) {
      canvas.discardActiveObject();
    }

    canvas.fire("object:modified");
  };

  const moveLayer = (index, direction, e, parentGroup = null) => {
    e.stopPropagation();
    if (!canvas) return;

    const moveObjectInGroup = (group, objectIndex, direction) => {
      const objects = group.getObjects();
      const currentIndex = objects.length - 1 - objectIndex;
      const newIndex =
        direction === "up"
          ? Math.min(currentIndex + 1, objects.length - 1)
          : Math.max(currentIndex - 1, 0);

      if (currentIndex === newIndex) return;

      const object = objects[currentIndex];
      objects.splice(currentIndex, 1);
      objects.splice(newIndex, 0, object);

      group._objects = objects;
      canvas.requestRenderAll();
      canvas.fire("object:modified");
    };

    if (parentGroup) {
      moveObjectInGroup(parentGroup, index, direction);
    } else {
      const objects = canvas.getObjects();
      const currentIndex = objects.length - 1 - index;
      const newIndex =
        direction === "up"
          ? Math.min(currentIndex + 1, objects.length - 1)
          : Math.max(currentIndex - 1, 0);

      if (currentIndex === newIndex) return;

      const object = objects[currentIndex];
      canvas.moveObjectTo(object, newIndex);
      canvas.requestRenderAll();
      canvas.fire("object:modified");
    }
  };

  const deleteLayer = (layer, e) => {
    e.stopPropagation();
    if (!canvas || !layer.object) return;

    canvas.remove(layer.object);
    canvas.requestRenderAll();
    canvas.fire("object:modified");
    canvas.fire("object:removed");
  };

  const handleLayerClick = (layer, e) => {
    if (!canvas || !layer.object || layer.locked) return;

    if (e.shiftKey) {
      // Handle multi-selection
      const newSelected = new Set(selectedLayers);
      if (newSelected.has(layer.id)) {
        newSelected.delete(layer.id);
      } else {
        newSelected.add(layer.id);
      }
      setSelectedLayers(newSelected);

      // Create a fabric ActiveSelection for multiple selected objects
      if (newSelected.size >= 2) {
        const selectedObjects = Array.from(newSelected)
          .map((id) => layers.find((l) => l.id === id)?.object)
          .filter(Boolean);

        const activeSelection = new ActiveSelection(selectedObjects, {
          canvas: canvas,
        });
        canvas.setActiveObject(activeSelection);
      } else {
        canvas.setActiveObject(layer.object);
      }
      canvas.requestRenderAll();
    } else {
      // Single selection
      setSelectedLayers(new Set([layer.id]));
      canvas.setActiveObject(layer.object);
      canvas.requestRenderAll();
    }
  };

  const handleNameEdit = (layer, e) => {
    e.stopPropagation();
    setEditingLayerId(layer.id);
  };

  const handleNameSave = (layer, newName) => {
    if (!canvas || !layer.object) return;

    layer.object.name = newName || layer.name;
    setEditingLayerId(null);
    canvas.fire("object:modified");
  };

  const handleKeyPress = (e, layer) => {
    if (e.key === "Enter") {
      handleNameSave(layer, e.target.value);
    }
  };

  const groupSelectedLayers = () => {
    if (selectedLayers.size < 2 || !canvas) return;

    const objectsToGroup = Array.from(selectedLayers)
      .map((id) => layers.find((layer) => layer.id === id)?.object)
      .filter(Boolean);

    if (objectsToGroup.length < 2) return;

    const group = new Group(objectsToGroup, {
      interactive: true,
      subTargetCheck: true,
      backgroundColor: "#f00f0022",
    });

    objectsToGroup.forEach((obj) => canvas.remove(obj));
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    setSelectedLayers(new Set());
    canvas.fire("object:modified");
  };

  const ungroupLayer = (layer, e) => {
    e.stopPropagation();
    if (!canvas || !layer.object || layer.type !== "group") return;

    const items = layer.object.getObjects();
    canvas.remove(layer.object);

    items.forEach((item) => {
      canvas.add(item);
    });

    canvas.discardActiveObject();
    const sel = new ActiveSelection(items, {
      canvas: canvas,
    });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
    canvas.fire("object:modified");
  };

  const renderLayer = (layer, index, depth = 0, parentGroup = null) => (
    <div key={layer.id} className={`relative ${depth > 0 ? "ml-6" : ""}`}>
      {depth > 0 && (
        <div className="absolute left-[-24px] top-0 w-px h-full bg-neutral-700" />
      )}
      {depth > 0 && (
        <div className="absolute left-[-24px] top-[20px] w-6 h-px bg-neutral-700" />
      )}

      <div
        className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200
          ${canvas && canvas.getActiveObject() === layer.object ? "bg-violet-800/80 shadow-lg shadow-violet-500/20" : layer.type === "group" ? "bg-neutral-800/80 hover:bg-neutral-700/80" : "bg-neutral-800/40 hover:bg-neutral-700/40"}
          ${selectedLayers.has(layer.id) ? "ring-2 ring-violet-500 ring-opacity-50" : ""}
          ${layer.type === "group" ? "border border-neutral-700" : ""}`}
        onClick={(e) => handleLayerClick(layer, e)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => toggleVisibility(layer, e)}
              className="hover:bg-neutral-600/50 p-1 rounded transition-colors">
              {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              onClick={(e) => toggleLock(layer, e)}
              className="hover:bg-neutral-600/50 p-1 rounded transition-colors">
              {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>

          {editingLayerId === layer.id ? (
            <input
              type="text"
              defaultValue={layer.name}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => handleNameSave(layer, e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, layer)}
              className="bg-neutral-700 text-white px-2 py-1 rounded-md text-sm flex-1 min-w-0 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {layer.type === "group" && (
                <div className="p-1 rounded bg-violet-500/20">
                  <GroupIcon size={14} className="text-violet-400" />
                </div>
              )}
              <span
                className={`text-sm truncate flex-1 ${layer.type === "group" ? "font-medium text-violet-200" : "text-neutral-200"}`}>
                {layer.name}
              </span>
              <button
                onClick={(e) => handleNameEdit(layer, e)}
                className="hover:bg-neutral-600/50 p-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {layer.type === "group" && (
            <button
              className="p-1 hover:bg-violet-600/50 rounded transition-colors"
              onClick={(e) => ungroupLayer(layer, e)}
              title="Ungroup">
              <Ungroup size={16} />
            </button>
          )}
          <button
            className="p-1 hover:bg-neutral-600/50 rounded transition-colors"
            onClick={(e) => moveLayer(index, "up", e, parentGroup)}
            disabled={parentGroup ? index === 0 : index === 0}>
            <ChevronUp size={16} className={index === 0 ? "opacity-50" : ""} />
          </button>
          <button
            className="p-1 hover:bg-neutral-600/50 rounded transition-colors"
            onClick={(e) => moveLayer(index, "down", e, parentGroup)}
            disabled={
              parentGroup
                ? index === layer.items?.length - 1
                : index === layers.length - 1
            }>
            <ChevronDown
              size={16}
              className={
                parentGroup
                  ? index === layer.items?.length - 1
                    ? "opacity-50"
                    : ""
                  : index === layers.length - 1
                    ? "opacity-50"
                    : ""
              }
            />
          </button>
          <button
            className="p-1 hover:bg-red-600/50 rounded transition-colors"
            onClick={(e) => deleteLayer(layer, e)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {layer.type === "group" && layer.items?.length > 0 && (
        <div className="mt-1 space-y-1">
          {layer.items.map((item, i) =>
            renderLayer(item, i, depth + 1, layer.object),
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed right-0 top-0 p-6 h-screen w-96 text-white">
      <div className="h-full w-full bg-neutral-900 rounded-md p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Layers ({layers.length})</h2>
          {selectedLayers.size >= 2 && (
            <button
              onClick={groupSelectedLayers}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center gap-2 text-sm">
              <GroupIcon size={14} />
              Group Selected
            </button>
          )}
        </div>

        <div className="space-y-2">
          {layers.map((layer, index) => renderLayer(layer, index))}
        </div>

        {layers.length === 0 && (
          <div className="text-neutral-400 text-sm text-center mt-8">
            No layers yet. Try uploading an image or adding elements to your
            canvas.
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
