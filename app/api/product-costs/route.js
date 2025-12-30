import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * @swagger
 * /api/product-costs:
 *   get:
 *     summary: Get all product costs
 *     description: Retrieve all product cost entries with optional filtering by product_id or month
 *     tags: [Product Costs]
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
 *       500:
 *         description: Server error
 */
export async function GET(request) {
  try {
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

    const result = await query(queryText, params);

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

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({ 
      success: true, 
      data: result.rows,
      total 
    });
  } catch (error) {
    console.error('Error fetching product costs:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
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
 *       500:
 *         description: Server error
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, month, unit_cost } = body;

    if (!product_id || !month || unit_cost === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: product_id, month, unit_cost' 
      }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid month format. Use YYYY-MM format' 
      }, { status: 400 });
    }

    // Check if product exists
    const productCheck = await query(
      'SELECT id FROM products WHERE id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO product_costs (product_id, month, unit_cost, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [product_id, month, parseFloat(unit_cost)]
    );

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product cost:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}