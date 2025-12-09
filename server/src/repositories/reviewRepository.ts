import pool from '../config/database.js';

interface ReviewFilters {
  limit: number;
  offset: number;
  search?: string;
  status?: 'all' | 'hidden' | 'visible';
  hasResponse?: 'all' | 'yes' | 'no';
  rating?: number;
}

interface Review {
  review_id: number;
  order_id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_by: number | null;
  hidden_at: Date | null;
  // Joined fields
  username: string;
  user_email: string;
  product_name: string;
  store_name: string;
  images: { image_id: number; image_url: string }[];
  seller_response: {
    response_id: number;
    response_text: string;
    created_at: Date;
  } | null;
  admin_response: {
    response_id: number;
    response_text: string;
    created_at: Date;
  } | null;
}

const reviewRepository = {
  /**
   * Find all reviews with filters and pagination
   */
  async findAll(filters: ReviewFilters): Promise<{ reviews: Review[]; total: number }> {
    const { limit, offset, search = '', status = 'all', hasResponse = 'all', rating } = filters;

    let whereConditions = ['r.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereConditions.push(`(
        u.name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        p.product_name ILIKE $${paramIndex} OR 
        r.comment ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter (hidden/visible)
    if (status === 'hidden') {
      whereConditions.push('r.is_hidden = TRUE');
    } else if (status === 'visible') {
      whereConditions.push('r.is_hidden = FALSE');
    }

    // Has response filter
    if (hasResponse === 'yes') {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM review_responses rr 
        WHERE rr.review_id = r.review_id AND rr.deleted_at IS NULL
      )`);
    } else if (hasResponse === 'no') {
      whereConditions.push(`NOT EXISTS (
        SELECT 1 FROM review_responses rr 
        WHERE rr.review_id = r.review_id AND rr.deleted_at IS NULL
      )`);
    }

    // Rating filter
    if (rating && rating >= 1 && rating <= 5) {
      whereConditions.push(`r.rating = $${paramIndex}`);
      params.push(rating);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN products p ON r.product_id = p.product_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get reviews with details
    const query = `
      SELECT 
        r.review_id,
        r.order_id,
        r.user_id,
        r.product_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        r.is_hidden,
        r.hidden_reason,
        r.hidden_by,
        r.hidden_at,
        u.name as username,
        u.email as user_email,
        p.product_name,
        s.store_name,
        COALESCE(
          (SELECT json_agg(json_build_object('image_id', ri.image_id, 'image_url', ri.image_url))
           FROM review_images ri WHERE ri.review_id = r.review_id),
          '[]'
        ) as images,
        (SELECT json_build_object(
          'response_id', rr.response_id,
          'response_text', rr.response_text,
          'created_at', rr.created_at
        ) FROM review_responses rr 
        WHERE rr.review_id = r.review_id 
          AND rr.responder_role = 'SELLER' 
          AND rr.deleted_at IS NULL
        LIMIT 1) as seller_response,
        (SELECT json_build_object(
          'response_id', rr.response_id,
          'response_text', rr.response_text,
          'created_at', rr.created_at
        ) FROM review_responses rr 
        WHERE rr.review_id = r.review_id 
          AND rr.responder_role = 'ADMIN' 
          AND rr.deleted_at IS NULL
        LIMIT 1) as admin_response
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN products p ON r.product_id = p.product_id
      JOIN stores s ON p.store_id = s.store_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const reviewsResult = await pool.query(query, [...params, limit, offset]);

    return {
      reviews: reviewsResult.rows,
      total
    };
  },

  /**
   * Find a single review by ID with all details
   */
  async findById(reviewId: number): Promise<Review | null> {
    const query = `
      SELECT 
        r.review_id,
        r.order_id,
        r.user_id,
        r.product_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        r.is_hidden,
        r.hidden_reason,
        r.hidden_by,
        r.hidden_at,
        u.name as username,
        u.email as user_email,
        p.product_name,
        s.store_name,
        COALESCE(
          (SELECT json_agg(json_build_object('image_id', ri.image_id, 'image_url', ri.image_url))
           FROM review_images ri WHERE ri.review_id = r.review_id),
          '[]'
        ) as images,
        (SELECT json_build_object(
          'response_id', rr.response_id,
          'response_text', rr.response_text,
          'created_at', rr.created_at
        ) FROM review_responses rr 
        WHERE rr.review_id = r.review_id 
          AND rr.responder_role = 'SELLER' 
          AND rr.deleted_at IS NULL
        LIMIT 1) as seller_response,
        (SELECT json_build_object(
          'response_id', rr.response_id,
          'response_text', rr.response_text,
          'created_at', rr.created_at
        ) FROM review_responses rr 
        WHERE rr.review_id = r.review_id 
          AND rr.responder_role = 'ADMIN' 
          AND rr.deleted_at IS NULL
        LIMIT 1) as admin_response
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN products p ON r.product_id = p.product_id
      JOIN stores s ON p.store_id = s.store_id
      WHERE r.review_id = $1 AND r.deleted_at IS NULL
    `;

    const result = await pool.query(query, [reviewId]);
    return result.rows[0] || null;
  },

  /**
   * Hide a review
   */
  async hideReview(reviewId: number, adminId: number, reason: string): Promise<boolean> {
    const query = `
      UPDATE reviews 
      SET is_hidden = TRUE, 
          hidden_reason = $2, 
          hidden_by = $3, 
          hidden_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE review_id = $1 AND deleted_at IS NULL
      RETURNING review_id
    `;
    const result = await pool.query(query, [reviewId, reason, adminId]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Unhide a review
   */
  async unhideReview(reviewId: number): Promise<boolean> {
    const query = `
      UPDATE reviews 
      SET is_hidden = FALSE, 
          hidden_reason = NULL, 
          hidden_by = NULL, 
          hidden_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE review_id = $1 AND deleted_at IS NULL
      RETURNING review_id
    `;
    const result = await pool.query(query, [reviewId]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Add admin response to a review
   */
  async addAdminResponse(reviewId: number, adminId: number, responseText: string): Promise<number | null> {
    const query = `
      INSERT INTO review_responses (review_id, responder_id, responder_role, response_text)
      VALUES ($1, $2, 'ADMIN', $3)
      ON CONFLICT (review_id, responder_role) 
      DO UPDATE SET response_text = $3, updated_at = CURRENT_TIMESTAMP, deleted_at = NULL
      RETURNING response_id
    `;
    const result = await pool.query(query, [reviewId, adminId, responseText]);
    return result.rows[0]?.response_id || null;
  },

  /**
   * Update admin response
   */
  async updateAdminResponse(responseId: number, adminId: number, responseText: string): Promise<boolean> {
    const query = `
      UPDATE review_responses 
      SET response_text = $2, updated_at = CURRENT_TIMESTAMP
      WHERE response_id = $1 AND responder_id = $3 AND responder_role = 'ADMIN' AND deleted_at IS NULL
      RETURNING response_id
    `;
    const result = await pool.query(query, [responseId, responseText, adminId]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Delete admin response
   */
  async deleteAdminResponse(responseId: number, adminId: number): Promise<boolean> {
    const query = `
      UPDATE review_responses 
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE response_id = $1 AND responder_role = 'ADMIN' AND deleted_at IS NULL
      RETURNING response_id
    `;
    const result = await pool.query(query, [responseId]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Get review statistics
   */
  async getStats(): Promise<{
    totalReviews: number;
    hiddenReviews: number;
    avgRating: number;
    reviewsWithResponses: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE is_hidden = TRUE) as hidden_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM review_responses rr 
          WHERE rr.review_id = reviews.review_id AND rr.deleted_at IS NULL
        )) as reviews_with_responses
      FROM reviews
      WHERE deleted_at IS NULL
    `;
    const result = await pool.query(query);
    const row = result.rows[0];
    
    return {
      totalReviews: parseInt(row.total_reviews, 10),
      hiddenReviews: parseInt(row.hidden_reviews, 10),
      avgRating: parseFloat(row.avg_rating) || 0,
      reviewsWithResponses: parseInt(row.reviews_with_responses, 10)
    };
  }
};

export default reviewRepository;
