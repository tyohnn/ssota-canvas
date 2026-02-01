"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

export function MagneticDotsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Setup canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Initialize dots
      initializeDots(rect.width, rect.height);
    };

    const initializeDots = (width: number, height: number) => {
      const spacing = 20;
      const dots: Dot[] = [];

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
          });
        }
      }

      dotsRef.current = dots;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isInside =
        x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      mouseRef.current = isInside ? { x, y } : { x: -1000, y: -1000 };
    };

    // Get theme color
    const getThemeColor = () => {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const mouse = mouseRef.current;
      const magneticRadius = 220; // Radius of magnetic effect
      const magneticStrength = 0.65; // How strong the pull is
      const returnSpeed = 0.12; // How fast dots return to base position

      dotsRef.current.forEach((dot) => {
        // Calculate distance from mouse
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magneticRadius) {
          // Apply magnetic force (pull towards mouse)
          const force = (1 - distance / magneticRadius) * magneticStrength;
          dot.vx += (dx / distance) * force;
          dot.vy += (dy / distance) * force;
        }

        // Apply return force (pull back to base position)
        const returnDx = dot.baseX - dot.x;
        const returnDy = dot.baseY - dot.y;
        dot.vx += returnDx * returnSpeed;
        dot.vy += returnDy * returnSpeed;

        // Apply damping (slightly lighter so movement feels stronger)
        dot.vx *= 0.88;
        dot.vy *= 0.88;

        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = getThemeColor();
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    updateCanvasSize();
    animate();

    // Listen on window so we get events even though canvas has pointer-events-none
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", updateCanvasSize);

    // ResizeObserver: 캔버스/부모 컨테이너 크기 변경 감지 (모바일↔PC 전환, 미디어 쿼리 등)
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
