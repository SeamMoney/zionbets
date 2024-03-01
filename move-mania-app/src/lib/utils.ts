import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EXPONENTIAL_FACTOR = 1.06;

export function generateChartData(gameRoundId: string, crashPoint: number): any[] {

  const startingPrice = 50;
  const exponentialBase = EXPONENTIAL_FACTOR;
  const tickMs = 100;
  const countdownMs = 20 * 1000;
  const gameLengthMs = log(exponentialBase, crashPoint) * 1000;
  const gameEndMs = 5 * 1000;
  const gameTicks = (countdownMs + gameLengthMs + gameEndMs) / tickMs;

  console.log('number of ticks for countdown:', countdownMs / tickMs)
  console.log('number of ticks for game:', gameLengthMs / tickMs)

  const hasher = crypto.createHash("sha256");
  if (hasher === undefined) {
    console.log("Hasher is undefined")
    return [];
  }
  let gameRoundHash = hasher.update(gameRoundId).digest("hex");
  while (gameRoundHash.length < gameTicks) {
    gameRoundHash += hasher.update(gameRoundHash).digest("hex");
  }

  let currentElapsedTimeMs = 0;
  const dataPoints: any[] = [];
  let currentDate = new Date("2021-01-01T00:00:00Z");

  /**
   * Start and fluctuate the stock chart for the countdown. Show the stock chart trading sideways 
   * with small fluctuations, center around 50.
   * 
   * A candle stick should be generated every tickMs.
   * 
   * For each candlestick, the open value should be the close value of the previous candlestick. 
   * 
   * Calculate small random values for the high and low values.
   */
  for (currentElapsedTimeMs; currentElapsedTimeMs < countdownMs; currentElapsedTimeMs += tickMs) {
    // console.log("currentElapsedTimeMs:", currentElapsedTimeMs);
    // console.log("currentElapsedTimeMs / tickMs:", currentElapsedTimeMs / tickMs);
    const sineValue = sin(currentElapsedTimeMs / 1000);
    const hexValue = parseInt(gameRoundHash[currentElapsedTimeMs / tickMs], 16);
    // console.log("sineValue:", sineValue);
    // console.log("hexValue:", hexValue);
    const candleStickValue = sineValue * hexValue;
    // console.log("candleStickValue:", candleStickValue);

    const open: number = currentElapsedTimeMs === 0 ? startingPrice : dataPoints[currentElapsedTimeMs / tickMs - 1].close ;
    const close = open + candleStickValue;
    const high = close + (Math.random() * 5);
    const low = open - (Math.random() * 5);
    const timeString = currentDate.toISOString().split('T')[0];
    dataPoints.push({ time: timeString, open, high, low, close });
    currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
    // console.log("dataPoints[currentElapsedTimeMs / tickMs]:", dataPoints[currentElapsedTimeMs / tickMs]);
  }

  for (currentElapsedTimeMs; currentElapsedTimeMs < gameLengthMs; currentElapsedTimeMs += tickMs) {
    const hexValue = parseInt(gameRoundHash[currentElapsedTimeMs / tickMs], 16);
    const currentCrashPoint = calculateCurrentCrashPoint(currentElapsedTimeMs / 1000 - countdownMs / 1000) * 5
    const sineValue = .3 * sin(currentElapsedTimeMs / 1000) + .08;
    // console.log("hexValue:", hexValue);
    // console.log("currentCrashPoint:", currentCrashPoint);
    // console.log("sineValue:", sineValue);
    const candleStickValue = sineValue * hexValue * currentCrashPoint * 5;
    // console.log("candleStickValue:", candleStickValue);

    const open: number = currentElapsedTimeMs === 0 ? startingPrice : dataPoints[currentElapsedTimeMs / tickMs - 1].close ;
    const close = open + candleStickValue;
    const high = close + (Math.random() * 5) * currentCrashPoint;
    const low = open - (Math.random() * 5) * currentCrashPoint;
    const timeString = currentDate.toISOString().split('T')[0];
    dataPoints.push({ time: timeString, open, high, low, close });
    currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
  }

  // for (currentElapsedTimeMs; currentElapsedTimeMs < gameEndMs; currentElapsedTimeMs += tickMs) {
    const open: number = currentElapsedTimeMs === 0 ? startingPrice : dataPoints[currentElapsedTimeMs / tickMs - 1].close ;
    const close = 0;
    const high = open;
    const low = 0;
    const timeString = currentDate.toISOString().split('T')[0];
    dataPoints.push({ time: timeString, open, high, low, close });
    currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
  // }

  return dataPoints;


  console.log("gameRoundHash:", gameRoundHash);

  for (let i = 0; i < gameRoundHash.length; i++) {
    const hexChar = gameRoundHash[i];
    const hexValue = parseInt(hexChar, 16);
    if (![1, 3, 5, 7, 9, 13].includes(hexValue)) {
      const open: number = i === 0 ? 50 : dataPoints[i - 1].close ;
      const close = open + hexValue;
      const high = close + (Math.random() * 5);
      const low = open - (Math.random() * 5);
      const timeString = currentDate.toISOString().split('T')[0];
      dataPoints.push({ time: timeString, open, high, low, close });
      currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
    } else {
      const open: number = i === 0 ? 50 : dataPoints[i - 1].close ;
      const close = open - hexValue;
      const high = close + (Math.random() * 5);
      const low = open - (Math.random() * 5);
      const timeString = currentDate.toISOString().split('T')[0];
      dataPoints.push({ time: timeString, open, high, low, close });
      currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
    }
  }

  return dataPoints;
}

/**
 * 
 * @param base The base of the logarithm
 * @param value The value to take the logarithm of
 * 
 * @returns The logarithm of the value with the given base
 */
function log(base: number, value: number): number {
  return Math.log(value) / Math.log(base);
}

/**
 * 
 * @param x The value to take the sine of
 * 
 * @returns The sine of the value
 */
function sin(x: number): number {
  return Math.sin(x * 5);
}

function calculateCurrentCrashPoint(seconds_elapsed: number): number {
  return EXPONENTIAL_FACTOR ** seconds_elapsed;
}