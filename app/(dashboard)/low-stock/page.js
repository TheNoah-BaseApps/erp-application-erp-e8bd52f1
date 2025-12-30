'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StockLevelIndicator from '@/components/products/StockLevelIndicator';
import { AlertTriangle, Package, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function LowStockPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/low-stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch low stock products');
      }

      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      setError(err.message);
      toast.error('Failed to load low stock products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Low Stock Alerts</h1>
          <p className="text-gray-600">Products below critical stock level</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="font-semibold text-orange-600">
            {products.length} Alert{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Stock Levels Good!</h3>
            <p className="text-gray-600 mb-4">
              No products are currently below their critical stock levels.
            </p>
            <Button onClick={() => router.push('/products')}>
              View All Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {product.product_name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                          <span>Code: <span className="font-medium">{product.product_code}</span></span>
                          <span>Category: <span className="font-medium">{product.product_category}</span></span>
                          {product.brand && (
                            <span>Brand: <span className="font-medium">{product.brand}</span></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Critical Level:</span>
                        <span className="font-semibold text-orange-600">
                          {product.critical_stock_level} {product.unit}
                        </span>
                      </div>
                      <StockLevelIndicator 
                        currentLevel={product.critical_stock_level}
                        criticalLevel={product.critical_stock_level}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/products/edit/${product.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}