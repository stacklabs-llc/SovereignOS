import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import HololinkReceiver from './HololinkReceiver';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/receiver" element={<HololinkReceiver />} />
      </Routes>
    </Router>
  );
}
