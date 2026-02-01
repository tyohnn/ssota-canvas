"use client";

/**
 * ShapeBlockView
 *
 * Shape 블록의 순수 렌더링 View 컴포넌트입니다.
 * 편집 로직 없이 SVG 도형과 텍스트만 렌더링합니다.
 * Landing 데모 및 다른 context에서 재사용 가능합니다.
 */

import { useMemo } from "react";
import { cn } from "@workspace/ui/lib/utils";
import {
  ColorToken,
  getGlowColor,
} from "@/domains/block-management/shared/types/style-tokens.types";
import { ShapeType } from "@/domains/block-management/shared/value-objects/block-properties";

// 색상 매핑 (ColorToken을 실제 색상 값으로 변환)
const colorMap: Record<ColorToken, { fill: string; stroke: string; text: string }> = {
  [ColorToken.GRAY]: { fill: "#f3f4f6", stroke: "#9ca3af", text: "#374151" },
  [ColorToken.RED]: { fill: "#fee2e2", stroke: "#ef4444", text: "#991b1b" },
  [ColorToken.ORANGE]: { fill: "#ffedd5", stroke: "#f97316", text: "#9a3412" },
  [ColorToken.AMBER]: { fill: "#fef3c7", stroke: "#eab308", text: "#854d0e" },
  [ColorToken.GREEN]: { fill: "#d1fae5", stroke: "#10b981", text: "#065f46" },
  [ColorToken.BLUE]: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
  [ColorToken.PURPLE]: { fill: "#ede9fe", stroke: "#a855f7", text: "#6b21a8" },
  [ColorToken.PINK]: { fill: "#fce7f3", stroke: "#ec4899", text: "#9f1239" },
};

export interface ShapeBlockViewProps {
  /** 도형 타입 */
  shapeType: ShapeType;
  /** 색상 토큰 */
  color: ColorToken;
  /** 테두리 스타일 */
  borderStyle?: "solid" | "dashed" | "dotted";
  /** 표시할 텍스트 */
  content: string;
  /** 노드 너비 */
  width: number;
  /** 노드 높이 */
  height: number;
  /** 선택 상태 */
  selected?: boolean;
  /** 호버 상태 */
  isHovered?: boolean;
  /** 호버 시작 핸들러 */
  onMouseEnter?: () => void;
  /** 호버 종료 핸들러 */
  onMouseLeave?: () => void;
  /** 클릭 핸들러 */
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Shape SVG 렌더링 함수
 */
function useShapeSvg(
  shapeType: ShapeType,
  width: number,
  height: number,
  colors: { fill: string; stroke: string; text: string },
  strokeDasharray: string
) {
  return useMemo(() => {
    const commonProps = {
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      strokeDasharray,
    };

    switch (shapeType) {
      case ShapeType.RECTANGLE:
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={8}
            {...commonProps}
          />
        );

      case ShapeType.ELLIPSE:
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2}
            ry={height / 2}
            {...commonProps}
          />
        );

      case ShapeType.TRIANGLE:
        const trianglePoints = `${width / 2},0 ${width},${height} 0,${height}`;
        return <polygon points={trianglePoints} {...commonProps} />;

      case ShapeType.DIAMOND:
        const diamondPoints = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
        return <polygon points={diamondPoints} {...commonProps} />;

      case ShapeType.HEXAGON:
        const hexW = width / 4;
        const hexagonPoints = `${hexW},0 ${width - hexW},0 ${width},${height / 2} ${width - hexW},${height} ${hexW},${height} 0,${height / 2}`;
        return <polygon points={hexagonPoints} {...commonProps} />;

      case ShapeType.PARALLELOGRAM:
        const offset = width / 4;
        const parallelogramPoints = `${offset},0 ${width},0 ${width - offset},${height} 0,${height}`;
        return <polygon points={parallelogramPoints} {...commonProps} />;

      case ShapeType.CYLINDER:
        return (
          <g>
            {/* Bottom ellipse (바닥) */}
            <ellipse
              cx={width / 2}
              cy={(height * 7) / 8}
              rx={width / 2}
              ry={height / 8}
              {...commonProps}
            />
            {/* Middle rectangle (몸통) */}
            <rect
              x={0}
              y={height / 8}
              width={width}
              height={(height * 3) / 4}
              fill={commonProps.fill}
              stroke="none"
            />
            {/* Side lines (옆면) */}
            <line
              x1={0}
              y1={height / 8}
              x2={0}
              y2={(height * 7) / 8}
              stroke={commonProps.stroke}
              strokeWidth={commonProps.strokeWidth}
              strokeDasharray={commonProps.strokeDasharray}
            />
            <line
              x1={width}
              y1={height / 8}
              x2={width}
              y2={(height * 7) / 8}
              stroke={commonProps.stroke}
              strokeWidth={commonProps.strokeWidth}
              strokeDasharray={commonProps.strokeDasharray}
            />
            {/* Top ellipse (윗면) - 마지막에 그려서 앞에 보이도록 */}
            <ellipse
              cx={width / 2}
              cy={height / 8}
              rx={width / 2}
              ry={height / 8}
              {...commonProps}
            />
          </g>
        );

      default:
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={8}
            {...commonProps}
          />
        );
    }
  }, [shapeType, width, height, colors, strokeDasharray]);
}

export function ShapeBlockView({
  shapeType,
  color,
  borderStyle = "solid",
  content,
  width,
  height,
  selected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ShapeBlockViewProps) {
  const colors = colorMap[color] || colorMap[ColorToken.BLUE];

  // Border style을 SVG stroke-dasharray로 변환
  const strokeDasharray =
    borderStyle === "dashed" ? "8,4" : borderStyle === "dotted" ? "2,4" : "0";

  const shapeSvg = useShapeSvg(shapeType, width, height, colors, strokeDasharray);

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col rounded-lg",
        "transition-all duration-300 ease-out"
      )}
      style={
        {
          "--glow-color": getGlowColor(color),
        } as React.CSSProperties
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="relative flex items-center justify-center w-full h-full"
        onClick={onClick}
      >
        {/* SVG 도형 - 전체 크기에 꽉 채움 */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible transition-all duration-300"
          style={{
            filter: [
              // 기본 그림자 (항상)
              "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))",
              // 호버/선택 시 그림자 강화
              ((isHovered && !selected) || selected) &&
                "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))",
              // 호버/선택 시 글로우
              ((isHovered && !selected) || selected) &&
                `drop-shadow(0 0 4px ${getGlowColor(color)})`,
            ]
              .filter(Boolean)
              .join(" "),
          }}
          preserveAspectRatio="none"
        >
          {shapeSvg}
        </svg>

        {/* 텍스트 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="w-full h-full flex items-center justify-center text-center"
            style={{
              fontSize: "14px",
              fontWeight: "500",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              lineHeight: "1.4",
              color: colors.text,
            }}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
