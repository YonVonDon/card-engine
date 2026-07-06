import React, { useState, useRef, useEffect } from "react";

export const DECK_WIDTH = 340;
export const DECK_HEIGHT = 460;

interface DeckCardProps {
  x: number;
  y: number;
  pointer: { x: number; y: number };
  isHovering: boolean;
  onDragStart?: () => void;
  onPositionChange?: (x: number, y: number) => void;
}

const DRAG_THRESHOLD = 2;

const DeckCard: React.FC<DeckCardProps> = ({
  x,
  y,
  pointer,
  isHovering,
  onDragStart,
  onPositionChange,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null);

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
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, pointer, dragOffset, position, onPositionChange]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const rect = ref.current!.getBoundingClientRect();
    setClickStart({ x: pointer.x, y: pointer.y });
    setIsDragging(false);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  useEffect(() => {
    function handlePointerUp() {
      setIsDragging(false);
      setClickStart(null);
    }
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  useEffect(() => {
    if (!clickStart) return;
    const dx = Math.abs(pointer.x - clickStart.x);
    const dy = Math.abs(pointer.y - clickStart.y);
    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      setIsDragging(true);
      onDragStart?.();
    }
  }, [pointer, clickStart, isDragging, onDragStart]);

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: `${DECK_WIDTH}px`,
        height: `${DECK_HEIGHT}px`,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        style={{
          pointerEvents: "auto",   // FIXED: deck is draggable again
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          background: isHovering
            ? "linear-gradient(135deg, #666, #333)"
            : "linear-gradient(135deg, #555, #222)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          fontWeight: "bold",
          color: "white",
          userSelect: "none",
          boxShadow: isDragging
            ? "0px 0px 40px rgba(0,0,0,0.5)"
            : "0px 0px 20px rgba(0,0,0,0.35)",
          transition: isDragging ? "none" : "transform 0.2s ease",
          transform: `scale(${isHovering ? 1.06 : 1})`,
        }}
      >
        Deck
      </div>
    </div>
  );
};

export default DeckCard;
