import { useNode } from "@craftjs/core";
import { ReactNode } from "react";

interface CardProps {
  children?: ReactNode;
  padding?: string;
  borderRadius?: string;
  boxShadow?: string;
  background?: string;
  border?: string;
}

export const CraftCard = ({
  children,
  padding = "24px",
  borderRadius = "8px",
  boxShadow = "0 2px 8px rgba(0,0,0,0.1)",
  background = "hsl(var(--card))",
  border = "1px solid hsl(var(--border))",
}: CardProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        padding,
        borderRadius,
        boxShadow,
        background,
        border,
        minHeight: "100px",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
};

CraftCard.craft = {
  displayName: "Card",
  props: {
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
  },
};
