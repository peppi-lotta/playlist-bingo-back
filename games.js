const { query } = require('./db');
const Bingo = require('./bingos');
const { hasCommonValues } = require('./helper');

class Game {
    static table = 'games';

    code;
    tracks_url;
    tracks_count;
    recommendations_url;
    game_tracks;
    win1;
    win2;
    win3;
    win4;

    constructor(params) {
        if (params) {
            this.code = params.code;
            this.tracks_url = params.tracks_url;
            this.tracks_count = params.tracks_count;
            this.recommendations_url = params.recommendations_url;
            this.game_tracks = params.game_tracks;
            this.win1 = params.win1;
            this.win2 = params.win2;
            this.win3 = params.win3;
            this.win4 = params.win4;
        }
    }

    static async get(code) {
        const sqlQuery = `SELECT * FROM ${Game.table} WHERE code = $1`;
        const values = [code];
        const [result] = await query(sqlQuery, values);

        if (result) {
            return new Game(result); // Return a Game instance
        } else {
            return null; // Return null if no matching record is found
        }
    }

    async create() {
        const insertQuery = `INSERT INTO ${Game.table} (code, tracks_url, tracks_count, recommendations_url, game_tracks) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const values = [this.code, this.tracks_url, this.tracks_count, this.recommendations_url, JSON.stringify(this.game_tracks)];
        const [newGame] = await query(insertQuery, values);
        return new Game(newGame); // Return a new instance
    }

    async update() {
        if (!this.code) {
            throw new Error("Cannot update without a code");
        }

        const updateQuery = `UPDATE ${Game.table} SET tracks_url = $2, tracks_count = $3, recommendations_url = $4,  game_tracks = $5 WHERE code = $1 RETURNING *`;

        const values = [this.code, this.tracks_url, this.tracks_count, this.recommendations_url, JSON.stringify(this.game_tracks)];
        const [updatedGame] = await query(updateQuery, values);
        return new Game(updatedGame); // Return a new instance
    }

    async checkForBingo(bingoCode, currentTrack, win) {
        const bingo = await Bingo.get(bingoCode)
        const bingo_artist_ids = bingo.bingo_tracks.map((obj) => obj.artist_id);
        const played_game_tracks = this.game_tracks.slice(0, parseInt(currentTrack) + 1)
        const played_tracks_artist_ids = played_game_tracks.map((obj) => obj.artist_id);
        let isWin = false;

        switch (parseInt(win)) {
            case 1:
                isWin = await hasCommonValues(bingo_artist_ids, played_tracks_artist_ids, 5);
                break;
            case 2:
            case 3:
                let full_rows = 0;
                for (let i = 0; i < 3; i++) {
                    const start = i * 5;
                    const end = start + 4;

                    if (await hasCommonValues(bingo_artist_ids.slice(start, end + 1), played_tracks_artist_ids, 5)) {
                        full_rows++;
                    }
                }
                isWin = full_rows >= (parseInt(win) === 3 ? 2 : 1);
                break;
            case 4:
                isWin = await hasCommonValues(bingo_artist_ids, played_tracks_artist_ids, 15);
                break;
            default:
                console.log('No case was found')
                break;
        }
        if (isWin) {
            bingo.addWin(parseInt(win));
        }
        return isWin;
    }

}

module.exports = Game;
