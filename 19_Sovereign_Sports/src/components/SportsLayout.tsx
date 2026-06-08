import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function SportsLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
