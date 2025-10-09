import { useNode } from "@craftjs/core";
import { ReactNode } from "react";

interface ContainerProps {
  children?: ReactNode;
  padding?: string;
  margin?: string;
  background?: string;
  flexDirection?: "row" | "column";
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  className?: string;
}

export const Container = ({
  children,
  padding = "16px",
  margin = "0",
  background = "transparent",
  flexDirection = "column",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = "8px",
  className = "",
}: ContainerProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        padding,
        margin,
        background,
        display: "flex",
        flexDirection,
        alignItems,
        justifyContent,
        gap,
        minHeight: "50px",
        width: "100%",
      }}
      className={className}
    >
      {children}
    </div>
  );
};

Container.craft = {
  displayName: "Container",
  props: {
    padding: "16px",
    margin: "0",
    background: "transparent",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: "8px",
  },
};
