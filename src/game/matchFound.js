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

// on MatchFound we call this function
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

    let checker = {gameTypeRel: false, gameRel: false};

    context.log("before setGameTypeRelations...");

    utility.setGameTypeRelations(game, gameTypeId, matchId, checker);
    
    waitUntil()
        .interval(50)
        .times(Infinity)
        .condition(function() {
            return (checker.gameTypeRel == true ? true : false);
        })
        .done(function(result) {

            context.log("before setGameRelations...");
            utility.setGameRelations(game.get("_id"), participants, checker);
    });

    waitUntil()
    .interval(50)
    .times(Infinity)
    .condition(function() {
        return (checker.gameRel == true ? true : false);
    })
    .done(function(result) {

        context.log("before setPlayersRelations...");
        utility.setPlayersRelations(game.get("_id"), participants);
    });

    waitUntil()
    .interval(50)
    .times(Infinity)
    .condition(function() {
        return (checker.gameTypeRel == true ? true : false);
    })
    .done(function(tt) {

        context.log("After All....");

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

        var realtimeGame = new Backtory.RealtimeGame(matchId);
        realtimeGame.setProperties({
            choices: {},
            topics: [],
            topic: "",
            chosenKeywords: {},
            keywordsGameId: "",
            gameId: game.get("_id")
        });

        //props = {
        //    "choices": {},
        //    "topics": [],
        //    "topic" : "",
        //    "chosenKeywords": {},
        //    "keywordsGameId" : "",
        //    "gameId" : game.get("_id")
        //};

        var selectedTopics = 
        [
            keywordsFile.topics[rndNumbers[0]],
            keywordsFile.topics[rndNumbers[1]],
            keywordsFile.topics[rndNumbers[2]],
        ];

        //var tResult = {message: selectedTopics, properties: props};
        var tResult = {message: selectedTopics};

        /*
        {
            "message":["Voting","College Life","Small Talk"],
            "properties":{
                "choices":{},
                "topics":[],
                "topic":"",
                "chosenKeywords":{},
                "keywordsGameId":"",
                "gameId":"5b4e1ff50f747e00015a75cf"
            }
        }
        */
        
        // Return selected topics for this challenge
        // Todo: for push code on server uncomment this line
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
        {"userId":"5b4457b7e4b0712f42bad646","skill":0,"metaData":"[\"emad666\",\"5b4457b74f83de0001e9bd59\"]"},
        {"userId":"5b445c62e4b0a2a06398f896","skill":0,"metaData":"[\"milad222\",\"5b445c624f83de0001e9d101\"]"},
        {"userId":"5b445c73e4b0a2a06398f8a0","skill":0,"metaData":"[\"zahra222\",\"5b445c735ce7180001bfaf7c\"]"}
    ]
}

var reqbody = {
    "realtimeChallengeId": "123123edf456",
    "matchmakingName": "GameMatching1",
    "participants":
        [
            {"userId":"5b445c62e4b0a2a06398f896",
            "skill":0,
            "metaData":'["milad222","5b445c624f83de0001e9d101"]'
        },
            {"userId":"5b445c73e4b0a2a06398f8a0",
            "skill":0,
            "metaData":'["zahra222","5b445c735ce7180001bfaf7c"]'
        },
        {
            "userId":"5b4457b7e4b0712f42bad646",
            "skill":0,
            "metaData": '["emad666","5b4457b74f83de0001e9bd59"]'
        }
        ]
};

//this.onMatchFoundController(reqbody0);