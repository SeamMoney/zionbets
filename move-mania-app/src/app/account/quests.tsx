import { useEffect, useState } from "react";
import { UserQuest } from "@/lib/types";
import { QuestBase } from "../TailwindBase";


export default function Quests({ quests }: { quests: UserQuest[] }) {
  return (
    <div className="text-white p-4 rounded-lg w-full">
      <h1 className="text-6xl font-bold mb-4">Quests</h1>
      <ul>
        {quests.map((quest) => (
          <Quest 
            quest={quest}
            key={quest.id}
          />
        ))}
      </ul>
    </div>
  );
}

function Quest({ quest }: { quest: UserQuest }) {
  const completionStatus = quest.completed ? "Completed" : "Incomplete";
  
  return (
    <li className={QuestBase}>
        <div>
            <p className="text-3xl">{quest.title}</p>
            <p className="pl-6">{quest.description}</p>
        </div>
        <div className=" flex flex-row justify-between px-4 mx-4">
            <QuestReward reward={quest.reward} />
            <QuestStatus completed={quest.completed} />
        </div>
        
    </li>
  );
}

function QuestReward({ reward }: { reward: number }) {
  return (
    <div className="bg-opacity-20 bg-zinc-700">
        <p className="text-2xl text-right text-green-400">{reward}</p>
        <p className="text-md text-right opacity-45">pts</p>
    </div>
  );
}

function QuestStatus({ completed }: { completed: boolean }) {
  return (
    <div className="text-right ml-4  pl-4  items-right">
      {/* use icons to indicated if completed */}
        {completed ? "✅" : "❌"}
    </div>
  );
}
