import { Textbox } from "fabric";
import {
  AlertCircle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Type,
  Underline,
  X,
} from "lucide-react";
import { useState } from "react";
import { ChromePicker } from "react-color";
import { useEditor } from "../../contexts/EditorContext.jsx";

const fonts = [
  "Chakra Petch",
  "Impact",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Helvetica",
];

const TextEditor = ({ canvas, isOpen, onClose }) => {
  const { textOptions, setTextOptions, textMode, setTextMode } = useEditor();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const addText = () => {
    if (!canvas) return;
    if (textMode == "create") {
      const text = new Textbox(textOptions.text, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        stroke: textOptions.stroke,
        strokeWidth: textOptions.strokeWidth,
        originY: "center",
        textAlign: textOptions.textAlign,
        fontSize: textOptions.fontSize,
        fontFamily: textOptions.fontFamily,
        fill: textOptions.fill,
        backgroundColor: textOptions.backgroundColor,
        fontWeight: textOptions.bold ? "bold" : "normal",
        fontStyle: textOptions.italic ? "italic" : "normal",
        underline: textOptions.underline,
        id: `text-${Date.now()}`,
        name: "Text Layer",
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();

      setTextMode("edit");
    } else {
      const activeObject = canvas.getActiveObject();
      if (
        !activeObject ||
        (activeObject.type !== "textbox" && activeObject.type !== "text")
      )
        return;
      // Update the selected text object with current options
      activeObject.set({
        text: textOptions.text,
        fontSize: textOptions.fontSize,
        fontFamily: textOptions.fontFamily,
        textAlign: textOptions.textAlign,
        fill: textOptions.fill,
        backgroundColor: textOptions.backgroundColor,
        fontWeight: textOptions.bold ? "bold" : "normal",
        fontStyle: textOptions.italic ? "italic" : "normal",
        stroke: textOptions.stroke,
        strokeWidth: textOptions.strokeWidth,
        underline: textOptions.underline,
      });

      canvas.requestRenderAll();
      setTextMode("create");
    }
  };

  const toggleAlign = (style) => {
    setTextOptions((prev) => ({ ...prev, textAlign: style }));
  };

  const toggleStyle = (style) => {
    setTextOptions((prev) => ({ ...prev, [style]: !prev[style] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-24 top-[16rem] bg-neutral-200 box-shadow-3d w-64 text-neutral-900 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Type size={16} />
          <h3 className="font-medium text-sm">
            {textMode == "create" ? "Add text" : "Modify text"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <AlertCircle size={14} className="text-neutral-400" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Double click text to edit after adding
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-violet-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={textOptions.text}
          onChange={(e) =>
            setTextOptions((prev) => ({ ...prev, text: e.target.value }))
          }
          className="w-full px-2 py-1.5 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm"
          rows={2}
          placeholder="Enter your text..."
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1 text-neutral-600">Color</label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowBgColorPicker(false);
                  setShowStrokePicker(false);
                }}
                className="w-full h-7 rounded-lg flex items-center px-2 bg-neutral-300 hover:bg-neutral-400 transition-colors">
                <div
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: textOptions.fill }}
                />
                <span className="text-xs">{textOptions.fill}</span>
              </button>
              {showColorPicker && (
                <div className="absolute z-50 mt-1">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <ChromePicker
                    color={textOptions.fill}
                    onChange={(color) =>
                      setTextOptions((prev) => ({ ...prev, fill: color.hex }))
                    }
                    disableAlpha={true}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 text-neutral-600">
              Background
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowBgColorPicker(!showBgColorPicker);
                  setShowColorPicker(false);
                  setShowStrokePicker(false);
                }}
                className="w-full h-7 rounded-lg flex items-center px-2 bg-neutral-300 hover:bg-neutral-400 transition-colors">
                <div className="w-4 h-4 rounded mr-2 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==')] border border-neutral-400">
                  <div
                    className="w-full h-full rounded"
                    style={{ backgroundColor: textOptions.backgroundColor }}
                  />
                </div>
                <span className="text-xs truncate">
                  {textOptions.backgroundColor}
                </span>
              </button>
              {showBgColorPicker && (
                <div className="absolute z-50 mt-1">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowBgColorPicker(false)}
                  />
                  <ChromePicker
                    color={textOptions.backgroundColor}
                    onChange={(color) => {
                      const alpha = Math.round(color.rgb.a * 255)
                        .toString(16)
                        .padStart(2, "0");
                      setTextOptions((prev) => ({
                        ...prev,
                        backgroundColor: color.hex + alpha,
                      }));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1 text-neutral-600">Size</label>
            <input
              type="number"
              value={textOptions.fontSize}
              onChange={(e) =>
                setTextOptions((prev) => ({
                  ...prev,
                  fontSize: parseInt(e.target.value),
                }))
              }
              min={8}
              max={200}
              className="w-full px-2 py-1 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-neutral-600">Font</label>
            <select
              value={textOptions.fontFamily}
              onChange={(e) =>
                setTextOptions((prev) => ({
                  ...prev,
                  fontFamily: e.target.value,
                }))
              }
              className="w-full px-2 py-1 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm">
              {fonts.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1 text-neutral-600">
              Stroke Width
            </label>
            <input
              type="number"
              value={textOptions.strokeWidth}
              onChange={(e) =>
                setTextOptions((prev) => ({
                  ...prev,
                  strokeWidth: parseInt(e.target.value),
                }))
              }
              min={8}
              max={200}
              className="w-full px-2 py-1 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-neutral-600">
              Stroke Color
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowStrokePicker(!showColorPicker);
                  setShowBgColorPicker(false);
                  setShowColorPicker(false);
                }}
                className="w-full h-7 rounded-lg flex items-center px-2 bg-neutral-300 hover:bg-neutral-400 transition-colors">
                <div className="w-4 h-4 rounded mr-2 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==')] border border-neutral-400">
                  <div
                    className="w-4 h-4 rounded mr-2"
                    style={{ backgroundColor: textOptions.stroke }}
                  />
                </div>

                <span className="text-xs">{textOptions.stroke}</span>
              </button>
              {showStrokePicker && (
                <div className="absolute z-50 mt-1">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowStrokePicker(false)}
                  />
                  <ChromePicker
                    className="z-[100]"
                    color={textOptions.stroke}
                    onChange={(color) =>
                      setTextOptions((prev) => ({ ...prev, stroke: color.hex }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            {[
              { key: "bold", Icon: Bold },
              { key: "italic", Icon: Italic },
              { key: "underline", Icon: Underline },
            ].map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => toggleStyle(key)}
                className={`p-1.5 rounded-lg transition-colors ${textOptions[key] ? "bg-violet-500 text-white" : "bg-neutral-300 text-neutral-600"}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[
              { key: "left", Icon: AlignLeft },
              { key: "center", Icon: AlignCenter },
              { key: "justify", Icon: AlignJustify },
              { key: "right", Icon: AlignRight },
            ].map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => toggleAlign(key)}
                className={`p-1.5 rounded-lg transition-colors ${textOptions.textAlign == key ? "bg-violet-500 text-white" : "bg-neutral-300 text-neutral-600"}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={addText}
          className="px-4 w-full py-1.5 bg-violet-500 text-white text-sm rounded-lg hover:bg-violet-600 transition-colors">
          {textMode == "create" ? "Add" : "Modify"}
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
