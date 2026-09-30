import pool from './pool';

const migration = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- Drop users table (and any dependent tables due to CASCADE)
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS letter_likes CASCADE;
  DROP TABLE IF EXISTS letters CASCADE;

  -- Create letters table (session-based)
  CREATE TABLE IF NOT EXISTS letters (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    display_name TEXT NOT NULL,
    content     VARCHAR(280) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_letters_session_id ON letters(session_id);

  -- Create letter_likes table (session-based)
  CREATE TABLE IF NOT EXISTS letter_likes (
    session_id  TEXT NOT NULL,
    letter_id   INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (session_id, letter_id)
  );

  CREATE INDEX IF NOT EXISTS idx_letter_likes_letter_id ON letter_likes(letter_id);
  CREATE INDEX IF NOT EXISTS idx_letter_likes_session_id ON letter_likes(session_id);

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
