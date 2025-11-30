const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.static("public"));

async function getUserId(username) {
    const url = `https://api.roblox.com/users/get-by-username?username=${username}`;
    const res = await axios.get(url);
    return res.data.Id || null;
}

async function getRecentGames(userId) {
    const url = `https://games.roblox.com/v2/users/${userId}/games?limit=50`;
    const res = await axios.get(url);
    return res.data.data || [];
}

async function scanServers(placeId, userId) {
    let cursor = "";
    while (cursor !== null) {
        const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100&cursor=${cursor}`;
        const res = await axios.get(url);

        for (const server of res.data.data) {
            if (server.playerIds && server.playerIds.includes(userId)) {
                return server.id;
            }
        }

        cursor = res.data.nextPageCursor;
    }
    return null;
}

app.get("/api/find", async (req, res) => {
    const username = req.query.username;
    if (!username) return res.json({ error: "Missing username" });

    const userId = await getUserId(username);
    if (!userId) return res.json({ found: false, error: "User not found" });

    const games = await getRecentGames(userId);
    if (games.length === 0) return res.json({ found: false, error: "No recent games found" });

    for (const game of games) {
        const placeId = game.placeId;
        const serverId = await scanServers(placeId, userId);

        if (serverId) {
            return res.json({
                found: true,
                gameName: game.name,
                placeId,
                serverId,
                joinLink: `https://www.roblox.com/games/start?placeId=${placeId}&serverId=${serverId}`
            });
        }
    }

    res.json({ found: false });
});

app.listen(3000, () => console.log("Server online on port 3000"));
