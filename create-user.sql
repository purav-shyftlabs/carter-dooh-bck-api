CREATE TABLE account (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    logo_url TEXT,
    timezone_name VARCHAR,
    currency VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE account_setting (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    approve_change_request BOOLEAN DEFAULT false,
    approve_wallet_request BOOLEAN DEFAULT false,
    auto_approval_field JSON
);

CREATE TABLE brand (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    type VARCHAR,
    status VARCHAR,
    publisher_share_perc DOUBLE PRECISION CHECK (publisher_share_perc >= 0 AND publisher_share_perc <= 100),
    metadata JSONB,
    allow_all_products BOOLEAN DEFAULT false,
    parent_company_id BIGINT,
    custom_id VARCHAR UNIQUE
);

CREATE TABLE content (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    description TEXT,
    image_url TEXT,
    metadata JSONB,
    status VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE "user" (
    id BIGSERIAL PRIMARY KEY,
    current_account_id BIGINT NOT NULL REFERENCES account(id),
    name VARCHAR,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    encrypted_password VARCHAR,
    email VARCHAR NOT NULL UNIQUE,
    auth0_id VARCHAR,
    authentik_id VARCHAR,
    auth_tokens JSON,
    api_key VARCHAR
);

CREATE TABLE user_account (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_type VARCHAR,
    user_type VARCHAR,
    timezone_name VARCHAR,
    active BOOLEAN DEFAULT true,
    enable_two_factor_authentication BOOLEAN DEFAULT false,
    is_first_time_login BOOLEAN DEFAULT true,
    last_login_timestamp TIMESTAMP,
    first_login_timestamp TIMESTAMP,
    use_custom_branding BOOLEAN DEFAULT false,
    allow_all_brands BOOLEAN DEFAULT false,
    accepted_terms_and_conditions BOOLEAN DEFAULT false,
    last_read_release_notes_version VARCHAR,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);

CREATE TABLE user_account_brand (
    brand_id BIGINT NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
    user_brand_access_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    PRIMARY KEY (brand_id, user_brand_access_id)
);

CREATE TABLE user_permission (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_level VARCHAR NOT NULL,
    permission_type VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

INSERT INTO account (name, slug, logo_url, timezone_name, currency)
VALUES ('carter', 'carter-slug', 'https://example.com/logo.png', 'UTC', 'USD');

INSERT INTO "user" ( current_account_id, name, first_name, last_name, encrypted_password, email, auth0_id, authentik_id, auth_tokens, api_key ) 
VALUES ( 1, 'Carter-Admin', 'Carter', 'Admin', '$2b$12$c2A7Id59BZZWgcQ6XPNQIezKvvutx/mKYL/09W7QQDuoCusdq8wQ.', 'carter@shyftlabs.io', NULL, NULL, '{}'::json, NULL );

INSERT INTO user_account (
    account_id,
    user_id,
    role_type,
    user_type,
    timezone_name,
    active,
    enable_two_factor_authentication,
    is_first_time_login,
    use_custom_branding,
    allow_all_brands,
    accepted_terms_and_conditions,
    created_at,
    updated_at
) VALUES (
    1,
    1,
    'ADMIN',
    'PUBLISHER',
    'UTC',
    true,
    false,
    false,
    false,
    true,
    false,
    now(),
    now()
);

INSERT INTO user_permission ( account_id, user_id, access_level, permission_type, created_at, updated_at ) 
VALUES (1, 1, 'FULL_ACCESS', 'USER_MANAGEMENT', now(), now()), (1, 1, 'FULL_ACCESS', 'ACCOUNT_SETTINGS', now(), now());