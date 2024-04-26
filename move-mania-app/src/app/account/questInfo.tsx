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


export const quests: UserQuest[] = [
    BetVolumeQuest,
    BigWinQuest,
    LoseBigQuest
];
