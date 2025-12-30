'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportButton({ products }) {
  const [loading, setLoading] = useState(false);

  const exportToCSV = () => {
    try {
      setLoading(true);
      const headers = ['Product Name', 'Code', 'Category', 'Brand', 'Unit', 'Critical Stock', 'Status'];
      const rows = products.map(p => [
        p.product_name,
        p.product_code,
        p.product_category,
        p.brand || '',
        p.unit,
        p.critical_stock_level,
        p.is_active ? 'Active' : 'Inactive'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Products exported to CSV successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export products');
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    try {
      setLoading(true);
      const jsonContent = JSON.stringify(products, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Products exported to JSON successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading || products.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}