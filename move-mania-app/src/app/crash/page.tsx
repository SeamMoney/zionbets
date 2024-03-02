import ControlCenter from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";
import CrashProvider from "./CrashProvider";

export default function CrashPage() {

  return (
    <CrashProvider>
      <div className="bg-[#020202] text-white flex flex-col items-center px-2 gap-2 py-4 bg-noise">
        <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-start 2xl:justify-center w-full lg:h-[700px] gap-2">
          <div className="lg:h-[700px] w-full lg:max-w-[700px] flex flex-col items-center justify-between gap-2 border border-neutral-700 p-2">
            <div className="w-full grow p-4">
              <GameScreen />
            </div>
            <div className="w-full">
              <ControlCenter />
            </div>
          </div>
          <div className="h-full">
            <PlayerList />
          </div>
        </div>
        <div className="border border-neutral-700 p-2 w-full h-[800px] lg:w-[1160px]"></div>
      </div>
    </CrashProvider>
  );
}
