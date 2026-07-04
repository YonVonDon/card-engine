import React, { useState, useRef } from "react";
import Card from "./Card";

const Scene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const [cards, setCards] = useState<
    { id: string; x: number; y: number; z: number }[]
  >([
    { id: "1", x: 300, y: 200, z: 1 },
    { id: "2", x: 700, y: 300, z: 2 },
  ]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    setPointer({ x: e.clientX, y: e.clientY });
  }

  function bringToFront(id: string) {
    setCards((prev) => {
      const maxZ = Math.max(...prev.map((c) => c.z));
      return prev.map((c) =>
        c.id === id ? { ...c, z: maxZ + 1 } : c
      );
    });
  }

  function addCard() {
    if (!sceneRef.current) return;

    const rect = sceneRef.current.getBoundingClientRect();

    const x = Math.random() * (rect.width - 300);
    const y = Math.random() * (rect.height - 400);

    const newId = crypto.randomUUID();

    const maxZ = Math.max(...cards.map((c) => c.z));

    setCards((prev) => [
      ...prev,
      { id: newId, x, y, z: maxZ + 1 },
    ]);
  }

  return (
    <div
      ref={sceneRef}
      onPointerMove={onPointerMove}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#4a4a4a", // Hearthstone board grey
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
          zIndex: 9999,
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Add Card
      </button>

      {cards.map((card) => (
        <Card
          key={card.id}
          id={card.id}
          initialX={card.x}
          initialY={card.y}
          pointer={pointer}
          onDragStart={() => bringToFront(card.id)}
          zIndex={card.z}
        />
      ))}
    </div>
  );
};

export default Scene;
