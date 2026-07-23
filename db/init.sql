CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO posts (title, content)
VALUES (
    'Welcome to your new blog',
    'This is a seed post created automatically when the database first starts up. Feel free to delete it and write your own.'
)
ON CONFLICT DO NOTHING;
