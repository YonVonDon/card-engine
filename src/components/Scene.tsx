import React, { useState, useRef, useEffect } from "react";
import Card from "./Card";
import DeckCard, { DECK_WIDTH, DECK_HEIGHT } from "./DeckCard";

const CARD_WIDTH = 315;
const CARD_HEIGHT = 533;

const MAJOR_ARCANA = [
  "sm_RWSa-T-00","sm_RWSa-T-01","sm_RWSa-T-02","sm_RWSa-T-03","sm_RWSa-T-04",
  "sm_RWSa-T-05","sm_RWSa-T-06","sm_RWSa-T-07","sm_RWSa-T-08","sm_RWSa-T-09",
  "sm_RWSa-T-10","sm_RWSa-T-11","sm_RWSa-T-12","sm_RWSa-T-13","sm_RWSa-T-14",
  "sm_RWSa-T-15","sm_RWSa-T-16","sm_RWSa-T-17","sm_RWSa-T-18","sm_RWSa-T-19",
  "sm_RWSa-T-20","sm_RWSa-T-21",
];

const MINOR_ARCANA = [
  "sm_RWSa-C-0A","sm_RWSa-C-02","sm_RWSa-C-03","sm_RWSa-C-04","sm_RWSa-C-05",
  "sm_RWSa-C-06","sm_RWSa-C-07","sm_RWSa-C-08","sm_RWSa-C-09","sm_RWSa-C-10",
  "sm_RWSa-C-J1","sm_RWSa-C-J2","sm_RWSa-C-QU","sm_RWSa-C-KI",

  "sm_RWSa-P-0A","sm_RWSa-P-02","sm_RWSa-P-03","sm_RWSa-P-04","sm_RWSa-P-05",
  "sm_RWSa-P-06","sm_RWSa-P-07","sm_RWSa-P-08","sm_RWSa-P-09","sm_RWSa-P-10",
  "sm_RWSa-P-J1","sm_RWSa-P-J2","sm_RWSa-P-QU","sm_RWSa-P-KI",

  "sm_RWSa-S-0A","sm_RWSa-S-02","sm_RWSa-S-03","sm_RWSa-S-04","sm_RWSa-S-05",
  "sm_RWSa-S-06","sm_RWSa-S-07","sm_RWSa-S-08","sm_RWSa-S-09","sm_RWSa-S-10",
  "sm_RWSa-S-J1","sm_RWSa-S-J2","sm_RWSa-S-QU","sm_RWSa-S-KI",

  "sm_RWSa-W-0A","sm_RWSa-W-02","sm_RWSa-W-03","sm_RWSa-W-04","sm_RWSa-W-05",
  "sm_RWSa-W-06","sm_RWSa-W-07","sm_RWSa-W-08","sm_RWSa-W-09","sm_RWSa-W-10",
  "sm_RWSa-W-J1","sm_RWSa-W-J2","sm_RWSa-W-QU","sm_RWSa-W-KI",
];

const ALL_TAROT = [...MAJOR_ARCANA, ...MINOR_ARCANA];

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

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [deckX, setDeckX] = useState(window.innerWidth - DECK_WIDTH - 40);
  const [deckY, setDeckY] = useState(window.innerHeight - DECK_HEIGHT - 40);

  const DECK_INTAKE_RADIUS = 260;
  const [deckIntakeCardId, setDeckIntakeCardId] = useState<string | null>(null);

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

  useEffect(() => {
    const firstFive = MAJOR_ARCANA.slice(0, 5);
    setCards(
      firstFive.map((id, index) => ({
        id,
        x: 120 + index * 60,
        y: 140 + index * 20,
        z: index + 1,
        inDeck: false,
      }))
    );
  }, []);

  function getIdleOffsetFromId(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) % 10000;
    }
    return (hash / 10000) * Math.PI * 2;
  }

  function addCard() {
    const id = ALL_TAROT[Math.floor(Math.random() * ALL_TAROT.length)];
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
  // Always anchor to the TOP‑LEFT of the DeckCard
  const baseX = deckX + (DECK_WIDTH - CARD_WIDTH) / 2;
  const baseY = deckY + (DECK_HEIGHT - CARD_HEIGHT) / 2;

  // Fixed offset direction: up + right
  const offsetX = 14 * deckIndex;   // expose left edge
  const offsetY = -12 * deckIndex;  // expose bottom edge

  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
  };
}


  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const px = e.clientX;
    const py = e.clientY;

    setPointer({ x: px, y: py });

    let topCard: string | null = null;
    let topZ = -Infinity;

    for (const card of cards) {
      const ref = cardRefs.current[card.id];
      if (!ref) continue;

      const rect = ref.getBoundingClientRect();

      const inside =
        px >= rect.left &&
        px <= rect.right &&
        py >= rect.top &&
        py <= rect.bottom;

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

  // -------------------------------------------------------
// DEQUEUE (remove from deck)
// -------------------------------------------------------
function dequeue(cardId: string) {
  setCards(prev => {
    // keep all other deck cards
    const deckCards = prev.filter(c => c.inDeck && c.id !== cardId);

    // ⭐ sort by existing deckIndex so visual order is preserved
    const sorted = deckCards
      .slice()
      .sort((a, b) => (a.deckIndex ?? 0) - (b.deckIndex ?? 0));

    // ⭐ reindex in that order: only cards above the removed one shift down/left
    const reindexed = sorted.map((c, i) => ({
      ...c,
      deckIndex: i,
    }));

    return prev.map(c => {
      if (c.id === cardId) {
        // removed card leaves the deck
        return { ...c, inDeck: false, deckIndex: undefined };
      }
      const updated = reindexed.find(d => d.id === c.id);
      return updated ? updated : c;
    });
  });
}


  function enqueue(cardId: string) {
    setCards(prev => {
      const deckCards = prev.filter(c => c.inDeck);
      const nextIndex = deckCards.length;

      return prev.map(c =>
        c.id === cardId
          ? { ...c, inDeck: true, deckIndex: nextIndex }
          : c
      );
    });
  }

  function normalizeDeck() {
    setCards(prev => {
      const deckCards = prev.filter(c => c.inDeck);

      const sorted = deckCards
        .sort((a, b) => a.deckIndex! - b.deckIndex!)
        .map((c, i) => ({ ...c, deckIndex: i }));

      return prev.map(c => {
        const updated = sorted.find(d => d.id === c.id);
        return updated ? updated : c;
      });
    });
  }

  function handleDragStart(id: string) {
    bringToFront(id);

    const card = cards.find(c => c.id === id);
    if (card && card.inDeck) {
      dequeue(id);
      normalizeDeck();
    }

    setActiveDragId(id);
  }

  function handlePositionChange(id: string, x: number, y: number) {
    setCards(prev =>
      prev.map(c =>
        c.id === id ? { ...c, x, y } : c
      )
    );
  }

  useEffect(() => {
    function handlePointerUp() {
      if (deckIntakeCardId) {
        enqueue(deckIntakeCardId);
        normalizeDeck();
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

      {deckIntakeCardId && (
        <div
          style={{
            position: "absolute",
            left: deckX + DECK_WIDTH / 2 - DECK_INTAKE_RADIUS,
            top: deckY + DECK_HEIGHT / 2 - DECK_INTAKE_RADIUS,
            width: DECK_INTAKE_RADIUS * 2,
            height: DECK_INTAKE_RADIUS * 2,
            borderRadius: "50%",
            border: "6px solid rgba(0,200,255,0.6)",
            boxShadow: "0 0 40px rgba(0,200,255,0.6)",
            pointerEvents: "none",
            zIndex: 9997,
          }}
        />
      )}

      <DeckCard
        x={deckX}
        y={deckY}
        pointer={pointer}
        isHovering={hoveredCardId === "DECK_CARD"}
        deckIdlePhase={deckIdlePhase}
        onDragStart={() => {}}
        onPositionChange={(x, y) => {
          setDeckX(x);
          setDeckY(y);
        }}
      />

      {cards.map(card => {
        const isTop = hoveredCardId === card.id;
        const isDragging = activeDragId === card.id;

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
            idleOffset={getIdleOffsetFromId(card.id)}
            ref={(el: HTMLDivElement | null) => {
              cardRefs.current[card.id] = el;
            }}
          />
        );
      })}
    </div>
  );
};

export default Scene;
