
export const SOCKET_EVENTS = {
  START_ROUND: 'start-round',
  SET_BET: 'set-bet',
  CASH_OUT: 'cash-out',
  BET_CONFIRMED: 'bet-confirmed',
  CASH_OUT_CONFIRMED: 'cash-out-confirmed',
  ROUND_RESULT: 'round-result', 
  ROUND_START: 'round-start',
}

export type BetData = {
  roundId: number,
  playerUsername: string, 
  betAmount: number,
  coinType: string
}

export type CashOutData = {
  roundId: number, 
  playerUsername: string, 
  cashOutMultiplier: number
}

export type RoundResult = {
  roundId: number,
  crashPoint: number,
}

export type RoundStart = {
  roundId: number,
  startTime: number,
  crashPoint: number
}

