const pgp = require('pg-promise')();

async function query(query, values) {

  const db = pgp({
    connectionString: process.env.POSTGRES_URL + '?sslmode=require',
  });

  try {
    const results = await db.query(query, values || []);
    return results;
  } catch (error) {
    console.log(error.message);
  } finally {
    db.$pool.end(); // Close the database connection when done
  }
}

module.exports = { query };
