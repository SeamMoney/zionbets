import CrashChart from "@/components/CrashChart.client";
import ChatWindow from "./chatWindow";
import ControlCenter from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";


export default function CrashPage() {
  return (
    <div className="bg-neutral-950 text-white flex flex-col items-center px-2 gap-2 py-4">
      <div className="flex flex-row items-start w-full h-[700px] gap-2 ">
        <div className=" w-[75%] flex flex-col items-center gap-2 h-full border border-neutral-700 p-2">
          <div className="h-full w-full p-4">
            <GameScreen />
          </div>
          <div className="max-h-[100px] h-full w-full">
            <ControlCenter />
          </div>
        </div>
        <div className="h-full w-full max-w-[400px]">
          <PlayerList />
        </div>
      </div>
      <div className="border border-neutral-700 p-2 w-full h-[800px]">

      </div>
    </div>
  )
}