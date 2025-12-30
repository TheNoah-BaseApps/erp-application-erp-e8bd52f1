'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductTable from '@/components/products/ProductTable';
import SearchBar from '@/components/products/SearchBar';
import FilterPanel from '@/components/products/FilterPanel';
import ExportButton from '@/components/products/ExportButton';
import BulkUploadDialog from '@/components/products/BulkUploadDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Package, Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    status: 'all'
  });
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.product_name?.toLowerCase().includes(query) ||
        p.product_code?.toLowerCase().includes(query) ||
        p.product_category?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(p => p.product_category === filters.category);
    }

    if (filters.brand) {
      filtered = filtered.filter(p => p.brand === filters.brand);
    }

    if (filters.status === 'active') {
      filtered = filtered.filter(p => p.is_active);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(p => !p.is_active);
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchProducts();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex gap-3">
          <ExportButton products={filteredProducts} />
          <Button 
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
          >
            Bulk Upload
          </Button>
          <Button onClick={() => router.push('/products/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64">
          <FilterPanel 
            filters={filters}
            onFilterChange={setFilters}
            products={products}
          />
        </div>

        <div className="flex-1 space-y-4">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filters.category || filters.brand
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by adding your first product'}
              </p>
              <Button onClick={() => router.push('/products/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <ProductTable 
              products={filteredProducts}
              onDelete={handleDelete}
              onRefresh={fetchProducts}
            />
          )}
        </div>
      </div>

      <BulkUploadDialog 
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}