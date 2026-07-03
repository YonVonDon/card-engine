import React, { useState } from "react";
import Card from "./Card";

const Scene: React.FC = () => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

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
      <Card id="1" initialX={300} initialY={200} pointer={pointer} />
      <Card id="2" initialX={700} initialY={300} pointer={pointer} />
    </div>
  );
};

export default Scene;
