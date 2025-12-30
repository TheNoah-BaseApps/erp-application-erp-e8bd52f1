'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StockLevelIndicator from '@/components/products/StockLevelIndicator';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import RoleBadge from '@/components/ui/RoleBadge';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { canEditProduct, canDeleteProduct } from '@/lib/permissions';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    fetchProductDetails();
  }, [params.id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [productRes, auditRes] = await Promise.all([
        fetch(`/api/products/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/audit/products/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!productRes.ok) {
        throw new Error('Failed to fetch product details');
      }

      const productData = await productRes.json();
      const auditData = await auditRes.json();

      if (productData.success) {
        setProduct(productData.data);
      }

      if (auditData.success) {
        setAuditLogs(auditData.data || []);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError(err.message);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      router.push('/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Product not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.product_name}</h1>
            <p className="text-gray-600">Product Code: {product.product_code}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {canEditProduct(userRole) && (
            <Button 
              variant="outline"
              onClick={() => router.push(`/products/edit/${params.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDeleteProduct(userRole) && (
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Product Name</p>
                <p className="font-medium">{product.product_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Product Code</p>
                <p className="font-medium">{product.product_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="font-medium">{product.product_category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Brand</p>
                <p className="font-medium">{product.brand || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Unit</p>
                <p className="font-medium">{product.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical Stock Level</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{product.critical_stock_level}</p>
                  <StockLevelIndicator 
                    currentLevel={product.critical_stock_level}
                    criticalLevel={product.critical_stock_level}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <RoleBadge role={product.is_active ? 'active' : 'inactive'} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created At</p>
                <p className="font-medium">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <RoleBadge role={product.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="font-medium">
                {new Date(product.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Stock Alert</p>
              <p className="font-medium">
                {product.critical_stock_level} {product.unit}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogViewer logs={auditLogs} />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}