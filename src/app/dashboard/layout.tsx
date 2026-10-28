import Link from "next/link";
import { getCurrentUser } from "@/server/auth/authorisation";
import { logoutAction } from "@/server/auth/actions";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?from=/dashboard");
  }

  // Counter staff navigation items (FRS §10.2)
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "New Application", href: "/form", icon: "📝" },
    { label: "Members", href: "/members", icon: "👥" },
    { label: "Receipts", href: "/receipts", icon: "🧾" },
    { label: "Endowment Donors", href: "/endowment-donors", icon: "🤝" },
    { label: "My Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#123D70] text-white flex flex-col shrink-0 shadow-xl">
        <div className="p-6 border-b border-white/10">
          <span className="text-xs font-bold tracking-wider text-[#E9753D] uppercase">
            Counter Desk
          </span>
          <h2 className="text-lg font-bold text-white leading-tight mt-1">
            CHSOBA Mangaluru
          </h2>
          <p className="text-xs text-white/70 mt-1">Staff Operations</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white leading-none">{user.name}</p>
              <p className="text-xs text-white/60 mt-1 capitalize">{user.role.replace("_", " ")}</p>
            </div>
            <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full" title="Active"></span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Area with Navbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-[#123D70]">Counter Operations</h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Canara High School Old Boys’ Association (R.)</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

