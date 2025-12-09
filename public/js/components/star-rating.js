/**
 * Star Rating Component
 * Interactive star rating input with hover effects
 */

class StarRating {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Star rating container not found:', containerSelector);
            return;
        }

        this.options = {
            maxRating: options.maxRating || 5,
            initialRating: options.initialRating || 0,
            readonly: options.readonly || false,
            onChange: options.onChange || null,
            ratingTexts: options.ratingTexts || {
                1: 'Poor',
                2: 'Fair',
                3: 'Good',
                4: 'Very Good',
                5: 'Excellent'
            }
        };

        this.currentRating = this.options.initialRating;
        this.hoverRating = 0;

        this.init();
    }

    init() {
        this.stars = this.container.querySelectorAll('.star');
        if (this.stars.length === 0) {
            console.error('No star elements found in container');
            return;
        }

        this.setupEventListeners();
        this.updateStars(this.currentRating);
    }

    setupEventListeners() {
        if (this.options.readonly) return;

        this.stars.forEach((star) => {
            star.addEventListener('mouseenter', () => this.handleHover(star));
            star.addEventListener('click', () => this.handleClick(star));
        });

        this.container.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    handleHover(star) {
        const value = parseInt(star.dataset.value);
        this.hoverRating = value;
        this.updateStars(value);
        this.updateRatingText(value);
    }

    handleClick(star) {
        const value = parseInt(star.dataset.value);
        this.currentRating = value;
        this.updateStars(value);
        this.updateRatingText(value);

        // Update hidden input if exists
        const hiddenInput = document.getElementById('rating-input');
        if (hiddenInput) {
            hiddenInput.value = value;
        }

        // Call onChange callback
        if (this.options.onChange) {
            this.options.onChange(value);
        }

        // Clear any error
        const errorEl = document.getElementById('rating-error');
        if (errorEl) {
            errorEl.textContent = '';
        }
    }

    handleMouseLeave() {
        this.hoverRating = 0;
        this.updateStars(this.currentRating);
        this.updateRatingText(this.currentRating);
    }

    updateStars(rating) {
        this.stars.forEach((star) => {
            const value = parseInt(star.dataset.value);
            if (value <= rating) {
                star.classList.add('active');
                star.classList.remove('hover');
            } else {
                star.classList.remove('active');
                if (value <= this.hoverRating) {
                    star.classList.add('hover');
                } else {
                    star.classList.remove('hover');
                }
            }
        });
    }

    updateRatingText(rating) {
        const ratingTextEl = document.getElementById('rating-text');
        if (!ratingTextEl) return;

        if (rating > 0) {
            ratingTextEl.textContent = this.options.ratingTexts[rating] || '';
        } else {
            ratingTextEl.textContent = '';
        }
    }

    setRating(rating) {
        if (rating < 0 || rating > this.options.maxRating) {
            console.error('Invalid rating value');
            return;
        }

        this.currentRating = rating;
        this.updateStars(rating);
        this.updateRatingText(rating);

        const hiddenInput = document.getElementById('rating-input');
        if (hiddenInput) {
            hiddenInput.value = rating;
        }
    }

    getRating() {
        return this.currentRating;
    }

    reset() {
        this.setRating(0);
    }

    setReadonly(readonly) {
        this.options.readonly = readonly;
        if (readonly) {
            this.stars.forEach(star => {
                star.style.cursor = 'default';
            });
        } else {
            this.stars.forEach(star => {
                star.style.cursor = 'pointer';
            });
        }
    }
}

// Display-only star rating (for showing existing ratings)
class StarRatingDisplay {
    constructor(containerSelector, rating, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Star rating display container not found');
            return;
        }

        this.rating = parseFloat(rating) || 0;
        this.options = {
            showNumber: options.showNumber !== false,
            size: options.size || 'medium', // small, medium, large
            color: options.color || '#fbbf24'
        };

        this.render();
    }

    render() {
        const sizeClasses = {
            small: 'text-sm',
            medium: 'text-base',
            large: 'text-lg'
        };

        const fullStars = Math.floor(this.rating);
        const hasHalfStar = this.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '<div class="star-rating-display ' + sizeClasses[this.options.size] + '">';
        html += '<div class="stars">';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            html += '<span class="star filled">★</span>';
        }

        // Half star
        if (hasHalfStar) {
            html += '<span class="star half">★</span>';
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            html += '<span class="star empty">★</span>';
        }

        html += '</div>';

        // Show numeric rating
        if (this.options.showNumber) {
            html += '<span class="rating-number">' + this.rating.toFixed(1) + '</span>';
        }

        html += '</div>';

        this.container.innerHTML = html;

        // Apply custom color
        const stars = this.container.querySelectorAll('.star.filled, .star.half');
        stars.forEach(star => {
            star.style.color = this.options.color;
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StarRating, StarRatingDisplay };
}
