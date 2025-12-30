/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - product_code
 *               - unit
 *             properties:
 *               product_name:
 *                 type: string
 *               product_code:
 *                 type: string
 *               product_category:
 *                 type: string
 *               unit:
 *                 type: string
 *               critical_stock_level:
 *                 type: integer
 *               brand:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';
import { validateProductForm } from '@/lib/validation';

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
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateProductForm(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const {
      product_name,
      product_code,
      product_category,
      unit,
      critical_stock_level,
      brand,
      is_active = true
    } = body;

    // Check for duplicate product code
    const existing = await query(
      'SELECT id FROM products WHERE product_code = $1',
      [product_code]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Product code already exists' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO products 
       (product_name, product_code, product_category, unit, critical_stock_level, brand, is_active, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        product_name,
        product_code,
        product_category,
        unit,
        critical_stock_level,
        brand || null,
        is_active,
        authResult.user.userId
      ]
    );

    const product = result.rows[0];

    // Create audit log
    await query(
      `INSERT INTO product_audit_log (product_id, action, changed_by, new_values, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        product.id,
        'create',
        authResult.user.userId,
        JSON.stringify(product)
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}