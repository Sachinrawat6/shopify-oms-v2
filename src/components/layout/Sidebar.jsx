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
  FiChevronLeft,
  FiChevronRight,
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

// ✅ Category metadata (order + label)
const CATEGORY_META = {
  processing: { label: 'Processing', order: 1 },
  'customer-service': { label: 'Customer Service', order: 2 },
  miscellaneous: { label: 'Miscellaneous', order: 3 },
};

// ✅ Group NAV_ITEMS by category
const GROUPED_NAV = NAV_ITEMS.reduce((acc, item) => {
  const cat = item.category || 'miscellaneous';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(item);
  return acc;
}, {});

// ✅ Sort categories by defined order
const SORTED_CATEGORIES = Object.keys(GROUPED_NAV).sort(
  (a, b) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
);

const Sidebar = ({ collapsed, onToggle }) => (
  <aside
    className={`fixed left-0 top-0 h-screen bg-white flex flex-col z-20 border-r border-gray-200 transition-[width] duration-300 ease-in-out ${
      collapsed ? 'w-[76px]' : 'w-64'
    }`}
  >
    {/* ---------- Header / Brand ---------- */}
    <div className="h-16 flex items-center border-b border-gray-100 px-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">S</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 leading-tight truncate">
              Shopify OMS
            </h1>
            <p className="text-[11px] text-gray-400 leading-tight">Order Management</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <button
          onClick={onToggle}
          aria-label="Collapse sidebar"
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FiChevronLeft className="text-base" />
        </button>
      )}
    </div>

    {/* Collapse toggle when collapsed */}
    {collapsed && (
      <button
        onClick={onToggle}
        aria-label="Expand sidebar"
        className="mx-auto mt-3 flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <FiChevronRight className="text-base" />
      </button>
    )}

    {/* ---------- Navigation (Grouped by Category) ---------- */}
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
      {SORTED_CATEGORIES.map((category, catIdx) => {
        const items = GROUPED_NAV[category];
        const meta = CATEGORY_META[category] || { label: category };

        return (
          <div key={category} className={catIdx !== 0 ? 'mt-5' : ''}>
            {/* Category Label (hidden when collapsed) */}
            {!collapsed ? (
              <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {meta.label}
              </p>
            ) : (
              // Collapsed: thin divider line between groups
              catIdx !== 0 && <div className="mx-auto mb-3 h-px w-6 bg-gray-200" />
            )}

            <ul className="space-y-0.5 px-3">
              {items.map((item) => {
                const Icon = ICONS[item.icon] || FiGrid;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center rounded-lg transition-colors duration-150 ${
                          collapsed ? 'justify-center h-11 w-11 mx-auto' : 'gap-3 px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active left indicator */}
                          {isActive && !collapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-indigo-600" />
                          )}

                          <Icon
                            className={`text-[18px] flex-shrink-0 ${
                              isActive
                                ? 'text-indigo-600'
                                : 'text-gray-400 group-hover:text-gray-700'
                            }`}
                          />

                          {!collapsed && (
                            <span
                              className={`text-sm truncate ${
                                isActive ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>

    {/* ---------- Footer ---------- */}
    <div className="border-t border-gray-100 p-3">
      {collapsed ? (
        <div className="flex justify-center">
          <span className="text-[11px] font-medium text-gray-400">v2.0</span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium text-gray-400">Version</span>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            v5.0
          </span>
        </div>
      )}
    </div>
  </aside>
);

export default Sidebar;
