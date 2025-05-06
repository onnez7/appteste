import { NavLink } from 'react-router-dom';
import { HomeIcon, CreditCardIcon, CalendarIcon, UserIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        <NavItem to="/" icon={<HomeIcon className="h-6 w-6" />} label="Início" />
        <NavItem to="/subscriptions" icon={<CreditCardIcon className="h-6 w-6" />} label="Assinaturas" />
        <NavItem to="/consultations" icon={<CalendarIcon className="h-6 w-6" />} label="Consultas" />
        <NavItem to="/measurements" icon={<EyeIcon className="h-6 w-6" />} label="Medições" />
        <NavItem to="/account" icon={<UserIcon className="h-6 w-6" />} label="Conta" />
      </div>
    </nav>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center text-xs transition ${
          isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
        }`
      }
    >
      {icon}
      <span className="text-[11px] mt-1">{label}</span>
    </NavLink>
  );
}