import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * @swagger
 * /api/product-costs/{id}:
 *   get:
 *     summary: Get a specific product cost entry
 *     description: Retrieve details of a single product cost record by ID
 *     tags: [Product Costs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product cost entry ID
 *     responses:
 *       200:
 *         description: Product cost details retrieved successfully
 *       404:
 *         description: Product cost not found
 *       500:
 *         description: Server error
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await query(
      `SELECT pc.*, p.name as product_name, p.sku 
       FROM product_costs pc
       LEFT JOIN products p ON pc.product_id = p.id
       WHERE pc.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching product cost:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/product-costs/{id}:
 *   put:
 *     summary: Update a product cost entry
 *     description: Update an existing product cost record
 *     tags: [Product Costs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product cost entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               month:
 *                 type: string
 *               unit_cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product cost updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Product cost not found
 *       500:
 *         description: Server error
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { product_id, month, unit_cost } = body;

    // Validate month format if provided
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid month format. Use YYYY-MM format' 
        }, { status: 400 });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (product_id !== undefined) {
      paramCount++;
      updates.push(`product_id = $${paramCount}`);
      values.push(product_id);
    }

    if (month !== undefined) {
      paramCount++;
      updates.push(`month = $${paramCount}`);
      values.push(month);
    }

    if (unit_cost !== undefined) {
      paramCount++;
      updates.push(`unit_cost = $${paramCount}`);
      values.push(parseFloat(unit_cost));
    }

    if (updates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No fields to update' 
      }, { status: 400 });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const queryText = `
      UPDATE product_costs 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating product cost:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/product-costs/{id}:
 *   delete:
 *     summary: Delete a product cost entry
 *     description: Remove a product cost record from the system
 *     tags: [Product Costs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product cost entry ID
 *     responses:
 *       200:
 *         description: Product cost deleted successfully
 *       404:
 *         description: Product cost not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const result = await query(
      'DELETE FROM product_costs WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product cost deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product cost:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}