import { UserQuest } from "@/lib/types"


const BetVolumeQuest: UserQuest = {
    id: 1,
    title: "Bet Volume",
    description: "Bet a total of $1000",
    reward: 100,
    completed: false
}

const BigWinQuest: UserQuest = {
    id: 2,
    title: "Big Win",
    description: "Win a bet with a multiplier of 10x",
    reward: 200,
    completed: false
}

const LoseBigQuest: UserQuest = {
    id: 3,
    title: "Lose Big",
    description: "Lose a bet at 0x",
    reward: 200,
    completed: false
}
const closeCallQuest: UserQuest = {
    id: 4,
    title: "Close Call",
    description: "Win a bet within 0.1x of the crash point",
    reward: 200,
    completed: false
}

const hotStreakQuest: UserQuest = {
    id: 5,
    title: "Hot Streak",
    description: "Win 5 bets in a row over 2x",
    reward: 500,
    completed: false
}

export const quests: UserQuest[] = [
    BetVolumeQuest,
    BigWinQuest,
    LoseBigQuest,
    closeCallQuest,
    hotStreakQuest
];
