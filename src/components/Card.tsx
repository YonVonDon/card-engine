import React, { useState, useRef, useEffect } from "react";

interface CardProps {
  id: string;
  initialX?: number;
  initialY?: number;
  pointer: { x: number; y: number };
  isHovering: boolean;            // ⭐ NEW — Scene decides hover
  onDragStart?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  zIndex?: number;
  idleEnabled: boolean;
  idleSpeed: number;
}

const DRAG_THRESHOLD = 2;

const Card: React.FC<CardProps> = ({
  id,
  initialX = 300,
  initialY = 200,
  pointer,
  isHovering,                 // ⭐ NEW
  onDragStart,
  onPositionChange,
  zIndex = 1,
  idleEnabled,
  idleSpeed,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Position + drag state
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null);

  // Tilt + glow
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const [glowX, setGlowX] = useState(0);
  const [glowY, setGlowY] = useState(0);

  const [glowFollowX, setGlowFollowX] = useState(0);
  const [glowFollowY, setGlowFollowY] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);

  // Idle offsets
  const [idleOffsetX, setIdleOffsetX] = useState(0);
  const [idleOffsetY, setIdleOffsetY] = useState(0);

  // ⭐ Idle bobbing (independent per-card animation loop)
  useEffect(() => {
    let t = 0;
    let frame: number;

    function animate() {
      t += 0.015 * idleSpeed;

      if (!isDragging && idleEnabled && !isHovering) {
        setIdleOffsetX(Math.sin(t) * 3);
        setIdleOffsetY(Math.cos(t * 0.8) * 6);
      } else {
        setIdleOffsetX(0);
        setIdleOffsetY(0);
      }

      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, idleEnabled, idleSpeed, isHovering]);

  // ⭐ Drag physics (independent per-card animation loop)
  useEffect(() => {
    let frame: number;

    function animate() {
      if (isDragging) {
        const targetX = pointer.x - dragOffset.x;
        const targetY = pointer.y - dragOffset.y;

        const LERP = 0.12;

        const newX = position.x + (targetX - position.x) * LERP;
        const newY = position.y + (targetY - position.y) * LERP;

        setPosition({ x: newX, y: newY });
        onPositionChange?.(newX, newY);

        const dx = targetX - newX;
        const dy = targetY - newY;

        const TILT = 0.12;
        setTiltX(-dy * TILT);
        setTiltY(dx * TILT);
      }

      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, pointer, dragOffset, position, onPositionChange]);

  // ⭐ Pointer down (start drag)
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;

    const rect = cardRef.current!.getBoundingClientRect();

    setClickStart({ x: pointer.x, y: pointer.y });
    setIsDragging(false);

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  // ⭐ Pointer up (end drag)
  useEffect(() => {
    function handlePointerUp() {
      setIsDragging(false);
      setClickStart(null);
      resetHoverEffects();
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  // ⭐ Right-click flip
  function onRightClick(e: React.MouseEvent) {
    e.preventDefault();

    resetHoverEffects();

    setIsFlipped(prev => {
      const newFlip = !prev;

      setGlowX(newFlip ? -glowFollowX : glowFollowX);
      setGlowY(glowFollowY);

      return newFlip;
    });
  }

  // ⭐ Drag threshold detection
  useEffect(() => {
    if (!clickStart) return;

    const dx = Math.abs(pointer.x - clickStart.x);
    const dy = Math.abs(pointer.y - clickStart.y);

    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      setIsDragging(true);
      onDragStart?.();
    }
  }, [pointer, clickStart, isDragging, onDragStart]);

  // ⭐ Hover effects (Scene-only hover)
  useEffect(() => {
    if (!isHovering || isDragging) {
      resetHoverEffects();
      return;
    }

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const xCentered = (pointer.x - (rect.left + rect.width / 2)) / rect.width;
    const yCentered = (pointer.y - (rect.top + rect.height / 2)) / rect.height;

    const rotY = xCentered * 15;
    const rotX = -yCentered * 15;

    setTiltX(rotX);
    setTiltY(rotY);

    const followX = xCentered * -40;
    const followY = yCentered * -40;

    setGlowFollowX(followX);
    setGlowFollowY(followY);

    setGlowX(isFlipped ? -followX : followX);
    setGlowY(followY);
  }, [isHovering, pointer, isDragging, isFlipped]);

  // ⭐ Reset hover effects
  function resetHoverEffects() {
    setTiltX(0);
    setTiltY(0);
    setGlowX(0);
    setGlowY(0);
    setGlowFollowX(0);
    setGlowFollowY(0);
  }

  // ⭐ Shadows
  const shadowOffsetX = -tiltY * 2;
  const shadowOffsetY = tiltX * 2;
  const shadowBlur = isDragging ? 40 : 25;
  const shadowSize = isDragging ? 50 : 35;

  const dynamicShadow = `
    ${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0,0,0,0.45),
    0 0 ${shadowSize}px rgba(0,0,0,0.35)
  `;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x + idleOffsetX,
        top: position.y + idleOffsetY,
        width: "300px",
        height: "400px",
        zIndex,
      }}
    >
      {/* Glow */}
      {isHovering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            pointerEvents: "none",
            transform: `translate(${glowX}px, ${glowY}px)`,
            filter: "blur(40px)",
            opacity: 1,
            background: isFlipped
              ? "rgba(0,200,255,0.35)"
              : "rgba(255,255,255,0.35)",
            zIndex: 0,
          }}
        />
      )}

      {/* Card body */}
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onContextMenu={onRightClick}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          overflow: "hidden",
          transformStyle: "preserve-3d",

          transform: `
            perspective(800px)
            rotateX(${tiltX}deg)
            rotateY(${(isFlipped ? 180 : 0) + tiltY}deg)
            scale(${isHovering ? 1.06 : 1})
          `,

          transition: isDragging
            ? "none"
            : "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",

          boxShadow: dynamicShadow,
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
            background: "linear-gradient(135deg, #ff8a00, #e52e71)",
            zIndex: 1,
          }}
        />

        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: `rotateY(${isFlipped ? 0 : 180}deg)`,
            background: "linear-gradient(135deg, #222, #555)",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};

export default Card;
