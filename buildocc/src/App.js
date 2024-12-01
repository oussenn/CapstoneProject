import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Map, LayoutDashboard, FileText } from 'lucide-react';
import BuildingOccupancyDashboard from './pages/BuildingOccupancyDashboard';
import CampusMap from './pages/CampusMap';

const NavLink = ({ to, children, icon: Icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      {Icon && <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />}
      {children}
    </Link>
  );
};

const Navigation = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Site Title */}
          <div className="flex items-center flex-shrink-0">
          <img src="https://upload.wikimedia.org/wikipedia/commons/d/d1/Al_Akhawayn_University_Logo.png" alt="AUI Logo" className="h-5 w-8" />
          <span className="ml-2 text-xl font-bold text-gray-900">AUI Building Occupancy Manager</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <NavLink to="/" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink to="/map" icon={Map}>
              Campus Map
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<BuildingOccupancyDashboard />} />
            <Route path="/map" element={<CampusMap />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;