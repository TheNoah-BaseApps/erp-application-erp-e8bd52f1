import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const result = await query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
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

    // Check for duplicate customer code (excluding current customer)
    if (customer_code) {
      const checkResult = await query(
        'SELECT id FROM customers WHERE customer_code = $1 AND id != $2',
        [customer_code, id]
      );

      if (checkResult.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Customer code already exists' },
          { status: 400 }
        );
      }
    }

    const result = await query(
      `UPDATE customers 
       SET customer_name = COALESCE($1, customer_name),
           customer_code = COALESCE($2, customer_code),
           address = COALESCE($3, address),
           city_or_district = COALESCE($4, city_or_district),
           sales_rep = COALESCE($5, sales_rep),
           country = COALESCE($6, country),
           region_or_state = COALESCE($7, region_or_state),
           telephone_number = COALESCE($8, telephone_number),
           email = COALESCE($9, email),
           contact_person = COALESCE($10, contact_person),
           payment_terms_limit = COALESCE($11, payment_terms_limit),
           balance_risk_limit = COALESCE($12, balance_risk_limit),
           updated_at = NOW()
       WHERE id = $13
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
        balance_risk_limit,
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}