import crypto from 'crypto';

/**
 * 
 * Calculate's the crash point based on the random number and salt based of the following criteria:
 * - There is a 3% chance of the crash point being 0 - meaning the game crashes immediately
 * - The crash point is calculated by taking the hash of the random number and salt and then converting it to a number
 * 
 * 
 * @param randomNumber The random number that is generated on-chain publically
 * @param salt The salt provided by the server to ensure the random number is not predictable
 */
export function calculateCrashPoint(randomNumber: number, salt: string) {
  const hash = crypto.createHash("sha256");
  const hm = hash.update(randomNumber + salt);
  const h = hm.digest('hex');
  
  if (parseInt(h, 16) % 33 == 0) {
    return 0;
  }

  const n = parseInt(h.slice(0, 13), 16);
  const e = Math.pow(2, 52);
  return Math.floor((100 * e - n) / (e - n)) / 100;
}

// // Run through the calculateCrashPoint function with 1000 times and log the result
// for (let i = 0; i < 1000; i++) {
//   const randomNumber = Math.random();
//   const salt = Math.random().toString(36).substring(7);
//   console.log(calculateCrashPoint(randomNumber, salt));
// }