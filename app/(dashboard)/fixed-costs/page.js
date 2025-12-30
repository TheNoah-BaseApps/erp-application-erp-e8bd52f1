'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function FixedCostsPage() {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [formData, setFormData] = useState({
    cost_name: '',
    month: '',
    amount: ''
  });

  useEffect(() => {
    fetchCosts();
  }, [searchTerm, monthFilter]);

  async function fetchCosts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (monthFilter) params.append('month', monthFilter);

      const response = await fetch(`/api/fixed-costs?${params}`);
      const data = await response.json();

      if (data.success) {
        setCosts(data.data);
      } else {
        toast.error('Failed to load fixed costs');
      }
    } catch (error) {
      console.error('Error fetching fixed costs:', error);
      toast.error('Error loading fixed costs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/fixed-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseInt(formData.amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Fixed cost added successfully');
        setShowAddModal(false);
        setFormData({ cost_name: '', month: '', amount: '' });
        fetchCosts();
      } else {
        toast.error(data.error || 'Failed to add fixed cost');
      }
    } catch (error) {
      console.error('Error adding fixed cost:', error);
      toast.error('Error adding fixed cost');
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const response = await fetch(`/api/fixed-costs/${editingCost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseInt(formData.amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Fixed cost updated successfully');
        setShowEditModal(false);
        setEditingCost(null);
        setFormData({ cost_name: '', month: '', amount: '' });
        fetchCosts();
      } else {
        toast.error(data.error || 'Failed to update fixed cost');
      }
    } catch (error) {
      console.error('Error updating fixed cost:', error);
      toast.error('Error updating fixed cost');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this fixed cost?')) return;

    try {
      const response = await fetch(`/api/fixed-costs/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Fixed cost deleted successfully');
        fetchCosts();
      } else {
        toast.error(data.error || 'Failed to delete fixed cost');
      }
    } catch (error) {
      console.error('Error deleting fixed cost:', error);
      toast.error('Error deleting fixed cost');
    }
  }

  function openEditModal(cost) {
    setEditingCost(cost);
    setFormData({
      cost_name: cost.cost_name,
      month: cost.month,
      amount: cost.amount.toString()
    });
    setShowEditModal(true);
  }

  const totalAmount = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fixed Costs</h1>
            <p className="mt-2 text-gray-600">Track and manage monthly fixed costs</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fixed Cost
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Fixed Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costs.length > 0 ? Math.round(totalAmount / costs.length).toLocaleString() : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Costs</CardTitle>
            <CardDescription>Search and filter fixed costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by cost name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fixed Costs List</CardTitle>
            <CardDescription>Manage all your fixed costs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : costs.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No fixed costs found</h3>
                <p className="mt-2 text-sm text-gray-600">Get started by adding your first fixed cost.</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fixed Cost
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Name</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.cost_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cost.month}</Badge>
                        </TableCell>
                        <TableCell>${cost.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(cost)}
                            >
                              <Pencil className="h-4 w-4" />
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
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fixed Cost</DialogTitle>
            <DialogDescription>Add a new fixed cost entry</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cost_name">Cost Name *</Label>
                <Input
                  id="cost_name"
                  value={formData.cost_name}
                  onChange={(e) => setFormData({ ...formData, cost_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month *</Label>
                <Input
                  id="month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Cost</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fixed Cost</DialogTitle>
            <DialogDescription>Update fixed cost details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_cost_name">Cost Name *</Label>
                <Input
                  id="edit_cost_name"
                  value={formData.cost_name}
                  onChange={(e) => setFormData({ ...formData, cost_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_month">Month *</Label>
                <Input
                  id="edit_month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Amount *</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Cost</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}