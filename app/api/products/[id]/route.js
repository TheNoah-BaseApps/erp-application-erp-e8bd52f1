/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';
import { canEditProduct, canDeleteProduct } from '@/lib/permissions';

export async function GET(request, { params }) {
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
       WHERE p.id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    const body = await request.json();

    // Get old values for audit
    const oldResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [params.id]
    );

    if (oldResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const oldValues = oldResult.rows[0];

    const {
      product_name,
      product_code,
      product_category,
      unit,
      critical_stock_level,
      brand,
      is_active
    } = body;

    // Check for duplicate product code
    if (product_code !== oldValues.product_code) {
      const existing = await query(
        'SELECT id FROM products WHERE product_code = $1 AND id != $2',
        [product_code, params.id]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Product code already exists' },
          { status: 400 }
        );
      }
    }

    const result = await query(
      `UPDATE products
       SET product_name = $1, product_code = $2, product_category = $3, 
           unit = $4, critical_stock_level = $5, brand = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        product_name,
        product_code,
        product_category,
        unit,
        critical_stock_level,
        brand || null,
        is_active,
        params.id
      ]
    );

    const newValues = result.rows[0];

    // Create audit log
    await query(
      `INSERT INTO product_audit_log (product_id, action, changed_by, old_values, new_values, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        params.id,
        'update',
        authResult.user.userId,
        JSON.stringify(oldValues),
        JSON.stringify(newValues)
      ]
    );

    return NextResponse.json({
      success: true,
      data: newValues,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    if (!canDeleteProduct(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get product for audit
    const productResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [params.id]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    // Soft delete
    await query(
      'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1',
      [params.id]
    );

    // Create audit log
    await query(
      `INSERT INTO product_audit_log (product_id, action, changed_by, old_values, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        params.id,
        'delete',
        authResult.user.userId,
        JSON.stringify(product)
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}