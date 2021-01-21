const axios = require('axios');
const { API_KEY } = require('../secrets');
const levenshteinDistance  = require('./levenshteinDistance');
const ENV = process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://api.lyricsplayer.tk';

module.exports = async function(queryObject) {
    const songInfo = {};
    const promisesGenius = [];
    const promisesSpotify = [];
    const { query, type } = queryObject;
    const uriEncodeInput = encodeURI(query);
    const geniusAPI = 'https://genius.com/api';
    const spotifyAPI = 'https://api.spotify.com';
    const songOrLyric = type === 'lyric' ? 'search/lyrics' : 'search/';
    const spotifyToken = await axios.get(ENV + '/auth/token', {
        headers: {
            Authorization: API_KEY
        }
    });
    const geniusData = await axios.get(`${geniusAPI}/${songOrLyric}?q=${uriEncodeInput}&per_page=20`);
    const geniusResult = type === 'lyric'
        ? geniusData.data.response.sections[0].hits
        : geniusData.data.response.hits;

    geniusResult.forEach(async (hit) => {
        const songID = hit.result.id;
        const lyricSnippet = type === 'lyric' ? hit.highlights[0].value : null;
        const input = query.toLowerCase();
        const snippet = type === 'lyric' ? lyricSnippet.toLowerCase() : hit.result.title.toLowerCase();
        const distance = levenshteinDistance(input, snippet);
        const songApiPath = hit.result.api_path;

        if (distance > 80) return;
        songInfo[songID] = songInfo[songID] || {};
        songInfo[songID]['type'] = hit.index;
        songInfo[songID]['snippet'] = lyricSnippet;
        songInfo[songID]['levenshteinDistance'] = distance;
        promisesGenius.push(axios.get(`${geniusAPI}${songApiPath}`));
    });
    const allMatchedSongs = await Promise.all(promisesGenius);

    allMatchedSongs.forEach(async (matchedSong) => {
        const currSong = matchedSong.data.response.song;
        if (currSong.apple_music_id === null) return;
        const currSongID = currSong.id;
        const title = currSong.title;
        const album = currSong.album;
        const artist = currSong.primary_artist.name ? currSong.primary_artist.name : album.artist.name;
        const spotifySearch = `${title} ${artist}`;
        const uriEncodeSong = encodeURI(spotifySearch);

        promisesSpotify.push(axios.get(`${spotifyAPI}/v1/search?q=${uriEncodeSong}&type=track&limit=1`, {
            params: {
                geniusSongID: currSongID
            },
            headers: {
                Authorization: `Bearer ${spotifyToken.data.access_token}`
            }
        }));
        songInfo[currSongID] = songInfo[currSongID] || {};
        songInfo[currSongID]['id'] = currSongID;
        songInfo[currSongID]['title'] = title;
        songInfo[currSongID]['artist'] = artist || null;
        songInfo[currSongID]['album'] = album ? album.name : null;
        songInfo[currSongID]['releaseDate'] = currSong.release_date;
        songInfo[currSongID]['image'] = currSong.header_image_thumbnail_url;
        songInfo[currSongID]['lyricsURL'] = currSong.share_url;
        songInfo[currSongID]['spotifyQuery'] = spotifySearch;
    });
    const spotifyResults = await Promise.all(promisesSpotify);

    spotifyResults.forEach((spotifySong) => {
        const geniusID = spotifySong.config.params.geniusSongID;
        const spotifySongItem = spotifySong.data.tracks.items[0];
        songInfo[geniusID]['spotifyID'] = spotifySongItem ? spotifySongItem.id : null;
        songInfo[geniusID]['spotifyUri'] = spotifySongItem ? spotifySongItem.uri : null;
        songInfo[geniusID]['spotifyExternalUrl'] = spotifySongItem ? spotifySongItem.external_urls.spotify : null;
        songInfo[geniusID]['duration'] = spotifySongItem ? spotifySongItem.duration_ms : null;
    });

    return songInfo;
}
