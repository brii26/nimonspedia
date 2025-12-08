-- Nimonspedia Database Initialization
-- This file will be automatically executed when the PostgreSQL container starts

-- Database is already created by POSTGRES_DB environment variable
-- Connect to the nimonspedia database

CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    balance NUMERIC(1000,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    store_name VARCHAR(100) NOT NULL UNIQUE,
    store_description TEXT,
    store_logo_path VARCHAR(500),
    balance NUMERIC(1000,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price > 0),
    stock BIGINT NOT NULL CHECK (stock >= 0),
    main_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

-- many-to-many relationship
CREATE TABLE category_items (
    category_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    PRIMARY KEY (category_id, product_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE(buyer_id, product_id) -- One cart item per product per buyer
);

CREATE TYPE order_status AS ENUM (
    'waiting_approval', 
    'approved', 
    'rejected', 
    'on_delivery', 
    'received'
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    total_price BIGINT NOT NULL CHECK (total_price > 0),
    shipping_address TEXT NOT NULL,
    status order_status DEFAULT 'waiting_approval',
    reject_reason TEXT NULL,
    confirmed_at TIMESTAMP NULL,
    delivery_time TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    price_at_order BIGINT NOT NULL CHECK (price_at_order > 0),
    subtotal BIGINT NOT NULL CHECK (subtotal > 0),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

INSERT INTO categories (name) VALUES 
    ('Electronics'),
    ('Fashion'),
    ('Food & Beverages'),
    ('Books'),
    ('Sports & Outdoor'),
    ('Health & Beauty'),
    ('Home & Garden'),
    ('Toys & Games'),
    ('Automotive'),
    ('Others');

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_name ON stores(store_name);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_cart_items_buyer_id ON cart_items(buyer_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION update_store_balance_on_order_received()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status = 'received' AND OLD.status != 'received') THEN
        UPDATE stores
        SET balance = balance + NEW.total_price
        WHERE store_id = NEW.store_id;
            
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_orders_received_update_balance
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_store_balance_on_order_received();

ALTER TABLE products ADD COLUMN search_vector tsvector;
ALTER TABLE products ADD COLUMN manual_keywords TEXT;

CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        to_tsvector('simple', COALESCE(NEW.product_name, '')) ||
        to_tsvector('simple', COALESCE(NEW.description, '')) ||
        to_tsvector('simple', COALESCE(NEW.manual_keywords, ''));
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_update_product_search
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();


-- ==========================================
-- MILESTONE 2 ADDITIONS
-- ==========================================

-- Enums
CREATE TYPE auction_status AS ENUM ('scheduled', 'active', 'ended', 'cancelled');
CREATE TYPE message_type AS ENUM ('text', 'image', 'item_preview');
CREATE TYPE feature_name AS ENUM ('checkout_enabled', 'chat_enabled', 'auction_enabled');

CREATE TABLE auctions (
    auction_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    starting_price BIGINT NOT NULL CHECK (starting_price >= 0),
    current_price BIGINT NOT NULL CHECK (current_price >= 0),
    min_increment BIGINT NOT NULL CHECK (min_increment > 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP, -- Nullable, filled when auction ends
    status auction_status DEFAULT 'scheduled',
    winner_id INT, -- Nullable, FK to User (buyer)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE auction_bids (
    bid_id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount BIGINT NOT NULL CHECK (bid_amount > 0),
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE chat_rooms (
    store_id INT NOT NULL,
    buyer_id INT NOT NULL,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, buyer_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    buyer_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type message_type DEFAULT 'text',
    content TEXT,
    product_id INT, -- Nullable, FK to Product (if type = item_preview)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id, buyer_id) REFERENCES chat_rooms(store_id, buyer_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE push_preferences (
    user_id INT PRIMARY KEY,
    chat_enabled BOOLEAN DEFAULT TRUE,
    auction_enabled BOOLEAN DEFAULT TRUE,
    order_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE user_feature_access (
    access_id SERIAL PRIMARY KEY,
    user_id INT, -- Nullable. If NULL, represents GLOBAL flag
    feature_name feature_name NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    reason TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    user_id INTEGER REFERENCES users(user_id),
    product_id INTEGER REFERENCES products(product_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_hidden BOOLEAN DEFAULT FALSE,
    hidden_reason TEXT,
    hidden_by INTEGER REFERENCES users(user_id).
    hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_images (
    image_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_product_id ON auctions(product_id);
CREATE INDEX idx_auction_bids_auction_id ON auction_bids(auction_id);

CREATE INDEX idx_chat_messages_room ON chat_messages(store_id, buyer_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_is_hidden ON reviews(is_hidden);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);

INSERT INTO user_feature_access (user_id, feature_name, is_enabled, reason) VALUES 
(NULL, 'auction_enabled', TRUE, NULL),
(NULL, 'chat_enabled', TRUE, NULL),
(NULL, 'checkout_enabled', TRUE, NULL);