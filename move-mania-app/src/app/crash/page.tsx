import ControlCenter from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";


export default function CrashPage() {
  return (
    <div>
      <span>
        Crash page
      </span>
      <GameScreen />
      <ControlCenter />
      <PlayerList />
      
    </div>
  )
}