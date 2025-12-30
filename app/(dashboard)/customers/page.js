'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_code: '',
    address: '',
    city_or_district: '',
    sales_rep: '',
    country: '',
    region_or_state: '',
    telephone_number: '',
    email: '',
    contact_person: '',
    payment_terms_limit: '',
    balance_risk_limit: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, countryFilter]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (countryFilter) params.append('country', countryFilter);

      const response = await fetch(`/api/customers?${params}`);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
      } else {
        toast.error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error loading customers');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payment_terms_limit: formData.payment_terms_limit ? parseInt(formData.payment_terms_limit) : null,
          balance_risk_limit: formData.balance_risk_limit ? parseInt(formData.balance_risk_limit) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Customer added successfully');
        setShowAddModal(false);
        resetForm();
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error adding customer');
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payment_terms_limit: formData.payment_terms_limit ? parseInt(formData.payment_terms_limit) : null,
          balance_risk_limit: formData.balance_risk_limit ? parseInt(formData.balance_risk_limit) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Customer updated successfully');
        setShowEditModal(false);
        setEditingCustomer(null);
        resetForm();
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error updating customer');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error deleting customer');
    }
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      customer_code: customer.customer_code,
      address: customer.address || '',
      city_or_district: customer.city_or_district || '',
      sales_rep: customer.sales_rep || '',
      country: customer.country || '',
      region_or_state: customer.region_or_state || '',
      telephone_number: customer.telephone_number || '',
      email: customer.email || '',
      contact_person: customer.contact_person || '',
      payment_terms_limit: customer.payment_terms_limit ? customer.payment_terms_limit.toString() : '',
      balance_risk_limit: customer.balance_risk_limit ? customer.balance_risk_limit.toString() : ''
    });
    setShowEditModal(true);
  }

  function resetForm() {
    setFormData({
      customer_name: '',
      customer_code: '',
      address: '',
      city_or_district: '',
      sales_rep: '',
      country: '',
      region_or_state: '',
      telephone_number: '',
      email: '',
      contact_person: '',
      payment_terms_limit: '',
      balance_risk_limit: ''
    });
  }

  const countries = [...new Set(customers.map(c => c.country).filter(Boolean))];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="mt-2 text-gray-600">Manage customer information and contacts</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[...new Set(customers.map(c => c.region_or_state).filter(Boolean))].length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Customers</CardTitle>
            <CardDescription>Search and filter customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers List</CardTitle>
            <CardDescription>Manage all your customers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No customers found</h3>
                <p className="mt-2 text-sm text-gray-600">Get started by adding your first customer.</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Sales Rep</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.customer_code}</Badge>
                        </TableCell>
                        <TableCell>{customer.country || '-'}</TableCell>
                        <TableCell>{customer.sales_rep || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {customer.email || customer.telephone_number || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(customer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_code">Customer Code *</Label>
                <Input
                  id="customer_code"
                  value={formData.customer_code}
                  onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city_or_district">City/District</Label>
                <Input
                  id="city_or_district"
                  value={formData.city_or_district}
                  onChange={(e) => setFormData({ ...formData, city_or_district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region_or_state">Region/State</Label>
                <Input
                  id="region_or_state"
                  value={formData.region_or_state}
                  onChange={(e) => setFormData({ ...formData, region_or_state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_rep">Sales Rep</Label>
                <Input
                  id="sales_rep"
                  value={formData.sales_rep}
                  onChange={(e) => setFormData({ ...formData, sales_rep: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone_number">Telephone</Label>
                <Input
                  id="telephone_number"
                  type="tel"
                  value={formData.telephone_number}
                  onChange={(e) => setFormData({ ...formData, telephone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms_limit">Payment Terms Limit (days)</Label>
                <Input
                  id="payment_terms_limit"
                  type="number"
                  value={formData.payment_terms_limit}
                  onChange={(e) => setFormData({ ...formData, payment_terms_limit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance_risk_limit">Balance Risk Limit</Label>
                <Input
                  id="balance_risk_limit"
                  type="number"
                  value={formData.balance_risk_limit}
                  onChange={(e) => setFormData({ ...formData, balance_risk_limit: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_customer_name">Customer Name *</Label>
                <Input
                  id="edit_customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_customer_code">Customer Code *</Label>
                <Input
                  id="edit_customer_code"
                  value={formData.customer_code}
                  onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_city_or_district">City/District</Label>
                <Input
                  id="edit_city_or_district"
                  value={formData.city_or_district}
                  onChange={(e) => setFormData({ ...formData, city_or_district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_region_or_state">Region/State</Label>
                <Input
                  id="edit_region_or_state"
                  value={formData.region_or_state}
                  onChange={(e) => setFormData({ ...formData, region_or_state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_country">Country</Label>
                <Input
                  id="edit_country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_sales_rep">Sales Rep</Label>
                <Input
                  id="edit_sales_rep"
                  value={formData.sales_rep}
                  onChange={(e) => setFormData({ ...formData, sales_rep: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_contact_person">Contact Person</Label>
                <Input
                  id="edit_contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_telephone_number">Telephone</Label>
                <Input
                  id="edit_telephone_number"
                  type="tel"
                  value={formData.telephone_number}
                  onChange={(e) => setFormData({ ...formData, telephone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_payment_terms_limit">Payment Terms Limit (days)</Label>
                <Input
                  id="edit_payment_terms_limit"
                  type="number"
                  value={formData.payment_terms_limit}
                  onChange={(e) => setFormData({ ...formData, payment_terms_limit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_balance_risk_limit">Balance Risk Limit</Label>
                <Input
                  id="edit_balance_risk_limit"
                  type="number"
                  value={formData.balance_risk_limit}
                  onChange={(e) => setFormData({ ...formData, balance_risk_limit: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}