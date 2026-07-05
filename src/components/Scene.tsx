import React, { useState, useRef } from "react";
import Card from "./Card";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;

const Scene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [idleEnabled, setIdleEnabled] = useState(true);
  const [idleSpeed, setIdleSpeed] = useState(1);

  const [cards, setCards] = useState<
    { id: string; x: number; y: number; z: number; flipped?: boolean; startDragging?: boolean }[]
  >([]);

  const [deckCards, setDeckCards] = useState<string[]>([]);

  const deckZone = {
    x: window.innerWidth - CARD_WIDTH - 200,
    y: window.innerHeight - CARD_HEIGHT - 40,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };

  function addCard() {
    const id = Math.random().toString(36).slice(2);
    const x = Math.random() * (window.innerWidth - CARD_WIDTH);
    const y = Math.random() * (window.innerHeight - CARD_HEIGHT);

    setCards(prev => [...prev, { id, x, y, z: prev.length + 1 }]);
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

    if (deckCards.includes(id)) {
      setDeckCards(prev => prev.filter(c => c !== id));
    }

    setCards(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              x: pointer.x - CARD_WIDTH / 2,
              y: pointer.y - CARD_HEIGHT / 2,
              z: 20000,
              startDragging: true,
            }
          : c
      )
    );
  }

  function handlePositionChange(id: string, x: number, y: number) {
    setCards(prev =>
      prev.map(c =>
        c.id === id ? { ...c, x, y } : c
      )
    );
  }

  function handleFlipChange(id: string, flipped: boolean) {
    setCards(prev =>
      prev.map(c =>
        c.id === id ? { ...c, flipped } : c
      )
    );
  }

  function handleDragEnd(id: string, x: number, y: number) {
    const cx = x + CARD_WIDTH / 2;
    const cy = y + CARD_HEIGHT / 2;

    const insideDeck =
      cx > deckZone.x &&
      cx < deckZone.x + deckZone.width &&
      cy > deckZone.y &&
      cy < deckZone.y + deckZone.height;

    if (insideDeck) {
      setDeckCards(prev => [...prev, id]);
    }

    setActiveDragId(null);

    setCards(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              z: (() => {
                const freeCards = prev.filter(fc => !deckCards.includes(fc.id));
                const maxFreeZ = Math.max(...freeCards.map(fc => fc.z), 0);
                return maxFreeZ + 1;
              })(),
              startDragging: false,
            }
          : c
      )
    );
  }

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

      <button
        onClick={() => setIdleEnabled(prev => !prev)}
        style={{
          position: "absolute",
          top: 20,
          left: 160,
          padding: "12px 20px",
          fontSize: "18px",
          borderRadius: "10px",
          background: idleEnabled ? "#00c853" : "#d32f2f",
          color: "white",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
        }}
      >
        Idle: {idleEnabled ? "On" : "Off"}
      </button>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 320,
          zIndex: 9999,
          color: "white",
          fontSize: "16px",
        }}
      >
        <div>Idle Speed</div>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={idleSpeed}
          onChange={(e) => setIdleSpeed(parseFloat(e.target.value))}
          style={{ width: "150px" }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: deckZone.x,
          top: deckZone.y,
          width: deckZone.width,
          height: deckZone.height,
          border: "2px dashed rgba(255,255,255,0.3)",
          borderRadius: "10px",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      />

      {deckCards
        .map(id => cards.find(c => c.id === id))
        .filter(Boolean)
        .map((card, index) => {
          const x = deckZone.x + index * 5;
          const y = deckZone.y - index * 4;

          const isDragging = activeDragId === card!.id;

          return (
            <Card
              key={card!.id}
              id={card!.id}
              initialX={x}
              initialY={y}
              pointer={pointer}
              onDragStart={() => handleDragStart(card!.id)}
              onDragEnd={(newX, newY) => handleDragEnd(card!.id, newX, newY)}
              onPositionChange={() => {}}
              onFlipChange={flipped => handleFlipChange(card!.id, flipped)}
              zIndex={isDragging ? 99999 : 10000 + index}
              idleEnabled={false}
              idleSpeed={idleSpeed}
              flipped={card!.flipped}
              inDeck={true}
            />
          );
        })}

      {cards
        .filter(c => !deckCards.includes(c.id))
        .sort((a, b) => a.z - b.z)
        .map(card => {
          const isTop = hoveredCardId === card.id;
          const isDragging = activeDragId === card.id;

          const effectivePointer =
            isDragging || isTop ? pointer : { x: -99999, y: -99999 };

          return (
            <Card
              key={card.id}
              id={card.id}
              initialX={card.x}
              initialY={card.y}
              pointer={effectivePointer}
              startDragging={card.startDragging}
              onDragStart={() => handleDragStart(card.id)}
              onDragEnd={(newX, newY) => handleDragEnd(card.id, newX, newY)}
              onPositionChange={(x, y) => handlePositionChange(card.id, x, y)}
              onFlipChange={flipped => handleFlipChange(card.id, flipped)}
              zIndex={isDragging ? 99999 : card.z}
              idleEnabled={idleEnabled}
              idleSpeed={idleSpeed}
              flipped={card.flipped}
              inDeck={false}
            />
          );
        })}
    </div>
  );
};

export default Scene;
