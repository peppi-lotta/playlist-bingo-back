const pgp = require('pg-promise')();

async function query(query, values) {
  /*     const db = pgp({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
      }); */

  const db = pgp({
    connectionString: process.env.POSTGRES_URL + '?sslmode=require',
  });

  try {
    console.log('Querying database')
    const results = await db.query(query, values || []);
    return results;
  } catch (error) {
    console.log(error.message);
  } finally {
    db.$pool.end(); // Close the database connection when done
  }
}

module.exports = { query };
