import React from "react";

// ============================================================================
// COLOR DEFINITIONS
// ============================================================================

export type ColorKey =
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export interface ColorDefinition {
  key: ColorKey;
  label: string;
  // Main color (hex)
  hex: string;
  // Tailwind color tokens
  tailwind: {
    bg: string; // e.g., "bg-blue-100"
    border: string; // e.g., "border-blue-300"
    text: string; // e.g., "text-blue-700"
  };
  // Badge colors (for select properties)
  badge: {
    bg: string;
    border: string;
    text: string;
  };
}

export const COLOR_DEFINITIONS: Record<ColorKey, ColorDefinition> = {
  gray: {
    key: "gray",
    label: "Gray",
    hex: "#6B7280", // gray-500
    tailwind: {
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-700",
    },
    badge: {
      bg: "#F3F4F6", // gray-100
      border: "#D1D5DB", // gray-300
      text: "#374151", // gray-700
    },
  },
  red: {
    key: "red",
    label: "Red",
    hex: "#EF4444", // red-500
    tailwind: {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-700",
    },
    badge: {
      bg: "#FEE2E2", // red-100
      border: "#FCA5A5", // red-300
      text: "#B91C1C", // red-700
    },
  },
  orange: {
    key: "orange",
    label: "Orange",
    hex: "#F97316", // orange-500
    tailwind: {
      bg: "bg-orange-100",
      border: "border-orange-300",
      text: "text-orange-700",
    },
    badge: {
      bg: "#FFEDD5", // orange-100
      border: "#FDBA74", // orange-300
      text: "#C2410C", // orange-700
    },
  },
  yellow: {
    key: "yellow",
    label: "Yellow",
    hex: "#EAB308", // yellow-500
    tailwind: {
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      text: "text-yellow-700",
    },
    badge: {
      bg: "#FEF3C7", // yellow-100
      border: "#FCD34D", // yellow-300
      text: "#A16207", // yellow-700
    },
  },
  green: {
    key: "green",
    label: "Green",
    hex: "#10B981", // emerald-500
    tailwind: {
      bg: "bg-emerald-100",
      border: "border-emerald-300",
      text: "text-emerald-700",
    },
    badge: {
      bg: "#D1FAE5", // emerald-100
      border: "#6EE7B7", // emerald-300
      text: "#047857", // emerald-700
    },
  },
  blue: {
    key: "blue",
    label: "Blue",
    hex: "#3B82F6", // blue-500
    tailwind: {
      bg: "bg-blue-100",
      border: "border-blue-300",
      text: "text-blue-700",
    },
    badge: {
      bg: "#DBEAFE", // blue-100
      border: "#93C5FD", // blue-300
      text: "#1D4ED8", // blue-700
    },
  },
  purple: {
    key: "purple",
    label: "Purple",
    hex: "#8B5CF6", // purple-500
    tailwind: {
      bg: "bg-purple-100",
      border: "border-purple-300",
      text: "text-purple-700",
    },
    badge: {
      bg: "#F3E8FF", // purple-100
      border: "#D8B4FE", // purple-300
      text: "#7C3AED", // purple-700
    },
  },
  pink: {
    key: "pink",
    label: "Pink",
    hex: "#EC4899", // pink-500
    tailwind: {
      bg: "bg-pink-100",
      border: "border-pink-300",
      text: "text-pink-700",
    },
    badge: {
      bg: "#FCE7F3", // pink-100
      border: "#F9A8D4", // pink-300
      text: "#BE185D", // pink-700
    },
  },
};

// ============================================================================
// SHAPE DEFINITIONS
// ============================================================================

export type ShapeKey =
  | "rect"
  | "circle"
  | "diamond"
  | "hexagon"
  | "cylinder"
  | "parallelogram"
  | "triangle";

export interface ShapeRenderProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ResizeRenderProps {
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
}

export interface ShapeDefinition {
  key: ShapeKey;
  label: string;
  icon: React.ReactNode;
  // SVG rendering helpers
  getShapeProps: (
    props: ShapeRenderProps
  ) => React.SVGProps<SVGRectElement | SVGEllipseElement | SVGPolygonElement>;
  getResizeProps: (
    props: ResizeRenderProps
  ) => React.SVGProps<SVGRectElement | SVGEllipseElement | SVGPolygonElement>;
}

export const SHAPE_DEFINITIONS: Record<ShapeKey, ShapeDefinition> = {
  rect: {
    key: "rect",
    label: "Rectangle",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("rect", {
        x: "3",
        y: "5",
        width: "14",
        height: "10",
        rx: "2",
        fill: "currentColor",
      })
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => ({
      x: 0,
      y: 0,
      width,
      height,
      rx: 8,
      fill,
      stroke,
      strokeWidth,
    }),
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => ({
      x: 0,
      y: 0,
      width,
      height,
      rx: 8,
      fill: "none",
      stroke,
      strokeWidth,
      strokeDasharray,
    }),
  },
  circle: {
    key: "circle",
    label: "Circle",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("ellipse", {
        cx: "10",
        cy: "10",
        rx: "7",
        ry: "5",
        fill: "currentColor",
      })
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => ({
      cx: width / 2,
      cy: height / 2,
      rx: width / 2,
      ry: height / 2,
      fill,
      stroke,
      strokeWidth,
    }),
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => ({
      cx: width / 2,
      cy: height / 2,
      rx: width / 2,
      ry: height / 2,
      fill: "none",
      stroke,
      strokeWidth,
      strokeDasharray,
    }),
  },
  diamond: {
    key: "diamond",
    label: "Diamond",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("polygon", {
        points: "10,3 17,10 10,17 3,10",
        fill: "currentColor",
      })
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => {
      const halfW = width / 2;
      const halfH = height / 2;
      const points = [
        `${halfW},0`,
        `${width},${halfH}`,
        `${halfW},${height}`,
        `0,${halfH}`,
      ].join(" ");
      return {
        points,
        fill,
        stroke,
        strokeWidth,
      };
    },
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => {
      const halfW = width / 2;
      const halfH = height / 2;
      const points = [
        `${halfW},0`,
        `${width},${halfH}`,
        `${halfW},${height}`,
        `0,${halfH}`,
      ].join(" ");
      return {
        points,
        fill: "none",
        stroke,
        strokeWidth,
        strokeDasharray,
      };
    },
  },
  hexagon: {
    key: "hexagon",
    label: "Hexagon",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("polygon", {
        points: "6,4 14,4 18,10 14,16 6,16 2,10",
        fill: "currentColor",
      })
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => {
      const dx = width / 4;
      const halfH = height / 2;
      const points = [
        `${dx},0`,
        `${width - dx},0`,
        `${width},${halfH}`,
        `${width - dx},${height}`,
        `${dx},${height}`,
        `0,${halfH}`,
      ].join(" ");
      return {
        points,
        fill,
        stroke,
        strokeWidth,
      };
    },
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => {
      const dx = width / 4;
      const halfH = height / 2;
      const points = [
        `${dx},0`,
        `${width - dx},0`,
        `${width},${halfH}`,
        `${width - dx},${height}`,
        `${dx},${height}`,
        `0,${halfH}`,
      ].join(" ");
      return {
        points,
        fill: "none",
        stroke,
        strokeWidth,
        strokeDasharray,
      };
    },
  },
  cylinder: {
    key: "cylinder",
    label: "Cylinder",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("g", { key: "cylinder-group" }, [
        React.createElement("ellipse", {
          key: "top-ellipse",
          cx: "10",
          cy: "4",
          rx: "7",
          ry: "2",
          fill: "currentColor",
        }),
        React.createElement("rect", {
          key: "middle-rect",
          x: "3",
          y: "4",
          width: "14",
          height: "12",
          fill: "currentColor",
        }),
        React.createElement("ellipse", {
          key: "bottom-ellipse",
          cx: "10",
          cy: "16",
          rx: "7",
          ry: "2",
          fill: "currentColor",
        }),
      ])
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => {
      const rx = width / 2;
      const ry = height / 8;
      return {
        cx: width / 2,
        cy: ry,
        rx,
        ry,
        fill,
        stroke,
        strokeWidth,
      };
    },
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => {
      const rx = width / 2;
      const ry = height / 8;
      return {
        cx: width / 2,
        cy: ry,
        rx,
        ry,
        fill: "none",
        stroke,
        strokeWidth,
        strokeDasharray,
      };
    },
  },
  parallelogram: {
    key: "parallelogram",
    label: "Parallelogram",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("polygon", {
        points: "4,3 16,3 12,17 0,17",
        fill: "currentColor",
      })
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => {
      const offset = width / 4;
      const points = [
        `${offset},0`,
        `${width},0`,
        `${width - offset},${height}`,
        `0,${height}`,
      ].join(" ");
      return {
        points,
        fill,
        stroke,
        strokeWidth,
      };
    },
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => {
      const offset = width / 4;
      const points = [
        `${offset},0`,
        `${width},0`,
        `${width - offset},${height}`,
        `0,${height}`,
      ].join(" ");
      return {
        points,
        fill: "none",
        stroke,
        strokeWidth,
        strokeDasharray,
      };
    },
  },
  triangle: {
    key: "triangle",
    label: "Triangle",
    icon: React.createElement(
      "svg",
      { viewBox: "0 0 20 20", className: "h-5 w-5" },
      React.createElement("polygon", {
        points: "10,2 18,18 2,18",
        fill: "currentColor",
      })
    ),
    getShapeProps: ({
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: ShapeRenderProps) => {
      const halfW = width / 2;
      const points = [`${halfW},0`, `${width},${height}`, `0,${height}`].join(
        " "
      );
      return {
        points,
        fill,
        stroke,
        strokeWidth,
      };
    },
    getResizeProps: ({
      width,
      height,
      stroke,
      strokeWidth,
      strokeDasharray,
    }: ResizeRenderProps) => {
      const halfW = width / 2;
      const points = [`${halfW},0`, `${width},${height}`, `0,${height}`].join(
        " "
      );
      return {
        points,
        fill: "none",
        stroke,
        strokeWidth,
        strokeDasharray,
      };
    },
  },
};

// ============================================================================
// SHAPE POLICY
// ============================================================================

export class ShapePolicy {
  /**
   * Get color definition by key
   */
  static getColorDefinition(colorKey: ColorKey): ColorDefinition {
    if (!colorKey || !COLOR_DEFINITIONS[colorKey]) {
      return COLOR_DEFINITIONS[this.getDefaultColor()];
    }
    return COLOR_DEFINITIONS[colorKey];
  }

  /**
   * Get shape definition by key
   */
  static getShapeDefinition(shapeKey: ShapeKey): ShapeDefinition {
    if (!shapeKey || !SHAPE_DEFINITIONS[shapeKey]) {
      return SHAPE_DEFINITIONS[this.getDefaultShape()];
    }
    return SHAPE_DEFINITIONS[shapeKey];
  }

  /**
   * Get all available colors for select options
   */
  static getColorOptions(): Array<{
    label: string;
    value: string;
    color?: string;
  }> {
    return Object.values(COLOR_DEFINITIONS).map((color) => ({
      label: color.label,
      value: color.key,
      color: color.key,
    }));
  }

  /**
   * Get all available shapes for select options
   */
  static getShapeOptions(): Array<{ label: string; value: string }> {
    return Object.values(SHAPE_DEFINITIONS).map((shape) => ({
      label: shape.label,
      value: shape.key,
    }));
  }

  /**
   * Get badge style classes for a color
   */
  static getBadgeStyle(colorKey: ColorKey): string {
    const color = this.getColorDefinition(colorKey);
    return `${color.tailwind.bg} ${color.tailwind.border} ${color.tailwind.text}`;
  }

  /**
   * Get badge style object for inline styles
   */
  static getBadgeStyleObject(colorKey: ColorKey): {
    backgroundColor: string;
    borderColor: string;
    color: string;
  } {
    const color = this.getColorDefinition(colorKey);
    return {
      backgroundColor: color.badge.bg,
      borderColor: color.badge.border,
      color: color.badge.text,
    };
  }

  /**
   * Get background color for shape fill
   */
  static getShapeBackgroundColor(colorKey: ColorKey): string {
    const color = this.getColorDefinition(colorKey);
    return color.badge.bg;
  }

  /**
   * Get text color for shape content
   */
  static getTextColor(colorKey: ColorKey): string {
    const color = this.getColorDefinition(colorKey);
    return color.badge.text;
  }

  /**
   * Get border color for shape outline
   */
  static getBorderColor(colorKey: ColorKey): string {
    const color = this.getColorDefinition(colorKey);
    return color.badge.border;
  }

  /**
   * Get main hex color (using pastel color for consistency)
   */
  static getHexColor(colorKey: ColorKey): string {
    const color = this.getColorDefinition(colorKey);
    return color.badge.bg; // Use pastel background color instead of main hex
  }

  /**
   * Get original main hex color (for specific use cases)
   */
  static getMainHexColor(colorKey: ColorKey): string {
    const color = this.getColorDefinition(colorKey);
    return color.hex;
  }

  /**
   * Get ColorKey from hex color (simple matching)
   */
  static getClosestColorKey(hexColor: string): ColorKey {
    if (!hexColor || !hexColor.startsWith("#")) {
      return this.getDefaultColor();
    }

    // Try to match with pastel colors first, then main hex colors
    const colorDef = Object.values(COLOR_DEFINITIONS).find(
      (def) =>
        def.badge.bg.toLowerCase() === hexColor.toLowerCase() ||
        def.hex.toLowerCase() === hexColor.toLowerCase()
    );

    return colorDef ? colorDef.key : this.getDefaultColor();
  }

  /**
   * Get selection border color (always blue)
   */
  static getSelectionBorderColor(): string {
    return "#3b82f6"; // blue-500
  }

  /**
   * Get shape props for React component
   */
  static getShapeComponentProps(
    shapeKey: ShapeKey,
    colorKey: ColorKey,
    width: number,
    height: number
  ): React.SVGProps<SVGRectElement | SVGEllipseElement | SVGPolygonElement> {
    const shape = this.getShapeDefinition(shapeKey);
    const color = this.getColorDefinition(colorKey);
    return shape.getShapeProps({
      width,
      height,
      fill: color.badge.bg,
      stroke: color.badge.border,
      strokeWidth: 3,
    });
  }

  /**
   * Get resize props for React component with border color
   */
  static getResizeComponentProps(
    shapeKey: ShapeKey,
    colorKey: ColorKey,
    width: number,
    height: number
  ): React.SVGProps<SVGRectElement | SVGEllipseElement | SVGPolygonElement> {
    const shape = this.getShapeDefinition(shapeKey);
    const color = this.getColorDefinition(colorKey);
    return shape.getResizeProps({
      width,
      height,
      stroke: color.badge.border, // Use shape border color
      strokeWidth: 2,
      strokeDasharray: "5,5",
    });
  }

  /**
   * Get default color (gray)
   */
  static getDefaultColor(): ColorKey {
    return "gray";
  }

  /**
   * Get default shape (rectangle)
   */
  static getDefaultShape(): ShapeKey {
    return "rect";
  }
}
