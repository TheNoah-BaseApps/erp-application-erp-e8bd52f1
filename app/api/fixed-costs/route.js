import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * @swagger
 * /api/fixed-costs:
 *   get:
 *     summary: Get all fixed costs
 *     description: Retrieve a list of all fixed costs with pagination and filtering
 *     tags: [Fixed Costs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in cost name
 *     responses:
 *       200:
 *         description: List of fixed costs
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
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       500:
 *         description: Server error
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const month = searchParams.get('month');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (month) {
      whereConditions.push(`month = $${paramIndex}`);
      params.push(month);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`cost_name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM fixed_costs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataResult = await query(
      `SELECT * FROM fixed_costs ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching fixed costs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/fixed-costs:
 *   post:
 *     summary: Create a new fixed cost
 *     description: Add a new fixed cost entry
 *     tags: [Fixed Costs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cost_name
 *               - month
 *               - amount
 *             properties:
 *               cost_name:
 *                 type: string
 *               month:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Fixed cost created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { cost_name, month, amount } = body;

    // Validation
    if (!cost_name || !month || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Cost name, month, and amount are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO fixed_costs (cost_name, month, amount, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [cost_name, month, amount]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating fixed cost:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}