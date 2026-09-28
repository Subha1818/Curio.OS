import pool from './pool';

const migration = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- Ensure users table has is_admin column
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

  -- Create letters table
  CREATE TABLE IF NOT EXISTS letters (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     VARCHAR(280) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_letters_user_id    ON letters(user_id);

  -- Create letter_likes table
  CREATE TABLE IF NOT EXISTS letter_likes (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    letter_id   INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, letter_id)
  );

  CREATE INDEX IF NOT EXISTS idx_letter_likes_letter_id ON letter_likes(letter_id);
  CREATE INDEX IF NOT EXISTS idx_letter_likes_user_id   ON letter_likes(user_id);

  -- Set Subbu's account as admin if present
  UPDATE users 
  SET is_admin = true 
  WHERE LOWER(username) IN ('subbu', 'subha1818', 'subhajit') 
     OR LOWER(email) LIKE '%subhajitpatra%';

  -- Drop legacy notes table as per requirement
  DROP TABLE IF EXISTS notes CASCADE;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running LetterBox database migration...');
    await client.query(migration);
    console.log('✅ Migration complete — letters and letter_likes tables ready, notes dropped.');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Public tables:', res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
