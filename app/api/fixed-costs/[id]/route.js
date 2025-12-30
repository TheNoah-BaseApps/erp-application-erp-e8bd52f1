import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * @swagger
 * /api/fixed-costs/{id}:
 *   get:
 *     summary: Get fixed cost by ID
 *     tags: [Fixed Costs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fixed cost details
 *       404:
 *         description: Fixed cost not found
 *       500:
 *         description: Server error
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const result = await query('SELECT * FROM fixed_costs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed cost not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching fixed cost:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/fixed-costs/{id}:
 *   put:
 *     summary: Update fixed cost
 *     tags: [Fixed Costs]
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
 *               cost_name:
 *                 type: string
 *               month:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Fixed cost updated successfully
 *       404:
 *         description: Fixed cost not found
 *       500:
 *         description: Server error
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { cost_name, month, amount } = body;

    const result = await query(
      `UPDATE fixed_costs 
       SET cost_name = COALESCE($1, cost_name),
           month = COALESCE($2, month),
           amount = COALESCE($3, amount),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [cost_name, month, amount, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed cost not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating fixed cost:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/fixed-costs/{id}:
 *   delete:
 *     summary: Delete fixed cost
 *     tags: [Fixed Costs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fixed cost deleted successfully
 *       404:
 *         description: Fixed cost not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const result = await query('DELETE FROM fixed_costs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed cost not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting fixed cost:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}