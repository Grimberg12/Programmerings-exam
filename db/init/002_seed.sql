INSERT INTO users (name, email)
VALUES ('Test User', 'test@example.com')
ON CONFLICT (email) DO NOTHING;
