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
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('GET /api/products - Missing or invalid Authorization header');
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      console.error('GET /api/products - Empty token provided');
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      console.error('GET /api/products - Authentication failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify user has appropriate role (admin, manager, or user can view products)
    const allowedRoles = ['admin', 'manager', 'user'];
    if (!authResult.user || !authResult.user.role || !allowedRoles.includes(authResult.user.role)) {
      console.error('GET /api/products - Insufficient permissions:', {
        userId: authResult.user?.userId,
        role: authResult.user?.role
      });
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view products' },
        { status: 403 }
      );
    }

    let result;
    try {
      result = await query(
        `SELECT p.*, u.name as created_by_name
         FROM products p
         LEFT JOIN users u ON p.created_by = u.id
         ORDER BY p.created_at DESC`
      );
    } catch (dbError) {
      console.error('GET /api/products - Database query error:', {
        error: dbError.message,
        stack: dbError.stack,
        userId: authResult.user.userId
      });
      return NextResponse.json(
        { success: false, error: 'Database error while fetching products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('GET /api/products - Unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('POST /api/products - Missing or invalid Authorization header');
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      console.error('POST /api/products - Empty token provided');
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      console.error('POST /api/products - Authentication failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify user has appropriate role (only admin and manager can create products)
    const allowedRoles = ['admin', 'manager'];
    if (!authResult.user || !authResult.user.role || !allowedRoles.includes(authResult.user.role)) {
      console.error('POST /api/products - Insufficient permissions:', {
        userId: authResult.user?.userId,
        role: authResult.user?.role
      });
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create products' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('POST /api/products - JSON parse error:', parseError.message);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = validateProductForm(body);

    if (!validation.isValid) {
      console.error('POST /api/products - Validation failed:', {
        errors: validation.errors,
        userId: authResult.user.userId,
        body
      });
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
    let existing;
    try {
      existing = await query(
        'SELECT id FROM products WHERE product_code = $1',
        [product_code]
      );
    } catch (dbError) {
      console.error('POST /api/products - Database error checking duplicate:', {
        error: dbError.message,
        stack: dbError.stack,
        productCode: product_code
      });
      return NextResponse.json(
        { success: false, error: 'Database error while checking product code' },
        { status: 500 }
      );
    }

    if (existing.rows.length > 0) {
      console.error('POST /api/products - Duplicate product code:', {
        productCode: product_code,
        existingId: existing.rows[0].id
      });
      return NextResponse.json(
        { success: false, error: 'Product code already exists' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await query(
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
    } catch (dbError) {
      console.error('POST /api/products - Database error inserting product:', {
        error: dbError.message,
        stack: dbError.stack,
        userId: authResult.user.userId,
        productData: { product_name, product_code, unit }
      });
      return NextResponse.json(
        { success: false, error: 'Database error while creating product' },
        { status: 500 }
      );
    }

    const product = result.rows[0];

    // Create audit log
    try {
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
    } catch (auditError) {
      console.error('POST /api/products - Audit log creation failed:', {
        error: auditError.message,
        stack: auditError.stack,
        productId: product.id,
        userId: authResult.user.userId
      });
      // Don't fail the request if audit log fails, but log it
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/products - Unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}