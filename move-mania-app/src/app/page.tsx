import ControlCenter from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";
import Leaderboard from "./leaderboard";

export default function CrashPage() {

  return (
    <div className="bg-[#020202] text-white flex flex-col items-center px-2 gap-2 py-4 bg-noise w-full">
      <div className="flex flex-col items-center w-full gap-2">
        <div className="w-full flex flex-col items-center justify-between border border-neutral-700 overflow-hidden">
          <div className="w-full">
            <GameScreen />
          </div>
          <div className="w-full">
            <ControlCenter />
          </div>
        </div>
        <div className="h-full w-full flex flex-col items-center justify-center">
          <PlayerList />
        </div>
      </div>
      <div className="w-full h-full pb-12">
        <Leaderboard />
      </div>
    </div>
  );
}
