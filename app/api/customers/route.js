import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a list of all customers with pagination and filtering
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in customer name or code
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: sales_rep
 *         schema:
 *           type: string
 *         description: Filter by sales representative
 *     responses:
 *       200:
 *         description: List of customers
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
    const search = searchParams.get('search');
    const country = searchParams.get('country');
    const sales_rep = searchParams.get('sales_rep');
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(customer_name ILIKE $${paramIndex} OR customer_code ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (country) {
      whereConditions.push(`country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }

    if (sales_rep) {
      whereConditions.push(`sales_rep = $${paramIndex}`);
      params.push(sales_rep);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM customers ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataResult = await query(
      `SELECT * FROM customers ${whereClause} 
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
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     description: Add a new customer to the system
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - customer_code
 *             properties:
 *               customer_name:
 *                 type: string
 *               customer_code:
 *                 type: string
 *               address:
 *                 type: string
 *               city_or_district:
 *                 type: string
 *               sales_rep:
 *                 type: string
 *               country:
 *                 type: string
 *               region_or_state:
 *                 type: string
 *               telephone_number:
 *                 type: string
 *               email:
 *                 type: string
 *               contact_person:
 *                 type: string
 *               payment_terms_limit:
 *                 type: number
 *               balance_risk_limit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_code,
      address,
      city_or_district,
      sales_rep,
      country,
      region_or_state,
      telephone_number,
      email,
      contact_person,
      payment_terms_limit,
      balance_risk_limit
    } = body;

    // Validation
    if (!customer_name || !customer_code) {
      return NextResponse.json(
        { success: false, error: 'Customer name and code are required' },
        { status: 400 }
      );
    }

    // Check for duplicate customer code
    const checkResult = await query(
      'SELECT id FROM customers WHERE customer_code = $1',
      [customer_code]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Customer code already exists' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO customers (
        customer_name, customer_code, address, city_or_district, 
        sales_rep, country, region_or_state, telephone_number, 
        email, contact_person, payment_terms_limit, balance_risk_limit,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) 
      RETURNING *`,
      [
        customer_name,
        customer_code,
        address,
        city_or_district,
        sales_rep,
        country,
        region_or_state,
        telephone_number,
        email,
        contact_person,
        payment_terms_limit,
        balance_risk_limit
      ]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}