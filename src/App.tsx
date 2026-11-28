import { Header } from './components/editor/header'
import { ControlPanel } from './components/editor/control-panel'
import { Preview } from './components/editor/preview'

export function App() {
  return (
    <div className="flex h-screen min-h-0 flex-col bg-background text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Preview />
        <ControlPanel />
      </div>
    </div>
  )
}
