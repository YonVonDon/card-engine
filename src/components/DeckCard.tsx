import React, { useState, useEffect } from "react";

// ⭐ Slightly larger than a normal card so edges are exposed
const CARD_WIDTH = 315;
const CARD_HEIGHT = 533;
export const DECK_WIDTH = 350;
export const DECK_HEIGHT = 600;

interface DeckCardProps {
  x: number;
  y: number;
  pointer: { x: number; y: number };
  isHovering: boolean;
  deckIdlePhase: number; // ⭐ SAME idle phase as deck cards
  onDragStart?: () => void;
  onPositionChange?: (x: number, y: number) => void;
}

const DeckCard: React.FC<DeckCardProps> = ({
  x,
  y,
  pointer,
  isHovering,
  deckIdlePhase,
  onDragStart,
  onPositionChange,
}) => {
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // ⭐ EXACT SAME idle math as deck cards
  const idleOffsetX = Math.sin(deckIdlePhase) * 3;
  const idleOffsetY = Math.cos(deckIdlePhase * 0.8) * 6;

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setIsDragging(true);
    onDragStart?.();
  }

  useEffect(() => {
    function handlePointerUp() {
      setIsDragging(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

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

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: position.x + idleOffsetX,
        top: position.y + idleOffsetY,
        width: DECK_WIDTH,
        height: DECK_HEIGHT,
        borderRadius: "24px",
        background: "linear-gradient(135deg, #222, #555)",
        border: "4px solid #444",
        boxShadow: isHovering
          ? "0 0 40px rgba(0,200,255,0.5)"
          : "0 0 24px rgba(0,0,0,0.5)",
        transition: isDragging ? "none" : "box-shadow 0.2s ease",
        cursor: "grab",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          letterSpacing: "0.12em",
          color: "#fff",
          opacity: 0.9,
          userSelect: "none",
        }}
      >
        DECK
      </div>
    </div>
  );
};

export default DeckCard;
