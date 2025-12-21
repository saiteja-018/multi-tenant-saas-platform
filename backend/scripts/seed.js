const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');

async function generatePasswordHashes() {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const demoHash = await bcrypt.hash('Demo@123', 10);
  const userHash = await bcrypt.hash('User@123', 10);
  
  return { adminHash, demoHash, userHash };
}

async function runSeed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Check if data already exists
    const checkResult = await pool.query('SELECT COUNT(*) FROM tenants');
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('✓ Database already seeded (found existing tenants)\n');
      process.exit(0);
    }

    // Generate real password hashes
    console.log('  Generating password hashes...');
    const { adminHash, demoHash, userHash } = await generatePasswordHashes();

    // Read seed file
    const seedPath = path.join(__dirname, '../seeds/seed_data.sql');
    let seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Replace placeholder hashes with real bcrypt hashes
    seedSQL = seedSQL.replace(/\$2b\$10\$rN8YGHjKx0QdO7QXzBvQb\.F5qLZ5X8nYZ5xGKj5Z5Z5Z5Z5Z5Z5Z5/g, adminHash);
    seedSQL = seedSQL.replace(/\$2b\$10\$7Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5\.Y5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5/g, demoHash);
    seedSQL = seedSQL.replace(/\$2b\$10\$5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5\.X5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5/g, userHash);

    console.log('  Executing seed data...');
    await pool.query(seedSQL);
    
    console.log('✓ Database seeded successfully\n');
    console.log('📝 Test Credentials:');
    console.log('  Super Admin: superadmin@system.com / Admin@123');
    console.log('  Demo Admin:  admin@demo.com / Demo@123');
    console.log('  Demo User 1: user1@demo.com / User@123');
    console.log('  Demo User 2: user2@demo.com / User@123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run seed
runSeed().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
