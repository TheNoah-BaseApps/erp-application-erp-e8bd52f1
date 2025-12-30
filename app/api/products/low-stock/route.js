/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get products below critical stock level
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock products
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
      `SELECT p.*, u.name as created_by_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.is_active = true
       ORDER BY p.critical_stock_level ASC`
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}