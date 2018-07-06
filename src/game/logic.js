var utility = require("./utility");
var Backtory = require("backtory-sdk");
//var Backtory = require("./../../api/node_modules/backtory-sdk");
//var fs = require('fs');
//sdk.setConfigFileLocation("../backtory_config.json");

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

var getLog = function(content,context)
{
    console.log("in GetLog");
    context.log("in GetLog");

    fs.appendFile('log.txt', content, function (err) {
        if (err) {
            console.log("errerrror");
            context.log("errrrror");
            throw err;
        }
        console.log('Saved!');
        context.log('Saved!');
    });
}

var setGameRelations = function(game, participants, context)
{
    var tableValue = game.get("tableValue");
    game.set("tableValue", tableValue + 2);
    game. save({
        success:function(game)
        {
            var Player = Backtory.Object.extend("players");
            var playersQuery = new Backtory.Query(Player);
            var players = [];

            var pids = 
            [
                participants[0].userId.toString(),
                participants[1].userId.toString(),
                participants[2].userId.toString(),
            ];

            playersQuery.containedIn("_id", pids);
            playersQuery.find({
                success:function(plist)
                {
                    for(var i = 0; i < plist.length; i++)
                    {
                        var coin = plist[i].get("coin");
                        plist[i].set("coin", coin + 2);
                        plist[i].save();
                    }
                }
            });
            /*
            var playerGamesRelation = player.relation("games");
            playerGamesRelation.add(game);
            player.save();
            */
        }
    });
}

// on MatchFound we call this function
exports.onMatchFoundController = function (requestBody, context) {

    var matchId = requestBody.realtimeChallengeId;
    var participants = requestBody.participants;
    var matchmakingName = requestBody.matchmakingName;
    var gameTypeId = gameTypeIdFinder(matchmakingName);

    // fetch gameType

    var GameType = Backtory.Object.extend("gameType");
    var gameTypeQuery = new Backtory.Query(GameType);

    var Game = Backtory.Object.extend("games");
    var game = new Game();

    gameTypeQuery.get(gameTypesIds[gameTypeId] , {
        success:function(gameType)
        {
            var prize = gameType.get("prize");
            var rounds = gameType.get("round");
            var level = gameType.get("level");
            var coin = gameType.get("coin");
            var gamesRelation = gameType.relation("games");
            
            gamesRelation.add(game);
            gameType.set("coin", coin + 4);
            
            gameType.save({
                success:function(gameType) {

                    game.set("gameType", gameType);
                    game.set("tableValue", 1);
                    game.set("challengeId",matchId);

                    game.save({
                        success:function(tgame)
                        {
                            setGameRelations(tgame, participants, context);
                        },
                        error:function(err)
                        {
                            context.log("error in saving game");
                        }
                    })
                },
                error:function(err)
                {
                    context.log("error in gameType save");
                }
            });
        },
        error:function(error)
        {
            context.error("Error in gameTypeQuery");
        }
    });

    context.log("Hi There");

    context.succeed("succeedam");

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

    context.log(rndNumbers);
    context.log(selectedTopics);

    //var finalResult = {
    //    welcomeMessage: "Welcome to this match",
    //    topics: result
    //}
    
    // Return selected questions for this challenge
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
      { "userId": "5b38a1d2fe76c80001f30e3e", "skill": 110, "metaData": "" },
      { "userId": "5b38a1542279be00016a712c", "skill": 120, "metaData": "" },
      { "userId": "5b31f8e82279be00011dad75", "skill": 130, "metaData": "" }
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