import React, { useState, useRef, useEffect } from "react";

interface CardProps {
  id: string;
  initialX?: number;
  initialY?: number;
  pointer: { x: number; y: number };
  onDragStart?: () => void;     // ⭐ NEW
  zIndex?: number;              // ⭐ NEW
}

const DRAG_THRESHOLD = 2;

const Card: React.FC<CardProps> = ({
  id,
  initialX = 300,
  initialY = 200,
  pointer,
  onDragStart,
  zIndex = 1,                  // ⭐ NEW default
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // POSITION + DRAGGING
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null);

  // HOVER / TILT / GLOW
  const [isHovering, setIsHovering] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const [glowX, setGlowX] = useState(0);
  const [glowY, setGlowY] = useState(0);

  const [glowFollowX, setGlowFollowX] = useState(0);
  const [glowFollowY, setGlowFollowY] = useState(0);

  // FLIP
  const [isFlipped, setIsFlipped] = useState(false);

  // Freeze hover until pointer moves again
  const [hoverFrozen, setHoverFrozen] = useState(false);

  // -----------------------------
  // LEFT CLICK → DRAG START PREP
  // -----------------------------
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;

    const rect = cardRef.current!.getBoundingClientRect();

    setHoverFrozen(true);
    resetHoverEffects();

    setClickStart({ x: pointer.x, y: pointer.y });
    setIsDragging(false);

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  // -----------------------------
  // GLOBAL POINTERUP → DROP CARD
  // -----------------------------
  useEffect(() => {
    function handlePointerUp() {
      setIsDragging(false);
      setClickStart(null);
      resetHoverEffects();
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  // -----------------------------
  // RIGHT CLICK → FLIP
  // -----------------------------
  function onRightClick(e: React.MouseEvent) {
    e.preventDefault();

    setHoverFrozen(true);
    resetHoverEffects();

    setIsFlipped(prev => {
      const newFlip = !prev;

      setGlowX(newFlip ? -glowFollowX : glowFollowX);
      setGlowY(glowFollowY);

      return newFlip;
    });
  }

  // -----------------------------
  // UNFREEZE HOVER WHEN POINTER MOVES
  // -----------------------------
  useEffect(() => {
    setHoverFrozen(false);
  }, [pointer.x, pointer.y]);

  // -----------------------------
  // DRAG MOVEMENT + THRESHOLD
  // -----------------------------
  useEffect(() => {
    if (!clickStart) return;

    const dx = Math.abs(pointer.x - clickStart.x);
    const dy = Math.abs(pointer.y - clickStart.y);

    // ⭐ NEW: notify Scene when drag actually begins
    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      setIsDragging(true);
      onDragStart?.();   // ⭐ NEW
    }

    if (isDragging) {
      setPosition({
        x: pointer.x - dragOffset.x,
        y: pointer.y - dragOffset.y,
      });
    }
  }, [pointer, clickStart, isDragging, dragOffset, onDragStart]);

  // -----------------------------
  // HOVER / TILT / GLOW
  // -----------------------------
  useEffect(() => {
    if (hoverFrozen) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const { x: clientX, y: clientY } = pointer;

    const radius = 0;

    const isNear =
      clientX > rect.left - radius &&
      clientX < rect.right + radius &&
      clientY > rect.top - radius &&
      clientY < rect.bottom + radius;

    if (isDragging) {
      setIsHovering(false);
      setTiltX(0);
      setTiltY(0);
      setGlowX(0);
      setGlowY(0);
      return;
    }

    setIsHovering(isNear);

    if (!isNear) {
      resetHoverEffects();
      return;
    }

    const xCentered = (clientX - (rect.left + rect.width / 2)) / rect.width;
    const yCentered = (clientY - (rect.top + rect.height / 2)) / rect.height;

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
  }, [pointer, hoverFrozen, isDragging, isFlipped]);

  // -----------------------------
  // RESET HOVER EFFECTS
  // -----------------------------
  function resetHoverEffects() {
    setIsHovering(false);
    setTiltX(0);
    setTiltY(0);
    setGlowX(0);
    setGlowY(0);
    setGlowFollowX(0);
    setGlowFollowY(0);
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: "300px",
        height: "400px",
        zIndex,                 // ⭐ NEW
      }}
    >
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onContextMenu={onRightClick}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "20px",
          overflow: "hidden",
          transformStyle: "preserve-3d",

          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          outline: "none",
          WebkitTapHighlightColor: "transparent",

          transform: `
            perspective(800px)
            rotateX(${tiltX}deg)
            rotateY(${(isFlipped ? 180 : 0) + tiltY}deg)
            scale(${isHovering ? 1.06 : 1})
          `,

          transition: isDragging
            ? "none"
            : "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",

          boxShadow: isHovering
            ? isFlipped
              ? `${glowX}px ${glowY}px 50px rgba(0, 200, 255, 0.35)`
              : `${glowX}px ${glowY}px 50px rgba(255, 255, 255, 0.35)`
            : "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* FRONT */}
        <div
          style={{
            position: "absolute",
            width: "102%",
            height: "102%",
            left: "-1%",
            top: "-1%",
            backfaceVisibility: "hidden",
            transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
            background: "linear-gradient(135deg, #ff8a00, #e52e71)",
          }}
        />

        {/* BACK */}
        <div
          style={{
            position: "absolute",
            width: "102%",
            height: "102%",
            left: "-1%",
            top: "-1%",
            backfaceVisibility: "hidden",
            transform: `rotateY(${isFlipped ? 0 : 180}deg)`,
            background: "linear-gradient(135deg, #222, #555)",
          }}
        />
      </div>
    </div>
  );
};

export default Card;
