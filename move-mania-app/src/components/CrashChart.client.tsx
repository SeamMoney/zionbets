"use client";
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../app/globals.css';

const CrashChart = () => {
  const [multiplierValues, setMultiplierValues] = useState<number[]>([]);
  const [path, setPath] = useState<string>('M0,150');
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const stopValueRef = useRef<number>(Math.random() * (10 - 1) + 1);

  useEffect(() => {
    const startTime = Date.now();
    let lastLabelTime = 0;

    const update = () => {
      const now = Date.now();
      const elapsedTime = (now - startTime) / 1000;
      const newValue = Math.exp(elapsedTime / 10) - 1;

      // Stop the animation if crash point reached
      if (newValue >= stopValueRef.current) {
        return;
      }

      setMultiplierValues((prevValues) => [...prevValues, newValue]);

      const elapsedSinceLastLabel = now - lastLabelTime;
      if (elapsedSinceLastLabel >= 1000) {
        const newLabel = `${Math.floor(elapsedTime)}s`;
        setTimeLabels((prevLabels) => [...prevLabels, newLabel]);
        lastLabelTime = now;
      }

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    if (multiplierValues.length > 0) {
      const maxValue = Math.max(...multiplierValues);
      const scalingFactor = 150 / (maxValue * 1.1);

      const newPath = multiplierValues.reduce((acc, currentValue, index) => {
        const x = 50 + index * (350 / multiplierValues.length);
        const y = 150 - currentValue * scalingFactor;
        return `${acc} L${x},${y}`;
      }, 'M50,150');

      setPath(newPath);
    }
  }, [multiplierValues]);

  const pathVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: 0.5, duration: 1.5 }
    }
  };

  return (
    <>
      <svg width="400" height="200" style={{ border: '1px solid black' }}>
        <line x1="50" y1="150" x2="400" y2="150" stroke="black" strokeWidth="2" />
        <line x1="50" y1="0" x2="50" y2="150" stroke="black" strokeWidth="2" />
        <text x="10" y="15" fontSize="12" fill="black">Max</text>
        <text x="10" y="82.5" fontSize="12" fill="black">Mid</text>
        <text x="10" y="150" fontSize="12" fill="black">0</text>
        {timeLabels.map((label, index) => {
          const totalWidth = 350;
          const labelSpacing = totalWidth / (timeLabels.length - 1);
          const labelXPosition = 50 + index * labelSpacing;

          return (
            <text key={index} x={labelXPosition} y="165" fontSize="12" fill="black">{label}</text>
          );
        })}
        <motion.path
          d={path}
          fill="none"
          stroke="red"
          strokeWidth="2"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
        />
      </svg>
      <div>Multiplier: {multiplierValues.at(-1)?.toFixed(2)}x</div>
    </>
  );
};

export default CrashChart;
