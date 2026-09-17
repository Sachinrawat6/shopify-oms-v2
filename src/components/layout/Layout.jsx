import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';

const COLLAPSED_WIDTH = 72; // matches w-[72px] in Sidebar
const EXPANDED_WIDTH = 256; // matches w-64 in Sidebar (16rem = 256px)

const Layout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />

      <ToastContainer position="top-right" autoClose={4000} />

      <main
        className="flex-1 p-6 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
