import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyToken } from '@/lib/auth/jwt';

/**
 * @swagger
 * /api/product-costs:
 *   get:
 *     summary: Get all product costs
 *     description: Retrieve all product cost entries with optional filtering by product_id or month
 *     tags: [Product Costs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM format)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of product costs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       product_id:
 *                         type: string
 *                       month:
 *                         type: string
 *                       unit_cost:
 *                         type: number
 *                       created_at:
 *                         type: string
 *                       updated_at:
 *                         type: string
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ 
        success: false, 
        error: 'Authorization header required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    // Verify admin role
    if (decoded.role !== 'admin') {
      console.error(`Access denied for user ${decoded.userId} with role ${decoded.role}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const month = searchParams.get('month');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryText = `
      SELECT pc.*, p.name as product_name, p.sku 
      FROM product_costs pc
      LEFT JOIN products p ON pc.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (productId) {
      paramCount++;
      queryText += ` AND pc.product_id = $${paramCount}`;
      params.push(productId);
    }

    if (month) {
      paramCount++;
      queryText += ` AND pc.month = $${paramCount}`;
      params.push(month);
    }

    queryText += ` ORDER BY pc.month DESC, pc.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    let result;
    try {
      result = await query(queryText, params);
    } catch (error) {
      console.error('Database query error fetching product costs:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch product costs from database' 
      }, { status: 500 });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM product_costs WHERE 1=1';
    const countParams = [];
    let countParamNum = 0;

    if (productId) {
      countParamNum++;
      countQuery += ` AND product_id = $${countParamNum}`;
      countParams.push(productId);
    }

    if (month) {
      countParamNum++;
      countQuery += ` AND month = $${countParamNum}`;
      countParams.push(month);
    }

    let countResult;
    try {
      countResult = await query(countQuery, countParams);
    } catch (error) {
      console.error('Database query error fetching product costs count:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch product costs count from database' 
      }, { status: 500 });
    }

    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({ 
      success: true, 
      data: result.rows,
      total 
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/product-costs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/product-costs:
 *   post:
 *     summary: Create a new product cost entry
 *     description: Add a new product cost record for a specific month
 *     tags: [Product Costs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - month
 *               - unit_cost
 *             properties:
 *               product_id:
 *                 type: string
 *                 description: UUID of the product
 *               month:
 *                 type: string
 *                 description: Month in YYYY-MM format
 *               unit_cost:
 *                 type: number
 *                 description: Cost per unit
 *     responses:
 *       201:
 *         description: Product cost created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ 
        success: false, 
        error: 'Authorization header required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    // Verify admin role
    if (decoded.role !== 'admin') {
      console.error(`Access denied for user ${decoded.userId} with role ${decoded.role}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { product_id, month, unit_cost } = body;

    if (!product_id || !month || unit_cost === undefined) {
      console.error('Missing required fields:', { product_id, month, unit_cost });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: product_id, month, unit_cost' 
      }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      console.error('Invalid month format:', month);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid month format. Use YYYY-MM format' 
      }, { status: 400 });
    }

    // Validate unit_cost is a number
    const parsedCost = parseFloat(unit_cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      console.error('Invalid unit_cost value:', unit_cost);
      return NextResponse.json({ 
        success: false, 
        error: 'unit_cost must be a valid positive number' 
      }, { status: 400 });
    }

    // Check if product exists
    let productCheck;
    try {
      productCheck = await query(
        'SELECT id FROM products WHERE id = $1',
        [product_id]
      );
    } catch (error) {
      console.error('Database error checking product existence:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify product existence' 
      }, { status: 500 });
    }

    if (productCheck.rows.length === 0) {
      console.error('Product not found:', product_id);
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    let result;
    try {
      result = await query(
        `INSERT INTO product_costs (product_id, month, unit_cost, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         RETURNING *`,
        [product_id, month, parsedCost]
      );
    } catch (error) {
      console.error('Database error creating product cost:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          error: 'Product cost entry for this month already exists' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create product cost entry' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/product-costs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}