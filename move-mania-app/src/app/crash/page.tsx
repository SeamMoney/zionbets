import CrashChart from "@/components/CrashChart.client";
import ChatWindow from "./chatWindow";
import ControlCenter from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";


export default function CrashPage() {
  return (
    <div className="h-full w-full bg-neutral-950 text-white flex flex-col items-center py-4">
      <div className="flex flex-row items-start w-full h-[700px] gap-2 px-2">
        <div className=" w-[75%] flex flex-col items-center gap-2 h-full border border-neutral-700">
          <div className="h-[90%]">
            <GameScreen />
            {/* <CrashChart /> */}
          </div>
          <ControlCenter />
        </div>
        <div className="h-full max-w-[300px]">
          <PlayerList />
        </div>
      </div>
    </div>
  )
}