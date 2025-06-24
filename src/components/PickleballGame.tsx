
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

const PickleballGame = () => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [ballPosition, setBallPosition] = useState<Position>({ x: 400, y: 300 });
  const [ballVelocity, setBallVelocity] = useState<Velocity>({ x: 4, y: 3 });
  const [playerPaddleY, setPlayerPaddleY] = useState(260);
  const [aiPaddleY, setAiPaddleY] = useState(260);
  const [lastHit, setLastHit] = useState<'player' | 'ai' | null>(null);
  
  const gameWidth = 800;
  const gameHeight = 600;
  const paddleHeight = 80;
  const paddleWidth = 15;
  const ballSize = 12;
  const maxScore = 11;

  // Mouse control for player paddle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing' || !gameAreaRef.current) return;
      
      const rect = gameAreaRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const newY = Math.max(0, Math.min(gameHeight - paddleHeight, relativeY - paddleHeight / 2));
      setPlayerPaddleY(newY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballVelocity.x;
        let newY = prev.y + ballVelocity.y;
        let newVelX = ballVelocity.x;
        let newVelY = ballVelocity.y;

        // Ball collision with top and bottom walls
        if (newY <= 0 || newY >= gameHeight - ballSize) {
          newVelY = -newVelY;
          newY = newY <= 0 ? 0 : gameHeight - ballSize;
        }

        // Ball collision with player paddle
        if (newX <= paddleWidth && 
            newY + ballSize >= playerPaddleY && 
            newY <= playerPaddleY + paddleHeight &&
            ballVelocity.x < 0) {
          newVelX = Math.abs(newVelX) * 1.05; // Increase speed slightly
          const hitPosition = (newY + ballSize/2 - playerPaddleY - paddleHeight/2) / (paddleHeight/2);
          newVelY = hitPosition * 6;
          setLastHit('player');
        }

        // Ball collision with AI paddle
        if (newX + ballSize >= gameWidth - paddleWidth && 
            newY + ballSize >= aiPaddleY && 
            newY <= aiPaddleY + paddleHeight &&
            ballVelocity.x > 0) {
          newVelX = -Math.abs(newVelX) * 1.05;
          const hitPosition = (newY + ballSize/2 - aiPaddleY - paddleHeight/2) / (paddleHeight/2);
          newVelY = hitPosition * 6;
          setLastHit('ai');
        }

        // Scoring
        if (newX < -ballSize) {
          setAiScore(prev => prev + 1);
          newX = gameWidth / 2;
          newY = gameHeight / 2;
          newVelX = 4;
          newVelY = (Math.random() - 0.5) * 6;
          setLastHit(null);
        } else if (newX > gameWidth + ballSize) {
          setPlayerScore(prev => prev + 1);
          newX = gameWidth / 2;
          newY = gameHeight / 2;
          newVelX = -4;
          newVelY = (Math.random() - 0.5) * 6;
          setLastHit(null);
        }

        setBallVelocity({ x: newVelX, y: newVelY });
        return { x: newX, y: newY };
      });

      // AI paddle movement
      setAiPaddleY(prev => {
        const paddleCenter = prev + paddleHeight / 2;
        const ballCenter = ballPosition.y + ballSize / 2;
        const diff = ballCenter - paddleCenter;
        const speed = 3.5;
        
        if (Math.abs(diff) < speed) return prev;
        return Math.max(0, Math.min(gameHeight - paddleHeight, 
          prev + (diff > 0 ? speed : -speed)));
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, ballVelocity, ballPosition.y, playerPaddleY, aiPaddleY]);

  // Check for game over
  useEffect(() => {
    if (playerScore >= maxScore || aiScore >= maxScore) {
      setGameState('gameOver');
    }
  }, [playerScore, aiScore]);

  const startGame = () => {
    setGameState('playing');
    setBallPosition({ x: gameWidth / 2, y: gameHeight / 2 });
    setBallVelocity({ x: 4, y: 3 });
  };

  const resetGame = () => {
    setGameState('menu');
    setPlayerScore(0);
    setAiScore(0);
    setBallPosition({ x: gameWidth / 2, y: gameHeight / 2 });
    setBallVelocity({ x: 4, y: 3 });
    setPlayerPaddleY(260);
    setAiPaddleY(260);
    setLastHit(null);
  };

  const togglePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            🏓 Pickleball Pro
          </h1>
          <p className="text-xl text-gray-600">Experience the ultimate pickleball game</p>
        </div>

        {/* Score Display */}
        <div className="flex justify-center gap-8 mb-6">
          <Card className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">Player</div>
              <div className="text-3xl font-bold">{playerScore}</div>
            </div>
          </Card>
          
          <Card className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">AI</div>
              <div className="text-3xl font-bold">{aiScore}</div>
            </div>
          </Card>
        </div>

        {/* Game Area */}
        <div className="flex justify-center mb-6">
          <div 
            ref={gameAreaRef}
            className="relative bg-gradient-to-b from-green-400 to-green-500 rounded-lg shadow-2xl overflow-hidden cursor-none"
            style={{ width: gameWidth, height: gameHeight }}
          >
            {/* Court Lines */}
            <div className="absolute inset-0">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white opacity-60 transform -translate-x-0.5"></div>
              {/* Service lines */}
              <div className="absolute left-0 top-1/3 w-full h-0.5 bg-white opacity-40"></div>
              <div className="absolute left-0 top-2/3 w-full h-0.5 bg-white opacity-40"></div>
              {/* Kitchen/Non-volley zones */}
              <div className="absolute left-0 top-1/3 w-20 h-1/3 border-2 border-white border-opacity-40 border-l-0"></div>
              <div className="absolute right-0 top-1/3 w-20 h-1/3 border-2 border-white border-opacity-40 border-r-0"></div>
            </div>

            {/* Player Paddle */}
            <div
              className="absolute left-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-r-lg shadow-lg transition-all duration-75"
              style={{
                width: paddleWidth,
                height: paddleHeight,
                top: playerPaddleY,
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-r-lg transform scale-90 origin-left"></div>
            </div>

            {/* AI Paddle */}
            <div
              className="absolute right-0 bg-gradient-to-l from-red-600 to-red-700 rounded-l-lg shadow-lg transition-all duration-75"
              style={{
                width: paddleWidth,
                height: paddleHeight,
                top: aiPaddleY,
              }}
            >
              <div className="w-full h-full bg-gradient-to-l from-red-400 to-red-500 rounded-l-lg transform scale-90 origin-right"></div>
            </div>

            {/* Ball */}
            <div
              className={`absolute bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg transition-all duration-75 ${
                lastHit === 'player' ? 'ring-2 ring-blue-400' : lastHit === 'ai' ? 'ring-2 ring-red-400' : ''
              }`}
              style={{
                width: ballSize,
                height: ballSize,
                left: ballPosition.x,
                top: ballPosition.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-white to-yellow-200 rounded-full transform scale-75"></div>
            </div>

            {/* Game State Overlays */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Card className="p-8 text-center bg-white/95 backdrop-blur-sm">
                  <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to Play?</h2>
                  <p className="text-gray-600 mb-6">Move your mouse to control the blue paddle</p>
                  <Button onClick={startGame} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 text-lg">
                    <Play className="mr-2" size={20} />
                    Start Game
                  </Button>
                </Card>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Card className="p-6 text-center bg-white/95 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Game Paused</h2>
                  <Button onClick={togglePause} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                    <Play className="mr-2" size={16} />
                    Resume
                  </Button>
                </Card>
              </div>
            )}

            {gameState === 'gameOver' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Card className="p-8 text-center bg-white/95 backdrop-blur-sm">
                  <Trophy className="mx-auto text-yellow-500 mb-4" size={48} />
                  <h2 className="text-3xl font-bold mb-2 text-gray-800">
                    {playerScore >= maxScore ? 'You Win!' : 'AI Wins!'}
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Final Score: {playerScore} - {aiScore}
                  </p>
                  <Button onClick={resetGame} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 text-lg">
                    <RotateCcw className="mr-2" size={20} />
                    Play Again
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4">
          {gameState === 'playing' && (
            <Button onClick={togglePause} variant="outline" className="bg-white/80 backdrop-blur-sm">
              <Pause className="mr-2" size={16} />
              Pause
            </Button>
          )}
          <Button onClick={resetGame} variant="outline" className="bg-white/80 backdrop-blur-sm">
            <RotateCcw className="mr-2" size={16} />
            Reset Game
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-8 p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">How to Play</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Controls:</h4>
              <p>Move your mouse up and down to control the blue paddle</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Objective:</h4>
              <p>First player to reach {maxScore} points wins the match</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PickleballGame;
