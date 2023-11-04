function generateRandomCode(length, numeric = false) {
    let charset = "abcdefghijkmnpqrstuvwxyz123456789";
    if (numeric) {
        charset = "1234567890"
    }
    let result = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }

    return result;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formGameTracks(game_tracks, playlist_tracks, tracks_count, count) {
    const unique_index = [];

    while (game_tracks.length < count && unique_index.length < tracks_count) {
        let index = getRandomInt(0, (tracks_count - 1));

        if (unique_index.includes(index)) {
            continue
        }
        unique_index.push(index);

        let temp_track = playlist_tracks[index].track
        if (typeof temp_track === "undefined") {
            temp_track = playlist_tracks[index]
        }

        if (game_tracks.some(e => e.artist_id === temp_track.artists[0].id)) {
            continue
        }

        if (!temp_track.preview_url) {
            continue
        }

        const trackObject = {
            artist_id: temp_track.artists[0].id,
            track_id: temp_track.id,
            artist_name: temp_track.artists[0].name,
            track_name: temp_track.name,
            track_preview_url: temp_track.preview_url
        };

        game_tracks.push(trackObject);
    }

    return game_tracks;
}

function formBingoTracks(game_tracks, bingo_tracks_count, game_tracks_count) {
    let bingo_tracks = [];
    const unique_index = [];

    while (bingo_tracks.length < bingo_tracks_count) {
        let index = getRandomInt(0, (game_tracks_count - 1));
        if (unique_index.includes(index)) {
            continue
        }
        unique_index.push(index);
        bingo_tracks.push(game_tracks[index]);
    }
    return bingo_tracks;
}

async function hasCommonValues(arr1, arr2, count) {
  const set1 = new Set(arr1);
  let commonCount = 0;

  for (const value of arr2) {
    if (set1.has(value)) {
      commonCount++;
    }
  }
  if (commonCount >= count) {
    return true;
  }
  return false;
}


module.exports = { generateRandomCode, formGameTracks, formBingoTracks, hasCommonValues };