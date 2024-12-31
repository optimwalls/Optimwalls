DO $$ BEGIN
    -- Add email verification fields to users table
    ALTER TABLE IF EXISTS "users"
    ADD COLUMN IF NOT EXISTS "is_email_verified" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;

    -- Create email verification tokens table
    CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users" ("id"),
        "token" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now()
    );

    -- Create password reset tokens table
    CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users" ("id"),
        "token" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS "email_verification_tokens_user_id_idx" ON "email_verification_tokens" ("user_id");
    CREATE INDEX IF NOT EXISTS "email_verification_tokens_token_idx" ON "email_verification_tokens" ("token");
    CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");
    CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens" ("token");
END $$;
