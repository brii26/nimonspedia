import { FastifyRequest, FastifyReply } from 'fastify';
import reviewRepository from '../repositories/reviewRepository.js';

interface AdminUser {
  user_id: number;
  role: string;
  name: string;
}

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'all' | 'hidden' | 'visible';
  hasResponse?: 'all' | 'yes' | 'no';
  rating?: string;
}

interface ReviewIdParams {
  review_id: string;
}

interface HideReviewBody {
  reason: string;
}

interface AdminResponseBody {
  response_text: string;
}

interface UpdateResponseBody {
  response_id: number;
  response_text: string;
}

interface DeleteResponseBody {
  response_id: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AdminUser;
  }
}

/**
 * Get all reviews with filters and pagination
 * GET /admin/reviews
 */
export const getReviews = async (
  request: FastifyRequest<{ Querystring: QueryParams }>,
  reply: FastifyReply
) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search = '', 
      status = 'all',
      hasResponse = 'all',
      rating 
    } = request.query;

    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 10;
    const offset = (pageInt - 1) * limitInt;
    const ratingInt = rating ? parseInt(rating, 10) : undefined;

    const result = await reviewRepository.findAll({
      limit: limitInt,
      offset,
      search,
      status,
      hasResponse,
      rating: ratingInt
    });

    return reply.send({
      success: true,
      data: result.reviews,
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil(result.total / limitInt),
        total_items: result.total,
        items_per_page: limitInt
      }
    });
  } catch (error) {
    request.log.error({ error }, 'Get Reviews Error');
    return reply.status(500).send({ success: false, message: 'Failed to fetch reviews' });
  }
};

/**
 * Get review statistics
 * GET /admin/reviews/stats
 */
export const getReviewStats = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const stats = await reviewRepository.getStats();
    return reply.send({ success: true, data: stats });
  } catch (error) {
    request.log.error({ error }, 'Get Review Stats Error');
    return reply.status(500).send({ success: false, message: 'Failed to fetch review stats' });
  }
};

/**
 * Get single review by ID
 * GET /admin/reviews/:review_id
 */
export const getReviewById = async (
  request: FastifyRequest<{ Params: ReviewIdParams }>,
  reply: FastifyReply
) => {
  try {
    const reviewId = parseInt(request.params.review_id, 10);

    if (isNaN(reviewId)) {
      return reply.status(400).send({ success: false, message: 'Invalid review ID' });
    }

    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      return reply.status(404).send({ success: false, message: 'Review not found' });
    }

    return reply.send({ success: true, data: review });
  } catch (error) {
    request.log.error({ error }, 'Get Review By ID Error');
    return reply.status(500).send({ success: false, message: 'Failed to fetch review' });
  }
};

/**
 * Hide a review
 * POST /admin/reviews/:review_id/hide
 */
export const hideReview = async (
  request: FastifyRequest<{ Params: ReviewIdParams; Body: HideReviewBody }>,
  reply: FastifyReply
) => {
  try {
    const reviewId = parseInt(request.params.review_id, 10);
    const { reason } = request.body;
    const adminId = request.user?.user_id;

    if (isNaN(reviewId)) {
      return reply.status(400).send({ success: false, message: 'Invalid review ID' });
    }

    if (!reason || reason.trim().length === 0) {
      return reply.status(400).send({ success: false, message: 'Reason is required' });
    }

    if (!adminId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const success = await reviewRepository.hideReview(reviewId, adminId, reason.trim());

    if (!success) {
      return reply.status(404).send({ success: false, message: 'Review not found' });
    }

    return reply.send({ success: true, message: 'Review hidden successfully' });
  } catch (error) {
    request.log.error({ error }, 'Hide Review Error');
    return reply.status(500).send({ success: false, message: 'Failed to hide review' });
  }
};

/**
 * Unhide a review
 * POST /admin/reviews/:review_id/unhide
 */
export const unhideReview = async (
  request: FastifyRequest<{ Params: ReviewIdParams }>,
  reply: FastifyReply
) => {
  try {
    const reviewId = parseInt(request.params.review_id, 10);

    if (isNaN(reviewId)) {
      return reply.status(400).send({ success: false, message: 'Invalid review ID' });
    }

    const success = await reviewRepository.unhideReview(reviewId);

    if (!success) {
      return reply.status(404).send({ success: false, message: 'Review not found' });
    }

    return reply.send({ success: true, message: 'Review unhidden successfully' });
  } catch (error) {
    request.log.error({ error }, 'Unhide Review Error');
    return reply.status(500).send({ success: false, message: 'Failed to unhide review' });
  }
};

/**
 * Add admin response to a review
 * POST /admin/reviews/:review_id/respond
 */
export const addAdminResponse = async (
  request: FastifyRequest<{ Params: ReviewIdParams; Body: AdminResponseBody }>,
  reply: FastifyReply
) => {
  try {
    const reviewId = parseInt(request.params.review_id, 10);
    const { response_text } = request.body;
    const adminId = request.user?.user_id;

    if (isNaN(reviewId)) {
      return reply.status(400).send({ success: false, message: 'Invalid review ID' });
    }

    if (!response_text || response_text.trim().length === 0) {
      return reply.status(400).send({ success: false, message: 'Response text is required' });
    }

    if (!adminId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    // Check if review exists
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      return reply.status(404).send({ success: false, message: 'Review not found' });
    }

    const responseId = await reviewRepository.addAdminResponse(reviewId, adminId, response_text.trim());

    if (!responseId) {
      return reply.status(500).send({ success: false, message: 'Failed to add response' });
    }

    return reply.send({ 
      success: true, 
      message: 'Response added successfully',
      data: { response_id: responseId }
    });
  } catch (error) {
    request.log.error({ error }, 'Add Admin Response Error');
    return reply.status(500).send({ success: false, message: 'Failed to add response' });
  }
};

/**
 * Update admin response
 * PUT /admin/reviews/response
 */
export const updateAdminResponse = async (
  request: FastifyRequest<{ Body: UpdateResponseBody }>,
  reply: FastifyReply
) => {
  try {
    const { response_id, response_text } = request.body;
    const adminId = request.user?.user_id;

    if (!response_id || !response_text || response_text.trim().length === 0) {
      return reply.status(400).send({ success: false, message: 'Response ID and text are required' });
    }

    if (!adminId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const success = await reviewRepository.updateAdminResponse(response_id, adminId, response_text.trim());

    if (!success) {
      return reply.status(404).send({ success: false, message: 'Response not found or unauthorized' });
    }

    return reply.send({ success: true, message: 'Response updated successfully' });
  } catch (error) {
    request.log.error({ error }, 'Update Admin Response Error');
    return reply.status(500).send({ success: false, message: 'Failed to update response' });
  }
};

/**
 * Delete admin response
 * DELETE /admin/reviews/response
 */
export const deleteAdminResponse = async (
  request: FastifyRequest<{ Body: DeleteResponseBody }>,
  reply: FastifyReply
) => {
  try {
    const { response_id } = request.body;
    const adminId = request.user?.user_id;

    if (!response_id) {
      return reply.status(400).send({ success: false, message: 'Response ID is required' });
    }

    if (!adminId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const success = await reviewRepository.deleteAdminResponse(response_id, adminId);

    if (!success) {
      return reply.status(404).send({ success: false, message: 'Response not found' });
    }

    return reply.send({ success: true, message: 'Response deleted successfully' });
  } catch (error) {
    request.log.error({ error }, 'Delete Admin Response Error');
    return reply.status(500).send({ success: false, message: 'Failed to delete response' });
  }
};

export default {
  getReviews,
  getReviewStats,
  getReviewById,
  hideReview,
  unhideReview,
  addAdminResponse,
  updateAdminResponse,
  deleteAdminResponse
};
