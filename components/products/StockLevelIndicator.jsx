'use client';

import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export default function StockLevelIndicator({ currentLevel, criticalLevel }) {
  const percentage = (currentLevel / criticalLevel) * 100;

  if (percentage <= 50) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">Critical</span>
      </div>
    );
  }

  if (percentage <= 100) {
    return (
      <div className="flex items-center gap-1 text-orange-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Warning</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span className="text-xs font-medium">Good</span>
    </div>
  );
}