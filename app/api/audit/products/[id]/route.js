/**
 * @swagger
 * /api/audit/products/{id}:
 *   get:
 *     summary: Get audit history for a product
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit history
 *       401:
 *         description: Unauthorized
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM product_audit_log a
       LEFT JOIN users u ON a.changed_by = u.id
       WHERE a.product_id = $1
       ORDER BY a.timestamp DESC`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}