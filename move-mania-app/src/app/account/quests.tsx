import { useEffect, useState } from "react";
import { UserQuest } from "@/lib/types";


export default function Quests({ quests }: { quests: UserQuest[] }) {
  return (
    <div className="text-white p-4 rounded-lg">
      <h1 className="text-xl font-bold mb-4">Quests</h1>
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
    <li className="flex flex-row m-10  rounded-xl justify-between shadow-[10px_10px_rgba(0,_98,_90,_0.5),_10px_10px_rgba(0,_98,_90,_0.6),_15px_15px_rgba(0,_98,_90,_0.2),_20px_20px_rgba(0,_98,_90,_0.1),_25px_25px_rgba(0,_98,_90,_0.05)]">
        <div>
            <p className="text-3xl">{quest.title}</p>
            <p className="pl-6">{quest.description}</p>
        </div>
        <div className=" flex flex-row items-right px-4 mx-4">
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
    <div className="text-right items-right">
      {/* use icons to indicated if completed */}
        {completed ? "✅" : "❌"}
    </div>
  );
}
