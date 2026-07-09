import React, { useState, useRef, useEffect } from "react";

interface CardProps {
  id: string;
  initialX?: number;
  initialY?: number;

  realPointer: { x: number; y: number };
  fakePointer: { x: number; y: number };

  isHovering: boolean;
  onDragStart?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  zIndex?: number;
  snapTarget?: { x: number; y: number };
  inDeck?: boolean;

  deckIdlePhase: number;
  freeIdlePhase: number;
  idleOffset: number;
}

const DRAG_THRESHOLD = 2;

// Updated dimensions
const CARD_WIDTH = 315;
const CARD_HEIGHT = 533;

// Hover sensitivity
const TILT_STRENGTH_X = 6;
const TILT_STRENGTH_Y = 8;

// Glow follow strength
const GLOW_STRENGTH_X = 55;
const GLOW_STRENGTH_Y = 75;

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    id,
    initialX = 300,
    initialY = 200,
    realPointer,
    fakePointer,
    isHovering,
    onDragStart,
    onPositionChange,
    zIndex = 1,
    snapTarget,
    inDeck = false,
    deckIdlePhase,
    freeIdlePhase,
    idleOffset,
  } = props;

  const innerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null);

  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const [glowX, setGlowX] = useState(0);
  const [glowY, setGlowY] = useState(0);

  const [glowFollowX, setGlowFollowX] = useState(0);
  const [glowFollowY, setGlowFollowY] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);

  const faceImage = `/cards/faces/${id}.webp`;
  const backImage = `/cards/backs/sm_RWSa-X-BA.webp`;
  //const backImage = `/cards/backs/sm_RWSa-X-RL.webp`;

  const idleOffsetX =
    !isHovering && !isDragging
      ? (inDeck
          ? Math.sin(deckIdlePhase) * 3
          : Math.sin(freeIdlePhase + idleOffset) * 3)
      : 0;

  const idleOffsetY =
    !isHovering && !isDragging
      ? (inDeck
          ? Math.cos(deckIdlePhase * 0.8) * 6
          : Math.cos((freeIdlePhase + idleOffset) * 0.8) * 6)
      : 0;

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;

    const rect = innerRef.current!.getBoundingClientRect();

    setClickStart({ x: realPointer.x, y: realPointer.y });
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
      resetHoverEffects();
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

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

  useEffect(() => {
    if (!clickStart) return;

    const dx = Math.abs(realPointer.x - clickStart.x);
    const dy = Math.abs(realPointer.y - clickStart.y);

    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      setIsDragging(true);
      onDragStart?.();
    }
  }, [realPointer, clickStart, isDragging, onDragStart]);

  useEffect(() => {
    if (inDeck && isHovering) return;
    if (isDragging) {
      resetHoverEffects();
      return;
    }
    if (!isHovering) {
      resetHoverEffects();
      return;
    }

    const card = innerRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const xCentered = (fakePointer.x - (rect.left + rect.width / 2)) / (rect.width * 0.5);
    const yCentered = (fakePointer.y - (rect.top + rect.height / 2)) / (rect.height * 0.5);

    const rotY = xCentered * TILT_STRENGTH_Y;
    const rotX = -yCentered * TILT_STRENGTH_X;

    setTiltX(rotX);
    setTiltY(rotY);

    const followX = xCentered * -GLOW_STRENGTH_X;
    const followY = yCentered * -GLOW_STRENGTH_Y;

    setGlowFollowX(followX);
    setGlowFollowY(followY);

    setGlowX(isFlipped ? -followX : followX);
    setGlowY(followY);
  }, [isHovering, fakePointer, isDragging, isFlipped, inDeck]);

  function resetHoverEffects() {
    setTiltX(0);
    setTiltY(0);
    setGlowX(0);
    setGlowY(0);
    setGlowFollowX(0);
    setGlowFollowY(0);
  }

  useEffect(() => {
    let frame: number;

    function animate() {
      if (isDragging) {
        const targetX = realPointer.x - dragOffset.x;
        const targetY = realPointer.y - dragOffset.y;

        const LERP = 0.12;

        const newX = position.x + (targetX - position.x) * LERP;
        const newY = position.y + (targetY - position.y) * LERP;

        setPosition({ x: newX, y: newY });
        onPositionChange?.(newX, newY);
      } else if (snapTarget) {
        const LERP = 0.12;

        const newX = position.x + (snapTarget.x - position.x) * LERP;
        const newY = position.y + (snapTarget.y - position.y) * LERP;

        setPosition({ x: newX, y: newY });
        onPositionChange?.(newX, newY);
      }

      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, realPointer, dragOffset, position, onPositionChange, snapTarget]);

  const shadowOffsetX = -tiltY * 2.2;
  const shadowOffsetY = tiltX * 2.2;
  const shadowBlur = isDragging ? 55 : 35;
  const shadowSize = isDragging ? 65 : 45;

  const dynamicShadow = `
    ${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0,0,0,0.45),
    0 0 ${shadowSize}px rgba(0,0,0,0.35)
  `;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: position.x + idleOffsetX,
        top: position.y + idleOffsetY,
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        zIndex,
      }}
    >
      {isHovering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "10px",
            pointerEvents: "none",
            transform: `translate(${glowX}px, ${glowY}px)`,
            filter: "blur(55px)",
            opacity: 1,
            background: isFlipped
              ? "rgba(0,200,255,0.35)"
              : "rgba(255,255,255,0.35)",
            zIndex: 0,
          }}
        />
      )}

      <div
        ref={innerRef}
        onPointerDown={onPointerDown}
        onContextMenu={onRightClick}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "10px",
          overflow: "hidden",
          transformStyle: "preserve-3d",
          transform: `
            perspective(900px)
            rotateX(${tiltX}deg)
            rotateY(${(isFlipped ? 180 : 0) + tiltY}deg)
            scale(${isHovering ? 1.07 : 1})
          `,
          transition: isDragging
            ? "none"
            : "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: inDeck ? "none" : dynamicShadow,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
            backgroundImage: `url(${faceImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: `rotateY(${isFlipped ? 0 : 180}deg)`,
            backgroundImage: `url(${backImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
});

export default Card;
