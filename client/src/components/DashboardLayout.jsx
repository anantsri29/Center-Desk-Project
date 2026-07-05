import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/dashboard/students", label: "Students" },
  { to: "/dashboard/attendance", label: "Attendance" },
  { to: "/dashboard/fees", label: "Fees" },
  { to: "/dashboard/test-scores", label: "Test Scores" },
  { to: "/dashboard/pricing", label: "Pricing" },
  { to: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="flex w-72 flex-col border-r border-gray-200/80 bg-white/80 backdrop-blur-xl">
        <div className="border-b border-gray-200/80 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-lg font-semibold text-white shadow-lg">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-900">CenterDesk</h1>
              <p className="mt-1 truncate text-sm text-gray-500">
                {user?.centerName}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-50 to-orange-50 text-violet-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/80 text-xs font-semibold text-violet-600 shadow-sm">
                {label.charAt(0)}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200/80 px-4 py-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.name}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-gray-600 shadow-sm">
              {user?.plan} plan
            </span>
            <button
              onClick={handleLogout}
              className="mt-3 w-full rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-2 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
