import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SportsLayout from './components/SportsLayout';
import GameGrid from './components/GameGrid';
import VideoPlayer from './components/VideoPlayer';
import FanFanStackPortal from './components/FanFanStackPortal';
import PlaycallDesk from './components/PlaycallDesk';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SportsLayout />}>
            <Route index element={<Navigate to="/mlb" replace />} />
            <Route path="mlb" element={
              <>
                <div className="view-header">
                  <h2>MLB Network</h2>
                </div>
                <GameGrid />
              </>
            } />
            <Route path="stream/:gameId" element={<VideoPlayer />} />
            <Route path="fan-portal" element={<FanFanStackPortal />} />
            <Route path="playcall-desk" element={<PlaycallDesk />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
