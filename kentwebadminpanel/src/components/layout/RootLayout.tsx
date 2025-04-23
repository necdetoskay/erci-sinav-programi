import React from 'react';
import { Outlet } from 'react-router-dom';

const RootLayout: React.FC = () => {
  return (
    <div className="w-screen min-h-screen overflow-x-hidden bg-slate-50">
      <Outlet />
    </div>
  );
};

export default RootLayout; 