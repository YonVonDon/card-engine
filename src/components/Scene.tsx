import React, { useState } from "react";
import Card from "./Card";

const Scene: React.FC = () => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  // ⭐ Dynamic card list
  const [cards, setCards] = useState([
    { id: "1", x: 300, y: 200 },
    { id: "2", x: 700, y: 300 },
  ]);

  // ⭐ Z-INDEX MANAGEMENT
  const [zOrder, setZOrder] = useState<Record<string, number>>({});
  const [topZ, setTopZ] = useState(1);

  function bringToFront(id: string) {
    setZOrder(prev => {
      const newZ = topZ + 1;
      return { ...prev, [id]: newZ };
    });
    setTopZ(prev => prev + 1);
  }

  // ⭐ Add a new card at a random position
  function addCard() {
    const newId = crypto.randomUUID();

    // Card size is 300x400, so we keep it fully visible
    const padding = 50;

    const x = Math.random() * (window.innerWidth - 300 - padding) + padding;
    const y = Math.random() * (window.innerHeight - 400 - padding) + padding;

    const newCard = { id: newId, x, y };

    setCards(prev => [...prev, newCard]);

    // Make it top-most immediately
    bringToFront(newId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    setPointer({ x: e.clientX, y: e.clientY });
  }

  return (
    <div
      onPointerMove={onPointerMove}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#111",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ⭐ FIXED BUTTON */}
      <button
        onClick={addCard}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          padding: "10px 18px",
          fontSize: "16px",
          borderRadius: "8px",
          background: "#ff8a00",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
        }}
      >
        Add Card
      </button>

      {/* ⭐ Render all cards */}
      {cards.map(card => (
        <Card
          key={card.id}
          id={card.id}
          initialX={card.x}
          initialY={card.y}
          pointer={pointer}
          zIndex={zOrder[card.id] || 1}
          bringToFront={bringToFront}
        />
      ))}
    </div>
  );
};

export default Scene;
