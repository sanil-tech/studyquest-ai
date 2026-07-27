// src/components/games/GameRouter.jsx
// Dispatches to the correct game component based on game_type.
import React from "react";
import MatchingGame from "./MatchingGame";
import MemoryGame from "./MemoryGame";
import SortingGame from "./SortingGame";
import WordBuilderGame from "./WordBuilderGame";

export default function GameRouter({ game, onComplete }) {
  const gameData = game.game_data;

  switch (game.game_type) {
    case "matching":
      return <MatchingGame gameData={gameData} onComplete={onComplete} />;
    case "memory":
      return <MemoryGame gameData={gameData} onComplete={onComplete} />;
    case "sorting":
      return <SortingGame gameData={gameData} onComplete={onComplete} />;
    case "word_builder":
      return <WordBuilderGame gameData={gameData} onComplete={onComplete} />;
    default:
      return <MatchingGame gameData={gameData} onComplete={onComplete} />;
  }
}