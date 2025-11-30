const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.static("public"));

async function getUserId(username) {
    try {
        const res = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
        return res.data.Id;
    } catch {
        return null;
    }
}

async function scanServers(placeId) {
    let cursor = "";
    let servers = [];

    while (cursor !== null) {
        const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100&cursor=${cursor}`;
        const res = await axios.get(url);
        servers = servers.concat(res.data.data);
        cursor = res.data.nextPageCursor;
    }

    return servers;
}

app.get("/api/scanUser", async (req, res) => {
    const username = req.query.username;
    const placeId = req.query.placeId;

    const userId = await getUserId(username);
    if (!userId) return res.json({ found: false });

    const servers = await scanServers(placeId);

    for (const server of servers) {
        if (server.playerIds && server.playerIds.includes(userId))
            return res.json({ found: true, serverId: server.id });
    }

    res.json({ found: false });
});

app.listen(3000, () => console.log("Server running on port 3000"));
