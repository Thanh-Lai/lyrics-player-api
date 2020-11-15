const axios = require('axios');

module.exports = async function(queryObject) {
    const songInfo = {};
    const promisesGenius = [];
    const { query, type } = queryObject;
    const uriEncodeInput = encodeURI(query);
    const geniusAPI = 'https://genius.com/api';
    const songOrLyric = type === 'lyrics' ? 'search/lyrics' : 'search/';
    const geniusData = await axios.get(`${geniusAPI}/${songOrLyric}?q=${uriEncodeInput}&per_page=20`);
    const geniusResult = type === 'lyrics'
    ? geniusData.data.response.sections[0].hits
    : geniusData.data.response.hits;
        geniusResult.forEach(async (hit) => {
            const songID = hit.result.id;
            const lyricsSnippet = type === 'lyrics' ? hit.highlights[0].value : null;
            const isMatch = type === 'lyrics'
                ? lyricsSnippet.toLowerCase().includes(query.toLowerCase())
                : hit.result.title.toLowerCase().includes(query.toLowerCase());
            const songApiPath = hit.result.api_path;
            // Future task: compare value with snippet and display songs with 80% match
            // Match words like fallin' vs fallin vs falling, & vs and
            // For now, match is based on exact match
            if (!isMatch) return;
            songInfo[songID] = songInfo[songID] || {};
            songInfo[songID]['type'] = hit.index;
            songInfo[songID]['snippet'] = lyricsSnippet;
            promisesGenius.push(axios.get(`${geniusAPI}${songApiPath}`));
        });
        const allMatchedSongs = await Promise.all(promisesGenius);

        allMatchedSongs.forEach(async (matchedSong) => {
            const currSong = matchedSong.data.response.song;
            if (currSong.apple_music_id === null) return;
            const currSongID = currSong.id;
            const title = currSong.title;
            const album = currSong.album;
            const artist = album ? album.artist.name : '';
            const spotifySearch = `${title} ${artist}`;
            const uriEncodeSong = encodeURI(spotifySearch);
            // console.log('spotsong', currSong.title, artist);
            songInfo[currSongID] = songInfo[currSongID] || {};
            songInfo[currSongID]['id'] = currSongID;
            songInfo[currSongID]['title'] = title;
            songInfo[currSongID]['artist'] = artist || null;
            songInfo[currSongID]['album'] = album ? album.name : null;
            songInfo[currSongID]['releaseDate'] = currSong.release_date;
            songInfo[currSongID]['image'] = currSong.header_image_thumbnail_url;
            songInfo[currSongID]['lyricsURL'] = currSong.share_url;
            songInfo[currSongID]['spotifyAPI'] = uriEncodeSong;
            // promisesSpotify.push(axios.get(`${spotifyAPI}/v1/search?q=${uriEncodeSong}&type=track`), {
            //     headers: {
            //         Authorization: `Basic ${new Buffer(SPOTIFY_AUTH_TOKEN).toString('base64')}`
            //     }
            // });
        });
        // console.log(songInfo)
    return songInfo;
}

    // async handleSubmit(event) {
    //     event.preventDefault();
    //     const songInfo = {};
    //     const promisesGenius = [];
    //     const promisesSpotify = [];
    //     const { value } = event.target.inputValue;
    //     const uriEncodeInput = encodeURI(value);
    //     const cors = 'https://cors-anywhere.herokuapp.com';
    //     const geniusAPI = 'https://genius.com/api';
    //     const spotifyAPI = 'https://api.spotify.com';
    //     const songOrLyric = 'song';
    //     const type = songOrLyric === 'lyrics' ? 'search/lyrics' : 'search/';
    //     const geniusData = await axios.get(`${cors}/${geniusAPI}/${type}?q=${uriEncodeInput}&per_page=20`);
    //     const geniusResult = songOrLyric === 'lyrics'
    //         ? geniusData.data.response.sections[0].hits
    //         : geniusData.data.response.hits;

    //     geniusResult.forEach(async (hit) => {
    //         const songID = hit.result.id;
    //         const lyricsSnippet = songOrLyric === 'lyrics' ? hit.highlights[0].value : null;
    //         const isMatch = songOrLyric === 'lyrics'
    //             ? lyricsSnippet.toLowerCase().includes(value.toLowerCase())
    //             : hit.result.title.toLowerCase().includes(value.toLowerCase());
    //         const songApiPath = hit.result.api_path;
    //         // Future task: compare value with snippet and display songs with 80% match
    //         // Match words like fallin' vs fallin vs falling, & vs and
    //         // For now, match is based on exact match
    //         if (!isMatch) return;
    //         songInfo[songID] = songInfo[songID] || {};
    //         songInfo[songID]['type'] = hit.index;
    //         songInfo[songID]['snippet'] = lyricsSnippet;
    //         promisesGenius.push(axios.get(`${cors}/${geniusAPI}${songApiPath}`));
    //     });
    //     const allMatchedSongs = await Promise.all(promisesGenius);

    //     allMatchedSongs.forEach(async (matchedSong) => {
    //         const currSong = matchedSong.data.response.song;
    //         if (currSong.apple_music_id === null) return;
    //         const currSongID = currSong.id;
    //         const title = currSong.title;
    //         const album = currSong.album;
    //         const artist = album ? album.artist.name : '';
    //         const spotifySearch = `${title} ${artist}`;
    //         const uriEncodeSong = encodeURI(spotifySearch);
    //         // console.log('spotsong', currSong.title, artist);
    //         songInfo[currSongID] = songInfo[currSongID] || {};
    //         songInfo[currSongID]['id'] = currSongID;
    //         songInfo[currSongID]['title'] = title;
    //         songInfo[currSongID]['artist'] = artist || null;
    //         songInfo[currSongID]['album'] = album ? album.name : null;
    //         songInfo[currSongID]['releaseDate'] = currSong.release_date;
    //         songInfo[currSongID]['image'] = currSong.header_image_thumbnail_url;
    //         songInfo[currSongID]['lyricsURL'] = currSong.share_url;
    //         songInfo[currSongID]['spotifyAPI'] = uriEncodeSong;
    //         promisesSpotify.push(axios.get(`${cors}/${spotifyAPI}/v1/search?q=${uriEncodeSong}&type=track`), {
    //             headers: {
    //                 Authorization: `Basic ${new Buffer(SPOTIFY_AUTH_TOKEN).toString('base64')}`
    //             }
    //         });
    //     });
    //     const allSpotifySongs = await Promise.all(promisesSpotify);

    //     console.log(value, allSpotifySongs);
    // }