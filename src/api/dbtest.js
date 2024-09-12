// src/api/test-db.js
'use server'
import { query } from '../../lib/db';

export default async (req, res) => {
  if (!res) {
    console.error('Response object is undefined');
    return;
  }

  try {
    const result = await query('SELECT * FROM users');
    if (!result) {
      res.status(404).json({ error: 'No data found' });
      return;
    }
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', message: err.message });
  }
};

