import React, { useState, useRef, useEffect } from "react";
import Card from "./Card";
import DeckCard, { DECK_WIDTH, DECK_HEIGHT } from "./DeckCard";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;

interface CardData {
  id: string;
  x: number;
  y: number;
  z: number;
  inDeck: boolean;
  deckIndex?: number;
}

const Scene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [cards, setCards] = useState<CardData[]>([]);

  const [deckX, setDeckX] = useState(window.innerWidth - DECK_WIDTH - 40);
  const [deckY, setDeckY] = useState(window.innerHeight - DECK_HEIGHT - 40);

  const DECK_INTAKE_RADIUS = 260;
  const [deckIntakeCardId, setDeckIntakeCardId] = useState<string | null>(null);

  // ⭐ NEW: Scene-controlled idle phases
  const [deckIdlePhase, setDeckIdlePhase] = useState(0);
  const [freeIdlePhase, setFreeIdlePhase] = useState(0);

  useEffect(() => {
    let frame: number;
    function animate() {
      setDeckIdlePhase(p => p + 0.015);
      setFreeIdlePhase(p => p + 0.02);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function addCard() {
    const id = Math.random().toString(36).slice(2);
    const x = Math.random() * (window.innerWidth - CARD_WIDTH);
    const y = Math.random() * (window.innerHeight - CARD_HEIGHT);

    setCards(prev => [
      ...prev,
      {
        id,
        x,
        y,
        z: prev.length + 1,
        inDeck: false,
      },
    ]);
  }

  function getDeckOffset(deckX: number, deckY: number, deckIndex: number) {
    const centerX = deckX + DECK_WIDTH / 2;
    const centerY = deckY + DECK_HEIGHT / 2;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const horizontal = centerX < screenW / 2 ? "right" : "left";
    const vertical = centerY < screenH / 2 ? "down" : "up";

    const baseOffsetX = 14;
    const baseOffsetY = 10;

    const offsetX =
      horizontal === "right"
        ? -baseOffsetX * (deckIndex + 1)
        : baseOffsetX * (deckIndex + 1);

    const offsetY =
      vertical === "down"
        ? -baseOffsetY * (deckIndex + 1)
        : baseOffsetY * (deckIndex + 1);

    return {
      x: centerX - CARD_WIDTH / 2 + offsetX,
      y: centerY - CARD_HEIGHT / 2 + offsetY,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const px = e.clientX;
    const py = e.clientY;

    setPointer({ x: px, y: py });

    let topCard: string | null = null;
    let topZ = -Infinity;

    for (const card of cards) {
      const left = card.x;
      const right = card.x + CARD_WIDTH;
      const top = card.y;
      const bottom = card.y + CARD_HEIGHT;

      const inside =
        px > left &&
        px < right &&
        py > top &&
        py < bottom;

      if (inside && card.z > topZ) {
        topZ = card.z;
        topCard = card.id;
      }
    }

    setHoveredCardId(topCard);

    let intakeCandidate: string | null = null;

    for (const card of cards) {
      if (!card.inDeck && activeDragId === card.id) {
        const deckCenterX = deckX + DECK_WIDTH / 2;
        const deckCenterY = deckY + DECK_HEIGHT / 2;

        const dx = pointer.x - deckCenterX;
        const dy = pointer.y - deckCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DECK_INTAKE_RADIUS) {
          intakeCandidate = card.id;
        }
      }
    }

    setDeckIntakeCardId(intakeCandidate);
  }

  function bringToFront(id: string) {
    setCards(prev => {
      const maxZ = Math.max(...prev.map(c => c.z));
      return prev.map(c =>
        c.id === id ? { ...c, z: maxZ + 1 } : c
      );
    });
  }

  function handleDragStart(id: string) {
    bringToFront(id);
    setActiveDragId(id);
  }

  function handlePositionChange(id: string, x: number, y: number) {
    setCards(prev =>
      prev.map(c =>
        c.id === id ? { ...c, x, y } : c
      )
    );
  }

  function moveCardToDeck(id: string) {
    setCards(prev => {
      const deckCards = prev.filter(c => c.inDeck);

      const highestZ = Math.max(...prev.map(c => c.z));
      const nextZ = highestZ + 1;

      const nextIndex = deckCards.length;

      return prev.map(c =>
        c.id === id
          ? {
              ...c,
              inDeck: true,
              deckIndex: nextIndex,
              z: nextZ,
            }
          : c
      );
    });
  }

  useEffect(() => {
    function handlePointerUp() {
      if (deckIntakeCardId) {
        moveCardToDeck(deckIntakeCardId);
        setDeckIntakeCardId(null);
      }
      setActiveDragId(null);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [deckIntakeCardId]);

  return (
    <div
      ref={sceneRef}
      onPointerMove={onPointerMove}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#4a4a4a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <button
        onClick={addCard}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "12px 20px",
          fontSize: "18px",
          borderRadius: "10px",
          background: "#fff",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
        }}
      >
        + Add Card
      </button>

      <DeckCard
        x={deckX}
        y={deckY}
        pointer={pointer}
        isHovering={hoveredCardId === "DECK_CARD"}
        onDragStart={() => {}}
        onPositionChange={(x, y) => {
          setDeckX(x);
          setDeckY(y);
        }}
      />

      {cards.map(card => {
        const isTop = hoveredCardId === card.id;
        const isDragging = activeDragId === card.id;

        // ⭐ Smooth snap only until close enough
        let snapTarget: { x: number; y: number } | undefined = undefined;

        if (card.inDeck && card.deckIndex !== undefined && !isDragging) {
          const target = getDeckOffset(deckX, deckY, card.deckIndex);

          const dx = card.x - target.x;
          const dy = card.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1.5) {
            snapTarget = target;
          }
        }

        return (
          <Card
            key={card.id}
            id={card.id}
            initialX={card.x}
            initialY={card.y}
            realPointer={pointer}
            fakePointer={isDragging || isTop ? pointer : { x: -99999, y: -99999 }}
            isHovering={isTop}
            onDragStart={() => handleDragStart(card.id)}
            onPositionChange={(x, y) => handlePositionChange(card.id, x, y)}
            zIndex={card.z}
            snapTarget={snapTarget}
            inDeck={card.inDeck}
            deckIdlePhase={deckIdlePhase}
            freeIdlePhase={freeIdlePhase}
          />
        );
      })}
    </div>
  );
};

export default Scene;
