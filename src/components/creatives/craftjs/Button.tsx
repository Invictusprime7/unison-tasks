import { useNode } from "@craftjs/core";

interface ButtonProps {
  text?: string;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
}

export const CraftButton = ({
  text = "Click me",
  color = "#ffffff",
  backgroundColor = "hsl(var(--primary))",
  padding = "12px 24px",
  borderRadius = "6px",
  fontSize = "14px",
  fontWeight = "500",
}: ButtonProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <button
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        color,
        backgroundColor,
        padding,
        borderRadius,
        fontSize,
        fontWeight,
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      {text}
    </button>
  );
};

CraftButton.craft = {
  displayName: "Button",
  props: {
    text: "Click me",
    color: "#ffffff",
    backgroundColor: "hsl(var(--primary))",
    padding: "12px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
  },
};
