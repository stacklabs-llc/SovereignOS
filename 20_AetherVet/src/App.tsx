import React, { useState, useEffect } from "react";
import AetherVetDashboard from "./components/AetherVetDashboard";
import MobileHololink from "./components/MobileHololink";

function App() {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'desktop';
  });

  const [osTheme, setOsTheme] = useState('theme-aether');

  if (view === 'mobile_hololink') {
    return <MobileHololink />;
  }

  return (
    <div className={`w-screen h-screen overflow-hidden ${osTheme}`}>
      <AetherVetDashboard onNavigate={() => {}} />
    </div>
  );
}

export default App;
