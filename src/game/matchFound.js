var utility = require("./utility");
var waitUntil = require("./myLibs/wait-until");
var keywordsFile = require("./keywords");

// For server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");

var topicCount = 11;

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

// For server
exports.onMatchFoundController = function (requestBody, context) {
// For Local
//exports.onMatchFoundController = function (requestBody) {

    context.log(requestBody);

    var matchId = requestBody.realtimeChallengeId;
    var participants = requestBody.participants;
    var matchmakingName = requestBody.matchmakingName;
    var gameTypeId = utility.gameTypeIdFinder(matchmakingName);

    var Game = Backtory.Object.extend("games");
    var game = new Game();

    utility.setGameTypeRelations(game, gameTypeId, matchId, participants);
    //utility.getCoinFromUsers(matchmakingName, participants);
    
    /*waitUntil()
        .interval(50)
        .times(Infinity)
        .condition(function() {
            return (game.get("_id") != null ? true : false);
        })
        .done(function(result) {

            //context.log("before setGameRelations...");
            //utility.setGameRelations(game.get("_id"), participants, checker);
    });

    waitUntil()
    .interval(50)
    .times(Infinity)
    .condition(function() {
        return (game.get("_id") != null ? true : false);
    })
    .done(function(result) {

        //context.log("before setPlayersRelations...");
        //utility.setPlayersRelations(game.get("_id"), participants);
    });
    */
    waitUntil()
    .interval(50)
    .times(20)
    .condition(function() {
        return (game.get("_id") != null ? true : false);
    })
    .done(function(tt) {

        var rndNumbers = [];
        rndNumbers[0] = utility.getRandomInt(topicCount);

        rndNumbers[1] = utility.getRandomInt(topicCount);
        while (rndNumbers[1] == rndNumbers[0])
        {
            rndNumbers[1] = utility.getRandomInt(topicCount);
        }

        rndNumbers[2] = utility.getRandomInt(topicCount);
        while (rndNumbers[2] == rndNumbers[1] || rndNumbers[2] == rndNumbers[0])
        {
            rndNumbers[2] = utility.getRandomInt(topicCount);
        }

        var tpids = [];
        for (var i = 0; i < utility.playerCounts; i++)
        {
            tpids.push(utility.getUserPid(participants[i]));
        }

        var tuids = [];
        for (var i = 0; i < utility.playerCounts; i++)
        {
            tuids.push(participants[i].userId);
        }

        var tempUserScore = {};
        var tempUserAction = {};
        var tempUserPostCounts = {};
        var tempUserRejectCounts = {};
        var tempUserJudgedVotes = {};

        for (var i = 0; i < utility.playerCounts; i++)
        {
            tempUserScore[tuids[i]] = 0;
            tempUserAction[tuids[i]] = 0;
            tempUserPostCounts[tuids[i]] = 0;
            tempUserRejectCounts[tuids[i]] = 0;

            var tempArr = [0,0];
            tempUserJudgedVotes[tuids[i]] = tempArr;
        }

        var realtimeGame = new Backtory.RealtimeGame(matchId);
        realtimeGame.setProperties({
            uids: tuids,
            pids: tpids,
            matchName: matchmakingName,
            userScores: tempUserScore,
            userActions: tempUserAction,
            choices: {},
            topics: [],
            topic: "",
            chosenKeywords: {},
            keywordsGameId: "",
            gameId: game.get("_id"),
            startTime: 0,
            theText: "",
            blankKeys: {},
            commonKeys: [],
            turnUid: -1,
            turn: -1,
            sequence: 1,
            lastTurnStartTime: -1,
            filledBlanks: {}, // index start from 0
            filledBlanksShare: {},// index start from 0
            filledBlankOwners: {}, // index start from 0
            filledBlankSeqs:{}, // index start from 0
            filledBlankStates: {}, // index start from 0
            rejectedWords: [],
            rejectionOwners: [],
            rejectionVotes: [],
            userPostCounts: tempUserPostCounts,
            userRejectCounts: tempUserRejectCounts,
            userJudgedVotes: tempUserJudgedVotes // [trueCounts, falseCounts]
        });

        var selectedTopics = 
        [
            keywordsFile.topics[rndNumbers[0]],
            keywordsFile.topics[rndNumbers[1]],
            keywordsFile.topics[rndNumbers[2]],
        ];

        var tResult = {message: selectedTopics, participants: participants};
        
        // For Local
        //console.log(tResult);
        // For Server
        context.log(tResult);
        context.succeed(tResult);
    });
};

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

var reqbody0 = {
    "realtimeChallengeId":"5b4dde7de4b0115f590b850f",
    "matchmakingName":"GameMatching1",
    "participants":[
        {"userId":"5b4457b7e4b0712f42bad646","skill":0,"metaData":"[\"emad666\",\"5b4457b74f83de0001e9bd59\",\"1\"]"},
        {"userId":"5b445c62e4b0a2a06398f896","skill":0,"metaData":"[\"milad222\",\"5b445c624f83de0001e9d101\",\"2\"]"},
        {"userId":"5b445c73e4b0a2a06398f8a0","skill":0,"metaData":"[\"zahra222\",\"5b445c735ce7180001bfaf7c\",\"2\"]"}
    ]
}

var reqbody = {
    "realtimeChallengeId": "123123edf456",
    "matchmakingName": "GameMatching1",
    "participants":
        [
            {"userId":"5b6c290ce4b09aa3e74c8c30",
            "skill":0,
            "metaData":'["emadAbdoli","5b6c290d0b088c0001d39de2",\"1\"]'
        },
            {"userId":"5b445c73e4b0a2a06398f8a0",
            "skill":0,
            "metaData":'["zahra222","5b445c735ce7180001bfaf7c",\"2\"]'
        },
        {
            "userId":"5b66f2ebe4b04f9269b15593",
            "skill":0,
            "metaData": '["Fortest","5b66f2eb0b088c0001ad4b59",\"2\"]'
        }
        ]
};

//this.onMatchFoundController(reqbody);   