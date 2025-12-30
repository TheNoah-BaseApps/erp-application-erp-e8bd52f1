/**
 * @swagger
 * /api/products/export:
 *   get:
 *     summary: Export products to CSV
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV export
 *       401:
 *         description: Unauthorized
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT product_name, product_code, product_category, unit, critical_stock_level, brand, is_active
       FROM products
       ORDER BY created_at DESC`
    );

    const headers = ['Product Name', 'Code', 'Category', 'Unit', 'Critical Stock', 'Brand', 'Status'];
    const rows = result.rows.map(p => [
      p.product_name,
      p.product_code,
      p.product_category,
      p.unit,
      p.critical_stock_level,
      p.brand || '',
      p.is_active ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export products' },
      { status: 500 }
    );
  }
}