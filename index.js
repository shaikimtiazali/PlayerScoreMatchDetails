const express = require('express');
const path = require('path');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const PORT = 4000;

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const init = async () => {
    try {
        database = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}/players/`);
        });
        
    } catch (e) {
        console.log(`DB Error ${e.message}`);
        process.exit(1);        
    }
}

init();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
    return {
        playerId: dbObject.player_id,
        playerName: dbObject.player_name
    }
}

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
    return {
        matchId: dbObject.match_id,
        match: dbObject.match,
        year: dbObject.year
    }
}

// API 1
app.get('/players/', async (req,res) => {
    const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id`;
    const playersArray = await database.all(getPlayersQuery);
    res.send(playersArray.map((eachPlayer) => convertPlayerDbObjectToResponseObject(eachPlayer)));
});

//API 2
app.get('/players/:playerId/', async (req, res) => {
    const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${req.params.playerId};`;
    const playerArray = await database.all(getPlayerQuery);
    res.send(playerArray.map((eachPlayer) => convertPlayerDbObjectToResponseObject(eachPlayer)));
});

//API 3
app.put('/players/:playerId/', async (req, res) => {
    const {playerId} = req.params;
    const {playerName} = req.body;
    const getPlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
    await database.run(getPlayerQuery);
    res.send("Player Details Updated");
});

//API 4
app.get('/matches/:matchId/', async (req, res) => {
    const {matchId} = req.params;
    const getPlayerQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
    const match = await database.get(getPlayerQuery);
    res.send(convertMatchDetailsDbObjectToResponseObject(match));
});

//API 5
app.get('/players/:playerId/matches', async (req,res) => {
    const {playerId} = req.params;
    const getPlayermatchsQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`;
    const playerMatches = await database.all(getPlayermatchsQuery);
    res.send(playerMatches);
});

//API 6
app.get('/matches/:matchId/players', async (req,res) => {
    const {matchId} = req.params;
    const getMatchPlayersQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id = ${matchId};`;
    const playersArray = await database.all(getMatchPlayersQuery);
    res.send(playersArray);
});

//API 7
app.get('/players/:playerId/playerScores', async (req,res) => {
    const {playerId} = req.params;
    const query = `SELECT player_id AS playerId, player_name AS playerName, SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details WHERE player_id=${playerId};`;
    const dbResponse = await database.get(query);
    res.send(dbResponse);
});

module.exports = app;