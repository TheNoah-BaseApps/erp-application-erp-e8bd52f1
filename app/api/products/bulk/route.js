/**
 * @swagger
 * /api/products/bulk:
 *   post:
 *     summary: Bulk create/update products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Bulk operation completed
 *       400:
 *         description: Validation error
 */

import { NextResponse } from 'next/server';
import { getClient } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';
import { canEditProduct } from '@/lib/permissions';

export async function POST(request) {
  const client = await getClient();

  try {
    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    if (!canEditProduct(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Products array is required' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const product of products) {
      try {
        const {
          product_name,
          product_code,
          product_category,
          unit,
          critical_stock_level,
          brand,
          is_active = true
        } = product;

        // Check if product exists
        const existing = await client.query(
          'SELECT id FROM products WHERE product_code = $1',
          [product_code]
        );

        if (existing.rows.length > 0) {
          // Update existing
          await client.query(
            `UPDATE products
             SET product_name = $1, product_category = $2, unit = $3,
                 critical_stock_level = $4, brand = $5, is_active = $6, updated_at = NOW()
             WHERE product_code = $7`,
            [product_name, product_category, unit, critical_stock_level, brand, is_active, product_code]
          );
          updated++;
        } else {
          // Insert new
          await client.query(
            `INSERT INTO products
             (product_name, product_code, product_category, unit, critical_stock_level, brand, is_active, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [product_name, product_code, product_category, unit, critical_stock_level, brand, is_active, authResult.user.userId]
          );
          created++;
        }
      } catch (err) {
        errors.push({
          product_code: product.product_code,
          error: err.message
        });
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${created + updated} products`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk products' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}