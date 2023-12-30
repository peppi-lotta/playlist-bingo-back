const { query } = require('./db');

class Bingo {
    static table = 'bingos';

    code;
    game_code;
    bingo_tracks;
    name_tag;
    win1;
    win2;
    win3;
    win4;

    constructor(params) {
        if (params) {
            this.code = params.code;
            this.game_code = params.game_code;
            this.bingo_tracks = params.bingo_tracks;
            this.name_tag = params.name_tag;
            this.win1 = params.win1;
            this.win2 = params.win2;
            this.win3 = params.win3;
            this.win4 = params.win4;
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
        const insertQuery = `INSERT INTO ${Bingo.table} (code, game_code, name_tag, bingo_tracks) VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [this.code, this.game_code, this.name_tag, JSON.stringify(this.bingo_tracks)];

        const [newBingo] = await query(insertQuery, values);

        return new Bingo(newBingo); // Return a new instance
    }

    async update() {
        if (!this.code) {
            throw new Error("Cannot update without a code");
        }

        const updateQuery = `UPDATE ${Bingo.table} SET game_code = $2, name_tag = $3, bingo_tracks = $4 WHERE code = $1 RETURNING *`;

        const values = [this.code, this.game_code, this.name_tag, JSON.stringify(this.bingo_tracks)];
        const [updatedBingo] = await query(updateQuery, values);
        return new Bingo(updatedBingo); // Return a new instance
    }

    async addWin(count) {
        if (!this.code) {
            throw new Error("Cannot update without a code");
        }

        const updateQuery = `UPDATE ${Bingo.table} SET win${count} = $2 WHERE code = $1 RETURNING *`;

        const values = [this.code, true];
        const [updatedBingo] = await query(updateQuery, values);
        return new Bingo(updatedBingo); // Return a new instance
    }

    static async getStats(start, end) {

        const selectQuery = `
            SELECT
            name_tag,
            SUM(
                CASE WHEN win1 THEN 10 ELSE 0 END +
                CASE WHEN win2 THEN 20 ELSE 0 END +
                CASE WHEN win3 THEN 30 ELSE 0 END +
                CASE WHEN win4 THEN 40 ELSE 0 END
            ) as total_points
            FROM ${Bingo.table}
            WHERE name_tag IS NOT NULL AND name_tag <> '' AND name_tag <> ' ' AND added BETWEEN $1 AND $2
            GROUP BY name_tag
            ORDER BY total_points DESC`;

        const values = [start, end];
        const selectSums = await query(selectQuery, values);
        return selectSums;
    }
}

module.exports = Bingo;
