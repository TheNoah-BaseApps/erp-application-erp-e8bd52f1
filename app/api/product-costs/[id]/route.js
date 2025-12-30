import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';

/**
 * Verify authentication token from Authorization header
 */
async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return { authenticated: false, user: null, error: 'No token provided' };
    }

    // Query user by session token
    const result = await query(
      `SELECT u.id, u.email, u.role, s.expires_at 
       FROM users u
       INNER JOIN sessions s ON u.id = s.user_id
       WHERE s.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return { authenticated: false, user: null, error: 'Invalid token' };
    }

    const user = result.rows[0];

    // Check if session has expired
    if (new Date(user.expires_at) < new Date()) {
      return { authenticated: false, user: null, error: 'Session expired' };
    }

    return { authenticated: true, user, error: null };
  } catch (error) {
    console.error('Authentication verification error:', error);
    return { authenticated: false, user: null, error: 'Authentication verification failed' };
  }
}

/**
 * @swagger
 * /api/product-costs/{id}:
 *   get:
 *     summary: Get a specific product cost entry
 *     description: Retrieve details of a single product cost record by ID
 *     tags: [Product Costs]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       404:
 *         description: Product cost not found
 *       500:
 *         description: Server error
 */
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    
    if (!auth.authenticated) {
      console.error('Authentication failed for GET /api/product-costs/[id]:', auth.error);
      return NextResponse.json({ 
        success: false, 
        error: auth.error || 'Unauthorized' 
      }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      console.error('GET /api/product-costs/[id]: Missing id parameter');
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost ID is required' 
      }, { status: 400 });
    }

    let result;
    try {
      result = await query(
        `SELECT pc.*, p.name as product_name, p.sku 
         FROM product_costs pc
         LEFT JOIN products p ON pc.product_id = p.id
         WHERE pc.id = $1`,
        [id]
      );
    } catch (dbError) {
      console.error('Database error in GET /api/product-costs/[id]:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database query failed' 
      }, { status: 500 });
    }

    if (result.rows.length === 0) {
      console.warn(`Product cost not found with id: ${id}`);
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
    console.error('Unexpected error in GET /api/product-costs/[id]:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/product-costs/{id}:
 *   put:
 *     summary: Update a product cost entry
 *     description: Update an existing product cost record (Admin only)
 *     tags: [Product Costs]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product cost not found
 *       500:
 *         description: Server error
 */
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    
    if (!auth.authenticated) {
      console.error('Authentication failed for PUT /api/product-costs/[id]:', auth.error);
      return NextResponse.json({ 
        success: false, 
        error: auth.error || 'Unauthorized' 
      }, { status: 401 });
    }

    // Verify admin role
    if (auth.user.role !== 'admin') {
      console.warn(`Non-admin user ${auth.user.email} attempted to update product cost`);
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { id } = params;

    if (!id) {
      console.error('PUT /api/product-costs/[id]: Missing id parameter');
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost ID is required' 
      }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error in PUT /api/product-costs/[id]:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { product_id, month, unit_cost } = body;

    // Validate month format if provided
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        console.error(`Invalid month format provided: ${month}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid month format. Use YYYY-MM format' 
        }, { status: 400 });
      }
    }

    // Validate unit_cost if provided
    if (unit_cost !== undefined) {
      const costValue = parseFloat(unit_cost);
      if (isNaN(costValue) || costValue < 0) {
        console.error(`Invalid unit_cost value: ${unit_cost}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Unit cost must be a non-negative number' 
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
      console.error('PUT /api/product-costs/[id]: No fields to update');
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

    let result;
    try {
      result = await query(queryText, values);
    } catch (dbError) {
      console.error('Database error in PUT /api/product-costs/[id]:', dbError);
      
      // Check for specific database errors
      if (dbError.code === '23503') {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid product_id reference' 
        }, { status: 400 });
      }
      
      if (dbError.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          error: 'Duplicate entry - product cost for this month already exists' 
        }, { status: 409 });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Database update failed' 
      }, { status: 500 });
    }

    if (result.rows.length === 0) {
      console.warn(`Product cost not found for update with id: ${id}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost not found' 
      }, { status: 404 });
    }

    console.log(`Product cost ${id} updated successfully by ${auth.user.email}`);
    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/product-costs/[id]:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/product-costs/{id}:
 *   delete:
 *     summary: Delete a product cost entry
 *     description: Remove a product cost record from the system (Admin only)
 *     tags: [Product Costs]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product cost not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    
    if (!auth.authenticated) {
      console.error('Authentication failed for DELETE /api/product-costs/[id]:', auth.error);
      return NextResponse.json({ 
        success: false, 
        error: auth.error || 'Unauthorized' 
      }, { status: 401 });
    }

    // Verify admin role
    if (auth.user.role !== 'admin') {
      console.warn(`Non-admin user ${auth.user.email} attempted to delete product cost`);
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { id } = params;

    if (!id) {
      console.error('DELETE /api/product-costs/[id]: Missing id parameter');
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost ID is required' 
      }, { status: 400 });
    }

    let result;
    try {
      result = await query(
        'DELETE FROM product_costs WHERE id = $1 RETURNING *',
        [id]
      );
    } catch (dbError) {
      console.error('Database error in DELETE /api/product-costs/[id]:', dbError);
      
      // Check for foreign key constraint violations
      if (dbError.code === '23503') {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot delete - product cost is referenced by other records' 
        }, { status: 409 });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Database deletion failed' 
      }, { status: 500 });
    }

    if (result.rows.length === 0) {
      console.warn(`Product cost not found for deletion with id: ${id}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Product cost not found' 
      }, { status: 404 });
    }

    console.log(`Product cost ${id} deleted successfully by ${auth.user.email}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Product cost deleted successfully' 
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/product-costs/[id]:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}