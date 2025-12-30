'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

export default function AuditLogViewer({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No audit history available
      </div>
    );
  }

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log, index) => (
        <Card key={log.id || index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getActionColor(log.action)}>
                  {log.action}
                </Badge>
                <span className="text-sm text-gray-600">
                  by {log.user_name || 'Unknown User'}
                </span>
              </div>

              {log.old_values && log.new_values && (
                <div className="text-sm space-y-1 mt-2">
                  {Object.keys(log.new_values).map(key => {
                    if (log.old_values[key] !== log.new_values[key]) {
                      return (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="font-medium">{key}:</span>
                          <span className="text-red-600 line-through">
                            {JSON.stringify(log.old_values[key])}
                          </span>
                          <span>→</span>
                          <span className="text-green-600">
                            {JSON.stringify(log.new_values[key])}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {new Date(log.timestamp).toLocaleString()}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}