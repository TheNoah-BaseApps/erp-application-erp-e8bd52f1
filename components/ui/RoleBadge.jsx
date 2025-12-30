'use client';

import { cn } from '@/lib/utils';

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  user: 'bg-green-100 text-green-700 border-green-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function RoleBadge({ role }) {
  if (!role) return null;

  const normalizedRole = role.toLowerCase();
  const colorClass = roleColors[normalizedRole] || roleColors.user;

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colorClass
    )}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}