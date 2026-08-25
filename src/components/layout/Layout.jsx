import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';

const Layout = () => (
  <div className="flex">
    <Sidebar />
    <ToastContainer position="top-right" autoClose={4000} />
    <main className="ml-64 flex-1 p-6 min-h-screen bg-gray-50">
      <Outlet />
    </main>
  </div>
);

export default Layout;
