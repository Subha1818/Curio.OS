import pool from './pool';

const migration = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT        NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    wallpaper_id    VARCHAR(50) DEFAULT 'cosmic-aurora',
    theme_settings  JSONB       DEFAULT '{}'::jsonb,
    bio             TEXT        DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

  CREATE TABLE IF NOT EXISTS notes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL,
    pinned      BOOLEAN     DEFAULT false,
    tags        TEXT[]      DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_pinned  ON notes(pinned);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running Curio.OS database migration...');
    await client.query(migration);
    console.log('✅ Migration complete — users table is ready.');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('📋 Users table columns:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
