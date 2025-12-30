'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Package,
  Edit,
  Trash2,
  Plus,
  Search
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ProductCostsPage() {
  const [costs, setCosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalEntries: 0,
    avgCost: 0,
    latestMonth: '',
    productsTracked: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    month: '',
    unit_cost: ''
  });

  useEffect(() => {
    fetchCosts();
    fetchProducts();
  }, []);

  async function fetchCosts() {
    try {
      setLoading(true);
      const response = await fetch('/api/product-costs');
      const data = await response.json();
      
      if (data.success) {
        setCosts(data.data);
        calculateStats(data.data);
      } else {
        toast.error('Failed to load product costs');
      }
    } catch (error) {
      console.error('Error fetching costs:', error);
      toast.error('Error loading product costs');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  function calculateStats(data) {
    const totalEntries = data.length;
    const avgCost = data.length > 0 
      ? data.reduce((sum, item) => sum + parseFloat(item.unit_cost || 0), 0) / data.length 
      : 0;
    const latestMonth = data.length > 0 ? data[0].month : '';
    const uniqueProducts = new Set(data.map(item => item.product_id)).size;

    setStats({
      totalEntries,
      avgCost: avgCost.toFixed(2),
      latestMonth,
      productsTracked: uniqueProducts
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.product_id || !formData.month || !formData.unit_cost) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const url = selectedCost 
        ? `/api/product-costs/${selectedCost.id}`
        : '/api/product-costs';
      
      const method = selectedCost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(selectedCost ? 'Cost updated successfully' : 'Cost added successfully');
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        resetForm();
        fetchCosts();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving cost:', error);
      toast.error('Error saving cost');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this cost entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/product-costs/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cost deleted successfully');
        fetchCosts();
      } else {
        toast.error(data.error || 'Failed to delete cost');
      }
    } catch (error) {
      console.error('Error deleting cost:', error);
      toast.error('Error deleting cost');
    }
  }

  function handleEdit(cost) {
    setSelectedCost(cost);
    setFormData({
      product_id: cost.product_id,
      month: cost.month,
      unit_cost: cost.unit_cost
    });
    setIsEditModalOpen(true);
  }

  function resetForm() {
    setFormData({ product_id: '', month: '', unit_cost: '' });
    setSelectedCost(null);
  }

  function handleAddNew() {
    resetForm();
    setIsAddModalOpen(true);
  }

  const filteredCosts = costs.filter(cost => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cost.product_name?.toLowerCase().includes(searchLower) ||
      cost.sku?.toLowerCase().includes(searchLower) ||
      cost.month?.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Costs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage product unit costs by month
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Cost Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Entries
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Cost
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgCost}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Latest Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.latestMonth || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Products Tracked
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsTracked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name, SKU, or month..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCosts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No cost entries found
              </h3>
              <p className="text-gray-600 mb-4">
                Start tracking product costs by adding your first entry
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cost Entry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">
                        {cost.product_name || 'Unknown Product'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cost.sku || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{cost.month}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${parseFloat(cost.unit_cost).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(cost.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cost.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost Entry</DialogTitle>
            <DialogDescription>
              Record a new product cost for a specific month
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Product</Label>
              <select
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost ($)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Cost Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cost Entry</DialogTitle>
            <DialogDescription>
              Update the product cost information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_product_id">Product</Label>
              <select
                id="edit_product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_month">Month</Label>
              <Input
                id="edit_month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_unit_cost">Unit Cost ($)</Label>
              <Input
                id="edit_unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Cost Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}