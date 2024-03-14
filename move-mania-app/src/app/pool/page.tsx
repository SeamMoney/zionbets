import PoolGraph from "./poolGraph";
import PoolInfo from "./poolInfo";
import PoolModal from "./poolModal";


export default function CrashPage() {

  return (
    <div className="bg-[#020202] text-white flex flex-col items-center px-2 gap-2 py-4 bg-noise w-full">
      <div className="flex flex-col items-center w-full gap-2">
        <div className="w-full">
          <PoolGraph />
        </div>
        <div className="w-full">
          <PoolInfo />
        </div>
        <div className="w-full">
          <PoolModal />
        </div>
      </div>
    </div>
  );
}
