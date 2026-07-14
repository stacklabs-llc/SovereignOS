import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SportsLayout from './components/SportsLayout';
import GameGrid from './components/GameGrid';
import VideoPlayer from './components/VideoPlayer';
import FanFanStackPortal from './components/FanFanStackPortal';
import PlaycallDesk from './components/PlaycallDesk';
import SportsLanding from './components/SportsLanding';
import FootyMatchCenter from './components/FootyMatchCenter';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<SportsLayout />}>
            <Route index element={<SportsLanding />} />
            <Route path="mlb" element={
              <>
                <div className="view-header">
                  <h2>MLB Network</h2>
                </div>
                <GameGrid sportType="mlb" />
              </>
            } />
            <Route path="pga" element={
              <>
                <div className="view-header">
                  <h2>PGA Tour</h2>
                </div>
                <GameGrid sportType="pga" />
              </>
            } />
            <Route path="footy" element={
              <>
                <div className="view-header">
                  <h2>FootyStack</h2>
                </div>
                <GameGrid sportType="footy" />
              </>
            } />
            <Route path="stream/:gameId" element={<VideoPlayer />} />
            <Route path="stream/footy/:gameId" element={<FootyMatchCenter />} />
            <Route path="fan-portal" element={<FanFanStackPortal />} />
            <Route path="playcall-desk" element={<PlaycallDesk />} />
            <Route path="creator-portal" element={<PlaycallDesk />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
