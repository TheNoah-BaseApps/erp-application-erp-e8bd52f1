'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, BarChart3, Shield, Zap, DollarSign } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">ERP System</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/login')}>
                Login
              </Button>
              <Button onClick={() => router.push('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Streamline Your Business Operations
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete ERP solution for product management, inventory tracking, and operational reporting
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/register')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="p-6">
            <Package className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Product Management</h3>
            <p className="text-gray-600">
              Manage your product catalog with categories, units, and SKU tracking
            </p>
          </Card>
          
          <Card className="p-6">
            <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Stock Monitoring</h3>
            <p className="text-gray-600">
              Real-time alerts for critical stock levels and inventory optimization
            </p>
          </Card>
          
          <Card className="p-6">
            <Shield className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
            <p className="text-gray-600">
              Secure access control with admin, manager, user, and viewer roles
            </p>
          </Card>
          
          <Card className="p-6">
            <Zap className="h-12 w-12 text-orange-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Audit Trail</h3>
            <p className="text-gray-600">
              Complete history of all product changes with user attribution
            </p>
          </Card>

          <Card className="p-6">
            <DollarSign className="h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Product Costs</h3>
            <p className="text-gray-600">
              Track and manage product unit costs by month for better pricing decisions
            </p>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Product catalog with categorization and brand tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Unit of measure and SKU/product code management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Critical stock level alerts and monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Advanced search, filter, and bulk operations</span>
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Role-based dashboards with operational insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Product export to CSV/Excel for reporting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Comprehensive audit trail for compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Multi-user collaboration with access control</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-gray-600">
          <p>&copy; 2024 ERP System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}