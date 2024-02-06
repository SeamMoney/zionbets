import ChatWindow from "./chatWindow";
import ControlCenter from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";


export default function CrashPage() {
  return (
    <div className="h-full min-h-screen w-full bg-neutral-950">
      <span>
        Crash page
      </span>
      <GameScreen />
      <ControlCenter />
      <PlayerList />
      <ChatWindow />
    </div>
  )
}