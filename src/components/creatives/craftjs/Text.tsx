import { useNode } from "@craftjs/core";
import { useState } from "react";

interface TextProps {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  margin?: string;
}

export const CraftText = ({
  text = "Edit this text",
  fontSize = "14px",
  fontWeight = "400",
  color = "hsl(var(--foreground))",
  textAlign = "left",
  margin = "0",
}: TextProps) => {
  const {
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode();
  const [editable, setEditable] = useState(false);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      onClick={() => setEditable(true)}
      onBlur={() => setEditable(false)}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={(e) => {
        setProp((props: TextProps) => {
          props.text = e.currentTarget.textContent || "";
        });
      }}
      style={{
        fontSize,
        fontWeight,
        color,
        textAlign,
        margin,
        cursor: editable ? "text" : "pointer",
        outline: "none",
        minHeight: "20px",
      }}
    >
      {text}
    </div>
  );
};

CraftText.craft = {
  displayName: "Text",
  props: {
    text: "Edit this text",
    fontSize: "14px",
    fontWeight: "400",
    color: "hsl(var(--foreground))",
    textAlign: "left",
    margin: "0",
  },
};
