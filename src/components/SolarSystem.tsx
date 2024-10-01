import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import '../App.css';

interface Planet {
  name: string;
  color: string;
  a: number;
  b: number;
  speed: number;
  size: number;
  phase: number;
  currentX?: number;
  currentY?: number;
  currentSize?: number;
}

const SolarSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'realistic' | 'illustrative'>('illustrative');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [distanceScale, setDistanceScale] = useState(1);
  const [sunSizeScale, setSunSizeScale] = useState(1);
  const [planetSizeScale, setPlanetSizeScale] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const animationRef = useRef<number>();
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null);

  const SCALE_FACTOR = 1e-5;
  const sunSize = 1392700 * SCALE_FACTOR;

  const planets = useMemo<Planet[]>(() => [
    { name: 'Sao Thủy', color: '#8c8c8c', a: 57.9, b: 57.9, speed: 47.87, size: 4879 * SCALE_FACTOR, phase: 0 },
    { name: 'Sao Kim', color: '#e6e6fa', a: 108.2, b: 108.2, speed: 35.02, size: 12104 * SCALE_FACTOR, phase: 1 },
    { name: 'Trái Đất', color: '#4169e1', a: 149.6, b: 149.6, speed: 29.78, size: 12742 * SCALE_FACTOR, phase: 2 },
    { name: 'Sao Hỏa', color: '#ff4500', a: 227.9, b: 227.9, speed: 24.07, size: 6779 * SCALE_FACTOR, phase: 3 },
    { name: 'Sao Mộc', color: '#ffa500', a: 778.5, b: 778.5, speed: 13.07, size: 139820 * SCALE_FACTOR, phase: 4 },
    { name: 'Sao Thổ', color: '#f4a460', a: 1434.0, b: 1434.0, speed: 9.69, size: 116460 * SCALE_FACTOR, phase: 5 },
    { name: 'Sao Thiên Vương', color: '#40e0d0', a: 2871.0, b: 2871.0, speed: 6.81, size: 50724 * SCALE_FACTOR, phase: 6 },
    { name: 'Sao Hải Vương', color: '#4169e1', a: 4495.0, b: 4495.0, speed: 5.43, size: 49244 * SCALE_FACTOR, phase: 7 },
  ], []);

  const drawPlanet = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, isHovered: boolean) => {
    ctx.beginPath();
    const scaleFactor = isHovered ? 1.2 : 1; // Phóng to 20% khi hover
    ctx.arc(x, y, Math.max(0.5, (size * scaleFactor) / 2), 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const drawOrbit = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number, a: number, b: number) => {
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, a, b, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDistance = Math.max(...planets.map(p => p.a));
    const scaleFactor = viewMode === 'realistic'
      ? (canvas.width / 2 - 20) / maxDistance
      : (canvas.width / 2 - 20) / 8;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const displayedSunSize = viewMode === 'realistic' 
      ? Math.max(2, sunSize * scaleFactor * sunSizeScale)
      : 20 * sunSizeScale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, displayedSunSize / 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    planets.forEach((planet, index) => {
      const time = Date.now() * 0.00001 * planet.speed * speedMultiplier + planet.phase;
      const orbitA = viewMode === 'realistic'
        ? planet.a * scaleFactor * distanceScale
        : (50 + index * 50) * distanceScale;
      const orbitB = viewMode === 'realistic' ? planet.b * scaleFactor * distanceScale : orbitA;
      const x = centerX + orbitA * Math.cos(time);
      const y = centerY + orbitB * Math.sin(time);
      const size = viewMode === 'realistic'
        ? Math.max(1, planet.size * scaleFactor * planetSizeScale)
        : (5 + (planet.size / (sunSize / SCALE_FACTOR)) * 15) * planetSizeScale;

      if (showOrbits) {
        drawOrbit(ctx, centerX, centerY, orbitA, orbitB);
      }
      
      const isHovered = planet === hoveredPlanet;
      drawPlanet(ctx, x, y, size, planet.color, isHovered);

      planet.currentX = x;
      planet.currentY = y;
      planet.currentSize = size;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [viewMode, speedMultiplier, distanceScale, sunSizeScale, planetSizeScale, showOrbits, planets, drawPlanet, drawOrbit, hoveredPlanet]);

  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedPlanet = planets.find(planet => {
      if (typeof planet.currentX === 'undefined' || typeof planet.currentY === 'undefined' || typeof planet.currentSize === 'undefined') {
        return false;
      }
      const distance = Math.sqrt((x - planet.currentX) ** 2 + (y - planet.currentY) ** 2);
      return distance <= planet.currentSize / 2;
    });

    setSelectedPlanet(clickedPlanet || null);
  }, [planets]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hoveredPlanet = planets.find(planet => {
      if (typeof planet.currentX === 'undefined' || typeof planet.currentY === 'undefined' || typeof planet.currentSize === 'undefined') {
        return false;
      }
      const distance = Math.sqrt((x - planet.currentX) ** 2 + (y - planet.currentY) ** 2);
      return distance <= planet.currentSize / 2;
    });

    setHoveredPlanet(hoveredPlanet || null);
  }, [planets]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredPlanet(null);
  }, []);

  return (
    <div className="container">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={800} 
        className="canvas" 
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
      <div className="toolbar">
        <div>
          <label>
            <input
              type="radio"
              value="realistic"
              checked={viewMode === 'realistic'}
              onChange={() => setViewMode('realistic')}
            />
            Tầm nhìn thực tế
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="illustrative"
              checked={viewMode === 'illustrative'}
              onChange={() => setViewMode('illustrative')}
            />
            Tầm nhìn minh họa
          </label>
        </div>
        <div>
          <label htmlFor="speed-slider">Tốc độ: </label>
          <input
            id="speed-slider"
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
          />
          <span>{speedMultiplier.toFixed(1)}x</span>
        </div>
        <div>
          <label htmlFor="distance-slider">Tỷ lệ khoảng cách: </label>
          <input
            id="distance-slider"
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={distanceScale}
            onChange={(e) => setDistanceScale(parseFloat(e.target.value))}
          />
          <span>{distanceScale.toFixed(1)}</span>
        </div>
        <div>
          <label htmlFor="sun-size-slider">Kích thước Mặt Trời: </label>
          <input
            id="sun-size-slider"
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={sunSizeScale}
            onChange={(e) => setSunSizeScale(parseFloat(e.target.value))}
          />
          <span>{sunSizeScale.toFixed(1)}</span>
        </div>
        <div>
          <label htmlFor="planet-size-slider">Kích thước hành tinh: </label>
          <input
            id="planet-size-slider"
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={planetSizeScale}
            onChange={(e) => setPlanetSizeScale(parseFloat(e.target.value))}
          />
          <span>{planetSizeScale.toFixed(1)}</span>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(e) => setShowOrbits(e.target.checked)}
            />
            Hiển thị quỹ đạo
          </label>
        </div>
      </div>
      {selectedPlanet && (
        <div className="planetInfo">
          <h3>{selectedPlanet.name}</h3>
          <p>Khoảng cách từ Mặt Trời: {selectedPlanet.a.toFixed(1)} triệu km</p>
          <p>Đường kính: {(selectedPlanet.size / SCALE_FACTOR).toFixed(0)} km</p>
          <button onClick={() => setSelectedPlanet(null)}>Đóng</button>
        </div>
      )}
    </div>
  );
};

export default SolarSystem;