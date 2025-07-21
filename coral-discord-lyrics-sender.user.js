// ==UserScript==
// @name         Coral's Discord Lyrics Sender with GUI
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sends lyrics line-by-line in a Discord channel, remembers sent songs, GUI controls, fetches lyrics online
// @author       coral
// @match        https://discord.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ---------------- CONFIG ----------------
    const TARGET_CHANNEL_ID = '1335024293997842565'; // Change this to your target Discord channel ID
    const LINE_SEND_INTERVAL_MS = 15000; // 15 seconds between each line sent

    // List of 40 popular songs (artist + title)
    const SONG_LIST = [
        { artist: "The Weeknd", title: "Blinding Lights" },
        { artist: "Dua Lipa", title: "Levitating" },
        { artist: "Ed Sheeran", title: "Shape of You" },
        { artist: "Billie Eilish", title: "Bad Guy" },
        { artist: "Imagine Dragons", title: "Believer" },
        { artist: "Bruno Mars", title: "24K Magic" },
        { artist: "Post Malone", title: "Circles" },
        { artist: "Taylor Swift", title: "Shake It Off" },
        { artist: "Maroon 5", title: "Sugar" },
        { artist: "Lady Gaga", title: "Poker Face" },
        { artist: "Adele", title: "Hello" },
        { artist: "Kanye West", title: "Stronger" },
        { artist: "Shawn Mendes", title: "Stitches" },
        { artist: "Selena Gomez", title: "Lose You To Love Me" },
        { artist: "Rihanna", title: "Diamonds" },
        { artist: "Drake", title: "God's Plan" },
        { artist: "Kendrick Lamar", title: "HUMBLE." },
        { artist: "Ariana Grande", title: "7 rings" },
        { artist: "Sia", title: "Chandelier" },
        { artist: "Coldplay", title: "Paradise" },
        { artist: "Justin Bieber", title: "Sorry" },
        { artist: "Lizzo", title: "Truth Hurts" },
        { artist: "Demi Lovato", title: "Sorry Not Sorry" },
        { artist: "The Chainsmokers", title: "Closer" },
        { artist: "Post Malone", title: "Rockstar" },
        { artist: "Camila Cabello", title: "Havana" },
        { artist: "Imagine Dragons", title: "Thunder" },
        { artist: "Miley Cyrus", title: "Wrecking Ball" },
        { artist: "SZA", title: "Good Days" },
        { artist: "Beyoncé", title: "Halo" },
        { artist: "Nicki Minaj", title: "Super Bass" },
        { artist: "Cardi B", title: "Bodak Yellow" },
        { artist: "Khalid", title: "Talk" },
        { artist: "Post Malone", title: "Sunflower" },
        { artist: "Travis Scott", title: "SICKO MODE" },
        { artist: "Lady Gaga", title: "Bad Romance" },
        { artist: "Shakira", title: "Hips Don't Lie" },
        { artist: "Justin Timberlake", title: "Can't Stop the Feeling!" }
    ];

    // ----------------------------------------

    let sentSongs = new Set(JSON.parse(localStorage.getItem('coralSentSongs') || "[]"));
    let sending = false;
    let currentLines = [];
    let currentLineIndex = 0;

    // Utility delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Create GUI container
    const gui = document.createElement('div');
    gui.style.position = 'fixed';
    gui.style.bottom = '20px';
    gui.style.right = '20px';
    gui.style.width = '300px';
    gui.style.background = '#2f3136';
    gui.style.color = 'white';
    gui.style.borderRadius = '8px';
    gui.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    gui.style.padding = '10px';
    gui.style.zIndex = 999999;
    gui.style.fontFamily = 'Arial, sans-serif';
    gui.style.userSelect = 'none';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Coral Reef Lyrics Sender';
    title.style.margin = '5px 0 10px 0';
    title.style.fontSize = '18px';
    gui.appendChild(title);

    // Song selector label
    const label = document.createElement('label');
    label.textContent = 'Select Song:';
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    gui.appendChild(label);

    // Song select dropdown
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.padding = '5px';
    select.style.marginBottom = '10px';
    gui.appendChild(select);

    function populateSelect() {
        select.innerHTML = '';

        const availableSongs = SONG_LIST.filter(s => !sentSongs.has(songKey(s)));

        if (availableSongs.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = 'No songs available. Reset needed.';
            opt.disabled = true;
            select.appendChild(opt);
            select.disabled = true;
            sendButton.disabled = true;
        } else {
            availableSongs.forEach(s => {
                const opt = document.createElement('option');
                opt.value = songKey(s);
                opt.textContent = `${s.artist} - ${s.title}`;
                select.appendChild(opt);
            });
            select.disabled = false;
            sendButton.disabled = false;
        }
    }

    // Send button
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send Lyrics';
    sendButton.style.width = '100%';
    sendButton.style.padding = '8px';
    sendButton.style.marginBottom = '8px';
    sendButton.style.background = '#5865f2';
    sendButton.style.color = 'white';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '5px';
    sendButton.style.cursor = 'pointer';

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Sent Songs';
    resetButton.style.width = '100%';
    resetButton.style.padding = '8px';
    resetButton.style.background = '#f04747';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.cursor = 'pointer';

    gui.appendChild(sendButton);
    gui.appendChild(resetButton);
    document.body.appendChild(gui);

    // Helpers
    function songKey(song) {
        return `${song.artist.toLowerCase()}___${song.title.toLowerCase()}`;
    }

    async function fetchLyrics(artist, title) {
        // Using lyrics.ovh API
        try {
            const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
            if (!res.ok) throw new Error('Lyrics not found');
            const data = await res.json();
            if (!data.lyrics) throw new Error('No lyrics');
            return data.lyrics;
        } catch (e) {
            return null;
        }
    }

    async function sendMessage(text) {
        // Find message box for target channel and send text
        // The script runs on Discord web, we can only send message to the currently open channel
        // So user must have the target channel open for this to work
        const textarea = document.querySelector('div[role="textbox"][contenteditable="true"]');
        if (!textarea) {
            alert('Message box not found! Make sure you have the target channel open.');
            throw new Error('No textarea');
        }

        // Paste text into textarea
        textarea.focus();

        // Clear any existing text
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);

        document.execCommand('insertText', false, text);

        // Send Enter key event
        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            which: 13,
            keyCode: 13,
        });

        textarea.dispatchEvent(enterEvent);
    }

    async function sendLyricsLineByLine(lines) {
        sending = true;
        currentLines = lines;
        currentLineIndex = 0;

        while (currentLineIndex < currentLines.length) {
            const line = currentLines[currentLineIndex].trim();
            if(line.length > 0) {
                try {
                    await sendMessage(line);
                } catch {
                    alert('Failed to send message. Make sure the target channel is open and you have permission.');
                    break;
                }
            }
            currentLineIndex++;
            await delay(LINE_SEND_INTERVAL_MS);
        }

        sending = false;
        alert('Finished sending lyrics!');
    }

    // Send button handler
    sendButton.onclick = async () => {
        if (sending) {
            alert('Already sending lyrics, please wait.');
            return;
        }
        if(select.disabled) {
            alert('No available songs to send. Reset to continue.');
            return;
        }

        const val = select.value;
        const [artist, title] = val.split('___').map(s => s.trim());

        // Find full song info from list
        const song = SONG_LIST.find(s => songKey(s) === val);
        if(!song) {
            alert('Selected song not found!');
            return;
        }

        sendButton.disabled = true;
        resetButton.disabled = true;
        select.disabled = true;

        // Fetch lyrics
        const lyricsRaw = await fetchLyrics(song.artist, song.title);
        if(!lyricsRaw) {
            alert('Could not fetch lyrics for this song.');
            sendButton.disabled = false;
            resetButton.disabled = false;
            select.disabled = false;
            return;
        }

        // Split lines and filter empty lines
        const lines = lyricsRaw.split('\n').filter(l => l.trim().length > 0);

        if(lines.length === 0) {
            alert('Lyrics are empty!');
            sendButton.disabled = false;
            resetButton.disabled = false;
            select.disabled = false;
            return;
        }

        // Confirm user has target channel open
        const channelNameEl = document.querySelector('[aria-label="Channel name"]') || document.querySelector('[data-list-item-id^="channels___"] [aria-selected="true"]');
        if(channelNameEl) {
            alert(`Make sure you have the target channel open:\nID: ${TARGET_CHANNEL_ID}\nPress OK to start sending lyrics.`);
        } else {
            alert('Cannot confirm the open channel. Make sure you have the target channel open before sending lyrics.');
        }

        // Send lyrics line by line with interval
        await sendLyricsLineByLine(lines);

        // Mark song as sent
        sentSongs.add(val);
        localStorage.setItem('coralSentSongs', JSON.stringify([...sentSongs]));

        populateSelect();

        sendButton.disabled = false;
        resetButton.disabled = false;
        select.disabled = false;
    };

    // Reset button handler
    resetButton.onclick = () => {
        if(sending) {
            alert('Cannot reset while sending lyrics.');
            return;
        }
        if(confirm('Are you sure you want to reset the sent songs list? This will make all songs available again.')) {
            sentSongs.clear();
            localStorage.setItem('coralSentSongs', JSON.stringify([...sentSongs]));
            populateSelect();
        }
    };

    // Populate dropdown on load
    populateSelect();

    // Inform user if not on target channel
    function checkChannel() {
        // We can't reliably get channel ID from Discord DOM
        // Just warn user to have correct channel open
        const warningId = 'coral-lyrics-channel-warning';
        let warning = document.getElementById(warningId);
        if(!warning) {
            warning = document.createElement('div');
            warning.id = warningId;
            warning.style.position = 'fixed';
            warning.style.top = '10px';
            warning.style.right = '10px';
            warning.style.background = '#f04747';
            warning.style.color = 'white';
            warning.style.padding = '8px 12px';
            warning.style.borderRadius = '6px';
            warning.style.zIndex = '9999999';
            warning.style.fontWeight = 'bold';
            warning.style.fontFamily = 'Arial, sans-serif';
            warning.textContent = 'Make sure you have the target Discord channel open to send lyrics!';
            document.body.appendChild(warning);
        }
    }

    checkChannel();

})();
