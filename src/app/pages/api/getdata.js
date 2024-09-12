// getdata.js

import pool from "@/lib/db";

export default async function handler(req, res) {
    try {
        const result = await pool.query('SELECT * FROM user');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);  // Corrected error logging
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
