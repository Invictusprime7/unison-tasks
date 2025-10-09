import { useNode } from "@craftjs/core";

interface ImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  borderRadius?: string;
}

export const CraftImage = ({
  src = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
  alt = "Image",
  width = "100%",
  height = "300px",
  objectFit = "cover",
  borderRadius = "8px",
}: ImageProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <img
      ref={(ref) => ref && connect(drag(ref))}
      src={src}
      alt={alt}
      style={{
        width,
        height,
        objectFit,
        borderRadius,
        display: "block",
      }}
    />
  );
};

CraftImage.craft = {
  displayName: "Image",
  props: {
    src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    alt: "Image",
    width: "100%",
    height: "300px",
    objectFit: "cover",
    borderRadius: "8px",
  },
};
