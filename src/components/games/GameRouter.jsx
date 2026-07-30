// src/components/games/GameRouter.jsx
// Dispatches to the correct game component based on game_type.
import React from "react";
import MatchingGame from "./MatchingGame";
import MemoryGame from "./MemoryGame";
import SortingGame from "./SortingGame";
import WordBuilderGame from "./WordBuilderGame";
import FlashcardGame from "./FlashcardGame";
import SequenceGame from "./SequenceGame";
import TimeChallengeGame from "./TimeChallengeGame";
import SimulationGame from "./SimulationGame";
import PuzzleGame from "./PuzzleGame";
import AdventureGame from "./AdventureGame";

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
    case "flashcard":
      return <FlashcardGame gameData={gameData} onComplete={onComplete} />;
    case "sequence":
      return <SequenceGame gameData={gameData} onComplete={onComplete} />;
    case "time_challenge":
      return <TimeChallengeGame gameData={gameData} onComplete={onComplete} />;
    case "simulation":
      return <SimulationGame gameData={gameData} onComplete={onComplete} />;
    case "puzzle":
      return <PuzzleGame gameData={gameData} onComplete={onComplete} />;
    case "adventure":
      return <AdventureGame gameData={gameData} onComplete={onComplete} />;
    default:
      return <MatchingGame gameData={gameData} onComplete={onComplete} />;
  }
}