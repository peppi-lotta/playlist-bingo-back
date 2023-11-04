const { query } = require('./db');

async function createGamesTable(req, res) {
    try {
        await query(`CREATE TABLE games (
            code serial PRIMARY KEY,
            tracks_url varchar(255),
            tracks_count integer,
            recommendations_url varchar(255),
            game_tracks json
        )`, null);
        res.status(200).json({ message: 'Games table created' });
    } catch (error) {
        console.log(error.message);
    }
}

async function createBingosTable(req, res) {
    try {
        await query(`
            CREATE TABLE bingos (
                code varchar(255) PRIMARY KEY,
                game_code integer REFERENCES games (code) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
                bingo_tracks json
            );
        `, null);
        res.status(200).json({ message: 'Bingos table created' });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { query, createGamesTable, createBingosTable };
