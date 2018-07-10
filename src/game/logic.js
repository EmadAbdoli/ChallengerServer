var utility = require("./utility");

// For server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");
var waitUntil = require("./myLibs/wait-until");

//var waitUntil = require("./../../api/node_modules/wait-until");
//var fs = require('fs');
//Backtory.setConfigFileLocation("C:/Users/Emad/Downloads/Compressed/Ubuntu.1604.2017.711.0_v1/rootfs/home/Emad/Server_backtory/src/backtory_config.json");

var topics = 
[
    "Travel",
    "College Life",
    "Socializing",
    "Employment",
    "Voting",
    "Daily Life",
    "Buying a Car",
    "In a New Neighborhood",
    "At a Hotel",
    "Small Talk",
    "Driving",
    "At the Bank",
    "At the Library",
    "Renting an Apartment",
    "Buying a House",
    "Unemployment",
    "Health",
    "Crime",
    "Shopping",
    "Taking the Bus",
    "Transferring to a University",
    "Food",
    "At a Restaurant",
    "Dating",
    "Selling a House"
];
var gameTypesIds = 
{
    "1" : "5ae58c6f77e6b100010d11c5",
    "2" : "5ae58c21790c0c0001d2387b"
}

var gameTypeIdFinder = function(matchName)
{
    var arr = matchName.split("Matching");
    return arr[1];
}

var setGameRelations = function(gid, participants)
{
    var Game = Backtory.Object.extend("games");
    var game = new Game();
    var gamePlayerRelation = game.relation("players");
    game.set("_id", gid);

    var Player = Backtory.Object.extend("players");
    for(var i = 0; i < participants.length; i++)
    {
        var tempPlayer = new Player();
        tempPlayer.set("_id", participants[i].metaData.pid.toString());
        gamePlayerRelation.add(tempPlayer);
    }

    game.save({
        success:function(game){}
    });
}

var setGameTypeRelations = function(game, gameTypeId, matchId)
{
    var GameType = Backtory.Object.extend("gameType");

    var myGameType = new GameType();
    myGameType.set("_id", gameTypesIds[gameTypeId]);
    var gamesRelation = myGameType.relation("games");
    gamesRelation.add(game);

    myGameType.save({
        success:function(gameType)
        {
            game.set("gameType", gameType);
            game.set("tableValue", 1);
            game.set("challengeId",matchId);

            game.save();
        }
    });
}

var setPlayersRelations = function(gid, participants)
{
    var Game = Backtory.Object.extend("games");
    var Player = Backtory.Object.extend("players");
    
    var game = new Game();
    game.set("_id", gid);

    for(var i = 0; i < participants.length; i++)
    {
        var tempPlayer = new Player();
        console.log("player pid:" + participants[i].metaData.pid.toString());

        tempPlayer.set("_id", participants[i].metaData.pid.toString());
        var pGames = tempPlayer.relation("games");
        pGames.add(game);
        tempPlayer.save({
            success:function(tempPlayer){}
        });        
    }

    console.log("players' games saved");
}

// on MatchFound we call this function
// For server
exports.onMatchFoundController = function (requestBody, context) {
// For Local
//exports.onMatchFoundController = function (requestBody) {

    var matchId = requestBody.realtimeChallengeId;
    var participants = requestBody.participants;
    var matchmakingName = requestBody.matchmakingName;
    var gameTypeId = gameTypeIdFinder(matchmakingName);

    var Game = Backtory.Object.extend("games");
    var game = new Game();

    setGameTypeRelations(game, gameTypeId, matchId);
 
    waitUntil()
        .interval(100)
        .times(10)
        .condition(function() {
            return (game.get("_id") != undefined ? true : false);
        })
        .done(function(result) {
            setGameRelations(game.get("_id"), participants);
    });

    waitUntil()
    .interval(1000)
    .times(1)
    .condition(function() {
        return (true ? true : false);
    })
    .done(function(result) {
        setPlayersRelations(game.get("_id"), participants);
    });

    var rndNumbers = [];
    rndNumbers[0] = utility.getRandomInt(25);

    rndNumbers[1] = utility.getRandomInt(25);
    while (rndNumbers[1] == rndNumbers[0])
    {
        rndNumbers[1] = utility.getRandomInt(25);
    }

    rndNumbers[2] = utility.getRandomInt(25);
    while (rndNumbers[2] == rndNumbers[1] || rndNumbers[2] == rndNumbers[0])
    {
        rndNumbers[2] = utility.getRandomInt(25);
    }

    var selectedTopics = 
    [
        topics[rndNumbers[0]],
        topics[rndNumbers[1]],
        topics[rndNumbers[2]],
    ];
    
    // Return selected topics for this challenge
    // Todo: for push code on server uncomment this line
    context.succeed(JSON.stringify(selectedTopics));
};

exports.gameEventController = function (requestBody, context) {

    /* requestBody is like this:
   * {
   *   "userId": "1234",
   *   "challengeId": "<UNIQUE-MATCH-ID>",
   *   "message": {
   *      "myChoice": 3,
   *      "someOtherField": "sample text",
   *      ....  
   *    },
   *    "data": { ... }
   * }
   */

    var userId = requestBody.userId;
    var challengeId = requestBody.challengeId;
    var eventType = requestBody.message;
    var result;

    switch (eventType) {
        case "SubjectSelection":

            var choice = requestBody.data.choice;
            result = { operation : 'subjectSelection', userId: userId, choice: choice};

            break;
    
        default:
            break;
    }

    //// 2. Check correct answer
    //if (hisChoice == 3) {
    //    result = { operation: 'addScore', userId: userId, score: 10 };
    //} else {
    //    result = { operation: 'doNothing' };
    //}

    context.succeed({
        message: JSON.stringify(result)
    });
};

var reqbody = {
    "realtimeChallengeId": "123123edf456",
    "matchmakingName": "GameMatching1",
    "participants": [
      { "userId": "5b43b32ee4b09c84b57474ec", "skill": 110, 
        "metaData": 
        {
            "username" : "emad111",
            "pid" : "5b43b32e54a773000116bf7a"
        }
    },
      { "userId": "5b43b690e4b0a2a06398bb8b", "skill": 120, 
        "metaData": 
        {
            "username" : "milad111",
            "pid" : "5b43b6904f83de0001e7a3c3"
        } 
    },
      { "userId": "5b43b6c1e4b0712f42ba9c77", "skill": 130,
        "metaData": 
        {
            "username" : "zahra111",
            "pid" : "5b43b6c154a77300016ed6b8"
        } 
    }
    ]
};

var reqbody1 = {
       "userId": "1234",
       "challengeId": "dsfgsdgf",
       "message": {
          "myChoice": 3,
          "someOtherField": "sample text",
        }
     };

//this.onMatchFoundController(reqbody);
//this.gameEventController(reqbody1, "");