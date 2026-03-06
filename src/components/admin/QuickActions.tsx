import Link from 'next/link';

interface ActionItem {
  icon: string;
  label: string;
  href: string;
  description: string;
}

const actions: ActionItem[] = [
  {
    icon: '👤',
    label: 'Add Employee',
    href: '/admin/employees/new',
    description: 'Create a new employee account',
  },
  {
    icon: '✨',
    label: 'Add Service',
    href: '/admin/services/new',
    description: 'Create a new salon service',
  },
  {
    icon: '📅',
    label: 'View Calendar',
    href: '/admin/appointments',
    description: 'Manage all appointments',
  },
  {
    icon: '📊',
    label: 'View Reports',
    href: '/admin/reports',
    description: 'Check revenue and analytics',
  },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            <h3 className="font-semibold text-slate-900">{action.label}</h3>
            <p className="text-sm text-slate-600 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
