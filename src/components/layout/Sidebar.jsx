import { NavLink } from 'react-router-dom';
import {
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiUserX,
  FiPauseCircle,
  FiGrid,
  FiX,
  FiSlash,
  FiShieldOff,
} from 'react-icons/fi';
import { NAV_ITEMS } from '../../constants';

const ICONS = {
  upload: FiUpload,
  'check-circle': FiCheckCircle,
  clock: FiClock,
  'x-circle': FiXCircle,
  'user-x': FiUserX,
  'pause-circle': FiPauseCircle,
  grid: FiGrid,
  x: FiX,
  slash: FiSlash,
  'shield-off': FiShieldOff,
};

const Sidebar = () => (
  <div className="fixed left-0 top-0 h-screen w-64 bg-white shadow flex flex-col z-10">
    <div className="p-6 border-b border-gray-100">
      <h1 className="text-xl font-bold text-indigo-600">Shopify OMS</h1>
    </div>

    <nav className="flex-1 p-4 overflow-y-auto">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] || FiGrid;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`text-lg ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>

    <div className="p-4 border-t border-gray-100">
      <p className="px-4 py-2 text-sm text-gray-400">V.2.0</p>
    </div>
  </div>
);

export default Sidebar;
