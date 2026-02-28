import mysql from 'mysql2/promise';
import { createHash } from 'crypto';

const hashPassword = (password) => createHash('sha256').update(password).digest('hex');

async function seedAdmin() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const adminPassword = hashPassword('admin');
  
  try {
    await connection.execute(
      `INSERT INTO adminLocal (username, passwordHash, name, email, active) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash)`,
      ['admin', adminPassword, 'Administrador', 'admin@vigilancia.local', true]
    );
    console.log('✓ Admin user created/updated: admin / admin');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await connection.end();
  }
}

seedAdmin();
