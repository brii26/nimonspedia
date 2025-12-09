import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardHeader, CardTitle, CardBody,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Alert, Spinner, Pagination, Toast, SearchInput,
  SelectDropdown, Rating
} from '../../components/ui/index.js';
import type { SelectOption } from '../../components/ui/index.js';

interface ReviewImage {
  image_id: number;
  image_url: string;
}

interface SellerResponse {
  response_id: number;
  response_text: string;
  created_at: string;
}

interface AdminResponse {
  response_id: number;
  response_text: string;
  created_at: string;
}

interface Review {
  review_id: number;
  order_id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_by: number | null;
  hidden_at: string | null;
  username: string;
  user_email: string;
  product_name: string;
  store_name: string;
  images: ReviewImage[];
  seller_response: SellerResponse | null;
  admin_response: AdminResponse | null;
}

interface ReviewStats {
  totalReviews: number;
  hiddenReviews: number;
  avgRating: number;
  reviewsWithResponses: number;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

const statusOptions: SelectOption[] = [
  { value: 'all', label: 'All Reviews' },
  { value: 'visible', label: 'Visible Only' },
  { value: 'hidden', label: 'Hidden Only' }
];

const responseOptions: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Has Response' },
  { value: 'no', label: 'No Response' }
];

const ratingOptions: SelectOption[] = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' }
];

const Reviews: React.FC = () => {
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responseFilter, setResponseFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('');

  // Modals
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);

  // Form state
  const [hideReason, setHideReason] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { 'Authorization': `Bearer ${token}` };
  };

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current_page.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
        hasResponse: responseFilter,
        ...(ratingFilter && { rating: ratingFilter })
      });

      const response = await fetch(`/api/node/admin/reviews?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 403) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setReviews(data.data || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, searchTerm, statusFilter, responseFilter, ratingFilter]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/node/admin/reviews/stats', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [fetchReviews]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, [searchTerm, statusFilter, responseFilter, ratingFilter]);

  // Hide/Unhide review
  const handleHideReview = async () => {
    if (!selectedReview || !hideReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/node/admin/reviews/${selectedReview.review_id}/hide`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: hideReason })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Review hidden successfully', 'success');
        setShowHideModal(false);
        setHideReason('');
        fetchReviews();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to hide review', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnhideReview = async (review: Review) => {
    try {
      const response = await fetch(`/api/node/admin/reviews/${review.review_id}/unhide`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        showToast('Review unhidden successfully', 'success');
        fetchReviews();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to unhide review', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  // Admin response
  const handleSubmitResponse = async () => {
    if (!selectedReview || !adminResponse.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/node/admin/reviews/${selectedReview.review_id}/respond`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response_text: adminResponse })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Response added successfully', 'success');
        setShowRespondModal(false);
        setAdminResponse('');
        fetchReviews();
      } else {
        showToast(data.message || 'Failed to add response', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResponse = async (responseId: number) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      const response = await fetch('/api/node/admin/reviews/response', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response_id: responseId })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Response deleted successfully', 'success');
        fetchReviews();
      } else {
        showToast(data.message || 'Failed to delete response', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  const openDetailModal = (review: Review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const openHideModal = (review: Review) => {
    setSelectedReview(review);
    setHideReason('');
    setShowHideModal(true);
  };

  const openRespondModal = (review: Review) => {
    setSelectedReview(review);
    setAdminResponse(review.admin_response?.response_text || '');
    setShowRespondModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          variant={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
          <p className="text-gray-600">Manage and moderate customer reviews</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.hiddenReviews}</p>
                <p className="text-sm text-gray-600">Hidden Reviews</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.reviewsWithResponses}</p>
                <p className="text-sm text-gray-600">With Responses</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="overflow-visible">
        <CardBody className="overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews..."
            />
            <SelectDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Status"
              variant="fixed"
            />
            <SelectDropdown
              options={responseOptions}
              value={responseFilter}
              onChange={(val) => setResponseFilter(val)}
              placeholder="Response"
              variant="fixed"
            />
            <SelectDropdown
              options={ratingOptions}
              value={ratingFilter}
              onChange={(val) => setRatingFilter(val)}
              placeholder="Rating"
              variant="fixed"
            />
          </div>
        </CardBody>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({pagination.total_items})</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews found
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Review</TableHeader>
                    <TableHeader>Product</TableHeader>
                    <TableHeader>Rating</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.map(review => (
                    <TableRow key={review.review_id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900">{review.username}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {review.comment || '(No comment)'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{review.product_name}</p>
                          <p className="text-sm text-gray-500">{review.store_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {review.is_hidden ? (
                            <Badge variant="danger">Hidden</Badge>
                          ) : (
                            <Badge variant="success">Visible</Badge>
                          )}
                          {review.seller_response && (
                            <Badge variant="info">Seller Reply</Badge>
                          )}
                          {review.admin_response && (
                            <Badge variant="warning">Admin Reply</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openDetailModal(review)}
                          >
                            View
                          </Button>
                          {review.is_hidden ? (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleUnhideReview(review)}
                            >
                              Unhide
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openHideModal(review)}
                            >
                              Hide
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openRespondModal(review)}
                          >
                            {review.admin_response ? 'Edit' : 'Respond'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.total_pages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, current_page: page }))}
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} size="lg">
        <ModalHeader>Review Details</ModalHeader>
        <ModalBody>
          {selectedReview && (
            <div className="space-y-4">
              {/* Review Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reviewer</label>
                  <p className="font-medium">{selectedReview.username}</p>
                  <p className="text-sm text-gray-500">{selectedReview.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Product</label>
                  <p className="font-medium">{selectedReview.product_name}</p>
                  <p className="text-sm text-gray-500">{selectedReview.store_name}</p>
                </div>
              </div>

              {/* Rating & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Rating</label>
                  {renderStars(selectedReview.rating)}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p>{formatDate(selectedReview.created_at)}</p>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium text-gray-500">Comment</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedReview.comment ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedReview.comment }} />
                  ) : (
                    <p className="text-gray-400 italic">No comment</p>
                  )}
                </div>
              </div>

              {/* Images */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Images</label>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {selectedReview.images.map(img => (
                      <img
                        key={img.image_id}
                        src={img.image_url}
                        alt="Review"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Status */}
              {selectedReview.is_hidden && (
                <Alert variant="warning">
                  <strong>Hidden:</strong> {selectedReview.hidden_reason}
                  <br />
                  <span className="text-sm">
                    Hidden at: {selectedReview.hidden_at && formatDate(selectedReview.hidden_at)}
                  </span>
                </Alert>
              )}

              {/* Seller Response */}
              {selectedReview.seller_response && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Seller Response</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div dangerouslySetInnerHTML={{ __html: selectedReview.seller_response.response_text }} />
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(selectedReview.seller_response.created_at)}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedReview.admin_response && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Response</label>
                  <div className="mt-1 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div dangerouslySetInnerHTML={{ __html: selectedReview.admin_response.response_text }} />
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(selectedReview.admin_response.created_at)}
                    </p>
                    <Button
                      size="sm"
                      variant="danger"
                      className="mt-2"
                      onClick={() => handleDeleteResponse(selectedReview.admin_response!.response_id)}
                    >
                      Delete Response
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Hide Modal */}
      <Modal isOpen={showHideModal} onClose={() => setShowHideModal(false)}>
        <ModalHeader>Hide Review</ModalHeader>
        <ModalBody>
          <p className="mb-4 text-gray-600">
            Please provide a reason for hiding this review. The reviewer will not be notified.
          </p>
          <Textarea
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="Reason for hiding (e.g., inappropriate content, spam, etc.)"
            rows={4}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowHideModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleHideReview}
            disabled={isSubmitting || !hideReason.trim()}
          >
            {isSubmitting ? 'Hiding...' : 'Hide Review'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Respond Modal */}
      <Modal isOpen={showRespondModal} onClose={() => setShowRespondModal(false)}>
        <ModalHeader>
          {selectedReview?.admin_response ? 'Edit Response' : 'Add Response'}
        </ModalHeader>
        <ModalBody>
          <p className="mb-4 text-gray-600">
            Add an official admin response to this review.
          </p>
          <Textarea
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder="Your response..."
            rows={6}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowRespondModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitResponse}
            disabled={isSubmitting || !adminResponse.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Reviews;
