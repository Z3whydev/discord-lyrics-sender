# Coral's Discord Lyrics Sender

A Tampermonkey userscript that sends lyrics line-by-line into a Discord channel. It remembers sent songs to avoid repeats and includes a simple GUI for easy use.

## Features

- Preloaded list of 40 popular songs (artist + title)
- Fetches lyrics from [lyrics.ovh](https://lyrics.ovh/)
- Sends lyrics line-by-line with a configurable interval
- Remembers sent songs using localStorage
- GUI with song select, send, and reset buttons
- Works on Discord Web (you must have the target channel open)

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Download the [`coral-discord-lyrics-sender.user.js`](coral-discord-lyrics-sender.user.js) file from this repo.
3. Open the Tampermonkey dashboard and click **Add a new script**.
4. Paste the content of the `.user.js` file or import it directly.
5. Save and enable the script.
6. Open Discord Web, navigate to your target channel, and use the GUI at the bottom right to send lyrics.

## Configuration

- Change the `TARGET_CHANNEL_ID` constant inside the script to your Discord channel ID.
- Adjust the `LINE_SEND_INTERVAL_MS` constant to control delay between lines.

## License

MIT License
