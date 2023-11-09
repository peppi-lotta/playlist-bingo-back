const { query } = require('./db');

class Bingo {
    static table = 'bingos';

    code;
    game_code;
    bingo_tracks;
    name_tag;

    constructor(params) {
        if (params) {
            this.code = params.code;
            this.game_code = params.game_code;
            this.bingo_tracks = params.bingo_tracks;
        }
    }

    static async get(code) {
        const sqlQuery = `SELECT * FROM ${Bingo.table} WHERE code = $1`;
        const values = [code];
        const [result] = await query(sqlQuery, values);

        if (result) {
            return new Bingo(result); // Return a Bingo instance
        } else {
            return null; // Return null if no matching record is found
        }
    }

    async create() {
        const insertQuery = `INSERT INTO ${Bingo.table} (code, game_code, bingo_tracks) VALUES ($1, $2, $3) RETURNING *`;
        const values = [this.code, this.game_code, JSON.stringify(this.bingo_tracks)];

        const [newBingo] = await query(insertQuery, values);
        
        return new Bingo(newBingo); // Return a new instance
    }

    async update() {
        if (!this.code) {
            throw new Error("Cannot update without a code");
        }

        const updateQuery = `UPDATE ${Bingo.table} SET game_code = $2, bingo_tracks = $3 WHERE code = $1 RETURNING *`;

        const values = [this.code, this.game_code, JSON.stringify(this.bingo_tracks)];
        const [updatedBingo] = await query(updateQuery, values);
        return new Bingo(updatedBingo); // Return a new instance
    }
}

module.exports = Bingo;
