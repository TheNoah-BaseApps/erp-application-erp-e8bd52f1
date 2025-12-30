'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import RoleBadge from '@/components/ui/RoleBadge';
import StockLevelIndicator from './StockLevelIndicator';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import Pagination from '@/components/ui/Pagination';
import { Edit, Trash2, Eye } from 'lucide-react';
import { canEditProduct, canDeleteProduct } from '@/lib/permissions';

export default function ProductTable({ products, onDelete, onRefresh }) {
  const router = useRouter();
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState(null);
  const itemsPerPage = 10;

  useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
  }, []);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (deleteProduct) {
      await onDelete(deleteProduct.id);
      setDeleteProduct(null);
      if (paginatedProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell>{product.product_code}</TableCell>
                  <TableCell>{product.product_category}</TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{product.critical_stock_level}</span>
                      <StockLevelIndicator
                        currentLevel={product.critical_stock_level}
                        criticalLevel={product.critical_stock_level}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={product.is_active ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEditProduct(userRole) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/products/edit/${product.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteProduct(userRole) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <ConfirmationDialog
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteProduct?.product_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}