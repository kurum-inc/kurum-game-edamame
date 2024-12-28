import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DogObstacle } from './DogObstacle';

interface GameObstaclesProps {
  gameStarted: boolean;
  gameOver: boolean;
  onCollision: () => void;
  playerPosition: { x: number; y: number };
}

interface Obstacle {
  id: number;
  baseX: number;
}

export const GameObstacles: React.FC<GameObstaclesProps> = ({
  gameStarted,
  gameOver,
  onCollision,
  playerPosition
}) => {
  const [position, setPosition] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  const createInitialObstacles = useCallback(() => 
    Array.from({ length: 3 }).map((_, index) => ({
      id: index,
      baseX: (index + 10) * 500
    })), []
  );

    const [obstacles, setObstacles] = useState<Obstacle[]>(createInitialObstacles);
  
  
    const positionRef = useRef(0);
    const animationFrameRef = useRef<number>();
    const nextIdRef = useRef(3);
    const previousGameOver = useRef(gameOver);

  useEffect(() => {
    if (gameStarted || (previousGameOver.current && !gameOver)) {
      setPosition(0);
      positionRef.current = 0;
      setObstacles(createInitialObstacles());
      nextIdRef.current = 3;
      setAnimationPhase(0);
    }
    previousGameOver.current = gameOver;
  }, [gameStarted, gameOver, createInitialObstacles]);
  
// checkCollisions関数の部分のみ表示
const checkCollisions = useCallback(() => {
  const playerRect = {
    left: playerPosition.x + 22,    // 内側に2px移動
    right: playerPosition.x + 42,   // 内側に2px移動
    top: playerPosition.y + 12,     // 内側に2px移動
    bottom: playerPosition.y + 52    // 内側に2px移動
  };

  obstacles.forEach(obstacle => {
    const obstacleX = obstacle.baseX + position;
    const obstacleRect = {
      left: obstacleX + 8,      // 10 から 8 に変更（小さくなった分だけ当たり判定を調整）
      right: obstacleX + 16,    // 22 から 16 に変更
      top: 290,                 // 285 から 290 に変更（より下方に）
      bottom: 310               // 315 から 310 に変更（より上方に）
    };

    if (
      playerRect.right > obstacleRect.left &&
      playerRect.left < obstacleRect.right &&
      playerRect.bottom > obstacleRect.top &&
      playerRect.top < obstacleRect.bottom
    ) {
      onCollision();
    }
  });
}, [obstacles, position, playerPosition, onCollision]);

  const updatePosition = useCallback((deltaTime: number) => {
    if (!gameStarted || gameOver) return;

    positionRef.current -= deltaTime * 0.3;
    setPosition(positionRef.current);
    
    setAnimationPhase(prev => prev + deltaTime * 0.01);

    setObstacles(prevObstacles => 
      prevObstacles.map(obstacle => {
        const currentX = obstacle.baseX + positionRef.current;
        if (currentX < -window.innerWidth) {
          return {
            ...obstacle,
            baseX: obstacle.baseX + window.innerWidth * 3,
            id: nextIdRef.current++
          };
        }
        return obstacle;
      })
    );

    if (!gameOver) {
      checkCollisions();
    }
  }, [gameStarted, gameOver, checkCollisions]);


  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      updatePosition(deltaTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updatePosition]);

  return (
    <div className="absolute inset-0 will-change-transform">
      {obstacles.map(obstacle => {
        const currentX = obstacle.baseX + position;
        if (currentX > -50 && currentX < window.innerWidth + 50) {
          return (
            <DogObstacle
              key={obstacle.id}
              x={currentX}
              phase={animationPhase}
            />
          );
        }
        return null;
      })}
    </div>
  );
};