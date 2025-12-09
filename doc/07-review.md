# Rencana Implementasi Review & Rating System

## 📊 Analisis Database

Berdasarkan `init.sql`, sudah ada tabel `reviews`:
```sql
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    user_id INTEGER REFERENCES users(user_id),
    product_id INTEGER REFERENCES products(product_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Perlu ditambahkan:**
- `review_images` table untuk foto review
- `review_responses` table untuk reply seller/admin
- `is_hidden` field untuk moderasi admin
- `hidden_reason` field untuk alasan hide

---

## 📁 List File yang Harus Diubah/Dibuat

### Database
| File | Aksi | Deskripsi |
|------|------|-----------|
| init.sql | **MODIFY** | Tambah tabel `review_images`, `review_responses`, field `is_hidden`, `hidden_reason` di `reviews` |

### Backend PHP - Models
| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/app/models/Review.php` | **CREATE** | Model untuk CRUD review |
| `src/app/models/ReviewImage.php` | **CREATE** | Model untuk review images |
| `src/app/models/ReviewResponse.php` | **CREATE** | Model untuk seller/admin responses |

### Backend PHP - Controllers
| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/app/controllers/ReviewController.php` | **CREATE** | Handle create, read, update review |
| ProductController.php | **MODIFY** | Tambah average rating & review count di product detail |
| `src/app/controllers/OrderController.php` | **MODIFY** | Cek eligibility untuk review (status = received) |

### Backend PHP - Views
| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/app/views/pages/products/detail.php` | **MODIFY** | Tampilkan rating summary, reviews list dengan pagination |
| `src/app/views/pages/orders/detail.php` | **MODIFY** | Tambah tombol "Write Review" jika eligible |
| `src/app/views/pages/reviews/create.php` | **CREATE** | Form untuk submit review (rating, text, photos) |
| `src/app/views/pages/reviews/edit.php` | **CREATE** | Form untuk edit review |
| `src/app/views/components/review-card.php` | **CREATE** | Component untuk menampilkan single review |
| `src/app/views/components/rating-stars.php` | **CREATE** | Component untuk star rating display/input |
| `src/app/views/components/review-form.php` | **CREATE** | Component form review reusable |

### Backend PHP - Routes
| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/routes/web.php` | **MODIFY** | Tambah routes untuk review CRUD |

### Backend Node.js - Admin API
| File | Aksi | Deskripsi |
|------|------|-----------|
| `server/src/controllers/reviewController.ts` | **CREATE** | Handle moderasi review (hide, respond) |
| `server/src/repositories/reviewRepository.ts` | **CREATE** | Database queries untuk review |
| adminRoutes.ts | **MODIFY** | Tambah routes moderasi review |

### Frontend React - Admin Dashboard
| File | Aksi | Deskripsi |
|------|------|-----------|
| `client/src/views/pages/admin/Reviews.tsx` | **CREATE** | Halaman moderasi reviews |
| `client/src/views/components/ReviewModeration.tsx` | **CREATE** | Component untuk hide/respond review |

### Assets CSS
| File | Aksi | Deskripsi |
|------|------|-----------|
| `public/css/pages/review.css` | **CREATE** | Styling untuk review pages |
| `public/css/components/review-card.css` | **CREATE** | Styling untuk review card |
| `public/css/components/rating-stars.css` | **CREATE** | Styling untuk star rating |

### Assets JS
| File | Aksi | Deskripsi |
|------|------|-----------|
| `public/js/pages/review-form.js` | **CREATE** | Handle star rating input, image upload preview, form validation |
| `public/js/components/image-upload.js` | **MODIFY** | Support multiple images (max 3) |

---

## ✨ List Fitur yang Ditambahkan

### 1. Buyer Features
| Fitur | Deskripsi |
|-------|-----------|
| **Submit Review** | Buyer dapat submit review setelah order status = "received" |
| **Star Rating Input** | Interactive 1-5 star rating dengan hover effect |
| **Text Review** | Input text review dengan character counter (max 500) |
| **Photo Upload** | Upload max 3 foto dengan preview, drag & drop support |
| **Edit Review** | Buyer dapat edit review yang sudah dibuat |
| **Delete Review** | Buyer dapat hapus review sendiri |

### 2. Product Detail Features
| Fitur | Deskripsi |
|-------|-----------|
| **Rating Summary** | Tampilkan average rating (1-5) dan total review count |
| **Rating Distribution** | Bar chart distribusi rating (5★: 50%, 4★: 30%, dll) |
| **Reviews List** | List reviews dengan pagination (10 per page) |
| **Review Sorting** | Sort by: newest, oldest, highest rating, lowest rating |
| **Review Filtering** | Filter by: rating (1-5 stars), with photos only |
| **Photo Gallery** | Lightbox untuk view review photos |

### 3. Seller Features
| Fitur | Deskripsi |
|-------|-----------|
| **View Reviews** | Seller dapat melihat semua reviews untuk produk mereka |
| **Reply to Review** | Seller dapat reply ke review (1 reply per review) |
| **Edit Reply** | Seller dapat edit reply yang sudah dibuat |
| **Delete Reply** | Seller dapat hapus reply sendiri |

### 4. Admin Features
| Fitur | Deskripsi |
|-------|-----------|
| **Review List** | Tampilkan semua reviews dengan filter & search |
| **Hide Review** | Admin dapat hide inappropriate review dengan reason |
| **Unhide Review** | Admin dapat unhide review yang sudah di-hide |
| **Admin Response** | Admin dapat memberikan official response ke review |
| **Review Analytics** | Dashboard stats: total reviews, average rating, flagged reviews |

### 5. UI/UX Features
| Fitur | Deskripsi |
|-------|-----------|
| **Star Animation** | Smooth animation saat hover/select stars |
| **Image Preview** | Preview images sebelum upload |
| **Character Counter** | Real-time character count untuk text review |
| **Loading States** | Skeleton loading untuk reviews |
| **Empty States** | Tampilan ketika belum ada reviews |
| **Toast Notifications** | Feedback saat submit/edit/delete review |

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      BUYER FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  Order Received → Write Review Button → Review Form         │
│                                            ↓                │
│                                   Submit Review             │
│                                            ↓                │
│                                   Review Saved              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PRODUCT DETAIL                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────────────────────────┐  │
│  │ Rating       │  │ Reviews List                        │  │
│  │ ★★★★☆ 4.2   │  │ ┌─────────────────────────────────┐ │  │
│  │ 156 reviews  │  │ │ User A - ★★★★★                 │ │  │
│  │              │  │ │ Great product! [img] [img]     │ │  │
│  │ 5★ ████ 50% │  │ │ └─ Seller: Thank you!          │ │  │
│  │ 4★ ██░ 30%  │  │ └─────────────────────────────────┘ │  │
│  │ 3★ █░░ 10%  │  │ ┌─────────────────────────────────┐ │  │
│  │ 2★ ░░░  5%  │  │ │ User B - ★★★☆☆                 │ │  │
│  │ 1★ ░░░  5%  │  │ │ Okay product...                │ │  │
│  └──────────────┘  │ └─────────────────────────────────┘ │  │
│                    │        [Load More Reviews]          │  │
│                    └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      ADMIN FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  Review Dashboard → View Review → [Hide] / [Respond]        │
│                                            ↓                │
│                              Enter Reason / Response        │
│                                            ↓                │
│                                   Action Saved              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Database Schema Changes

```sql
-- Tambahan di init.sql

-- Modifikasi tabel reviews
ALTER TABLE reviews ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN hidden_reason TEXT;
ALTER TABLE reviews ADD COLUMN hidden_by INTEGER REFERENCES users(user_id);
ALTER TABLE reviews ADD COLUMN hidden_at TIMESTAMP;

-- Tabel baru: review_images
CREATE TABLE review_images (
    image_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel baru: review_responses
CREATE TABLE review_responses (
    response_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    response_type VARCHAR(20) CHECK (response_type IN ('seller', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, response_type) -- 1 seller reply, 1 admin reply per review
);

-- Index untuk performa
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_is_hidden ON reviews(is_hidden);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);
```

---

## 🎯 Priority Implementation Order

1. **Phase 1 - Core Review** (Database + Model + Basic CRUD)
2. **Phase 2 - Product Integration** (Rating summary + Reviews list)
3. **Phase 3 - Seller Response** (Reply functionality)
4. **Phase 4 - Admin Moderation** (Hide/respond in dashboard)
5. **Phase 5 - Polish** (Animations, optimizations)