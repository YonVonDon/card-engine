import { useState, useRef } from "react";

function App() {
  const [isHovering, setIsHovering] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const [glowX, setGlowX] = useState(0);
  const [glowY, setGlowY] = useState(0);

  const [glowFollowX, setGlowFollowX] = useState(0);
  const [glowFollowY, setGlowFollowY] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const { clientX, clientY } = e;

    const radius = 150;

    const isNear =
      clientX > rect.left - radius &&
      clientX < rect.right + radius &&
      clientY > rect.top - radius &&
      clientY < rect.bottom + radius;

    setIsHovering(isNear);

    if (!isNear) {
      resetTilt();
      return;
    }

    const xCentered = (clientX - (rect.left + rect.width / 2)) / rect.width;
    const yCentered = (clientY - (rect.top + rect.height / 2)) / rect.height;

    const rotY = xCentered * 15;
    const rotX = -yCentered * 15;

    setTiltX(rotX);
    setTiltY(rotY);

    // ⭐ REAL WORLD-SPACE LIGHT DIRECTION
    const followX = xCentered * -40;
    const followY = yCentered * -40;

    setGlowFollowX(followX);
    setGlowFollowY(followY);

    // ⭐ Apply correct glow based on flip state
    setGlowX(isFlipped ? -followX : followX);
    setGlowY(followY);
  }

  function resetTilt() {
    setTiltX(0);
    setTiltY(0);
    setGlowX(0);
    setGlowY(0);
    setGlowFollowX(0);
    setGlowFollowY(0);
  }

  function handleRightClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    setIsFlipped(prev => {
      const newFlip = !prev;

      // ⭐ Recalculate glow immediately using REAL light direction
      setGlowX(newFlip ? -glowFollowX : glowFollowX);
      setGlowY(glowFollowY);

      return newFlip;
    });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: "fixed",
        inset: 0,
        margin: 0,
        padding: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
      }}
    >
      <div
        ref={cardRef}
        onContextMenu={handleRightClick}
        style={{
          position: "relative",
          width: "300px",
          height: "400px",

          borderRadius: "20px",
          background: "transparent",
          overflow: "hidden",

          transformStyle: "preserve-3d",

          transform: `
            perspective(800px)
            rotateX(${tiltX}deg)
            rotateY(${(isFlipped ? 180 : 0) + tiltY}deg)
            scale(${isHovering ? 1.06 : 1})
          `,

          transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",

          boxShadow: isHovering
            ? isFlipped
              ? `${glowX}px ${glowY}px 50px rgba(0, 200, 255, 0.35)`   // back color
              : `${glowX}px ${glowY}px 50px rgba(255, 255, 255, 0.35)` // front color
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
}

export default App;
