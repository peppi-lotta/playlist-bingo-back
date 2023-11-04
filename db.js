const pgp = require('pg-promise')();

async function query(query, values) {
    const db = pgp({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
    });

    try {
        const results = await db.query(query, values || []);
        return results;
    } catch (error) {
        return { error };
    } finally {
        db.$pool.end(); // Close the database connection when done
    }
}

module.exports = { query };
