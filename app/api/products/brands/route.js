/**
 * @swagger
 * /api/products/brands:
 *   get:
 *     summary: Get distinct product brands
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of brands
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
      `SELECT DISTINCT brand
       FROM products
       WHERE brand IS NOT NULL AND brand != ''
       ORDER BY brand`
    );

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => row.brand)
    });
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}