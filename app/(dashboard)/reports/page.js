'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ExportButton from '@/components/products/ExportButton';
import { BarChart3, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [productsRes, categoriesRes, brandsRes, lowStockRes] = await Promise.all([
        fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/products/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/products/brands', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/products/low-stock', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!productsRes.ok || !categoriesRes.ok || !brandsRes.ok || !lowStockRes.ok) {
        throw new Error('Failed to fetch report data');
      }

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();
      const lowStockData = await lowStockRes.json();

      if (productsData.success) {
        const allProducts = productsData.data || [];
        setProducts(allProducts);

        const activeProducts = allProducts.filter(p => p.is_active);
        const categoryBreakdown = {};
        const brandBreakdown = {};

        allProducts.forEach(p => {
          categoryBreakdown[p.product_category] = (categoryBreakdown[p.product_category] || 0) + 1;
          if (p.brand) {
            brandBreakdown[p.brand] = (brandBreakdown[p.brand] || 0) + 1;
          }
        });

        setStats({
          totalProducts: allProducts.length,
          activeProducts: activeProducts.length,
          inactiveProducts: allProducts.length - activeProducts.length,
          totalCategories: categoriesData.data?.length || 0,
          totalBrands: brandsData.data?.length || 0,
          lowStockCount: lowStockData.data?.length || 0,
          categoryBreakdown,
          brandBreakdown
        });
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message);
      toast.error('Failed to load report data');
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Product inventory insights and statistics</p>
        </div>
        <ExportButton products={products} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Products
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.activeProducts || 0} active, {stats?.inactiveProducts || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categories
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCategories || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Product categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Brands
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBrands || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Unique brands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.lowStockCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Below critical level
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / stats.totalProducts) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.brandBreakdown && Object.keys(stats.brandBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.brandBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([brand, count]) => (
                    <div key={brand} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{brand}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(count / stats.totalProducts) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No brand data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Active Products</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.activeProducts || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.totalProducts > 0
                  ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1)
                  : 0}% of total
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.lowStockCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requires attention
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Categories</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.totalCategories || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Product types
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}