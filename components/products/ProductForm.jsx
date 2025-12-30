'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { validateProductForm } from '@/lib/validation';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Food & Beverage',
  'Office Supplies',
  'Hardware',
  'Software',
  'Other'
];

const UNITS = [
  'Piece',
  'Box',
  'Carton',
  'Kilogram',
  'Liter',
  'Meter',
  'Set',
  'Pack'
];

export default function ProductForm({ mode = 'create', initialData = null, productId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    product_category: '',
    unit: '',
    critical_stock_level: '',
    brand: '',
    is_active: true
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        product_name: initialData.product_name || '',
        product_code: initialData.product_code || '',
        product_category: initialData.product_category || '',
        unit: initialData.unit || '',
        critical_stock_level: initialData.critical_stock_level?.toString() || '',
        brand: initialData.brand || '',
        is_active: initialData.is_active ?? true
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validation = validateProductForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = mode === 'edit' ? `/api/products/${productId}` : '/api/products';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          critical_stock_level: parseInt(formData.critical_stock_level)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} product`);
      }

      toast.success(`Product ${mode === 'edit' ? 'updated' : 'created'} successfully`);
      router.push('/products');
    } catch (err) {
      console.error(`Error ${mode}ing product:`, err);
      toast.error(err.message);
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="product_name">
                Product Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="Enter product name"
                disabled={loading}
                className={errors.product_name ? 'border-red-500' : ''}
              />
              {errors.product_name && (
                <p className="text-sm text-red-600">{errors.product_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_code">
                Product Code <span className="text-red-600">*</span>
              </Label>
              <Input
                id="product_code"
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                placeholder="Enter unique product code"
                disabled={loading}
                className={errors.product_code ? 'border-red-500' : ''}
              />
              {errors.product_code && (
                <p className="text-sm text-red-600">{errors.product_code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_category">
                Category <span className="text-red-600">*</span>
              </Label>
              <Select
                value={formData.product_category}
                onValueChange={(value) => handleSelectChange('product_category', value)}
                disabled={loading}
              >
                <SelectTrigger className={errors.product_category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_category && (
                <p className="text-sm text-red-600">{errors.product_category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit <span className="text-red-600">*</span>
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleSelectChange('unit', value)}
                disabled={loading}
              >
                <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-600">{errors.unit}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="critical_stock_level">
                Critical Stock Level <span className="text-red-600">*</span>
              </Label>
              <Input
                id="critical_stock_level"
                name="critical_stock_level"
                type="number"
                min="0"
                value={formData.critical_stock_level}
                onChange={handleChange}
                placeholder="Enter critical stock level"
                disabled={loading}
                className={errors.critical_stock_level ? 'border-red-500' : ''}
              />
              {errors.critical_stock_level && (
                <p className="text-sm text-red-600">{errors.critical_stock_level}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Enter brand name"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4"
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">
              Product is active
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Product' : 'Create Product'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}