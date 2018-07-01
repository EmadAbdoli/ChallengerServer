var utility = require("./utility");
var Backtory = require("backtory-sdk");
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

var gameType = function(matchName)
{
    var arr = matchName.split("Matching");
    return arr[1];
}

// on MatchFound we call this function
exports.onMatchFoundController = function (requestBody, context) {

    /* requestBody is like this:
   * {
   *   "realtimeChallengeId": "<REALTIME-GAME-ID>",
   *   "matchmakingName": "<NAME-OF-MATCH-MAKING>",
   *   "participants": [
   *     { "userId": "<USER-ID-1>", "skill": 110, "metaData": "<META-DATA>" },
   *     { "userId": "<USER-ID-2>", "skill": 120, "metaData": "<META-DATA>" },
   *     { "userId": "<USER-ID-3>", "skill": 130, "metaData": "<META-DATA>" }
   *   ]
   * }
   */

    var matchId = requestBody.realtimeChallengeId;
    var participants = requestBody.participants;
    var matchmakingName = requestBody.matchmakingName;
    var gameTypeId = gameType(matchmakingName);

    console.log(matchmakingName);
    console.log(gameTypeId);
    console.log(participants);

    // TODO: save matchid and participants if needed.

    // fetch players

    var Players = Backtory.Object.extend("players");
    myPlayers = new Players();

    var players = [];
    for (let index = 0; index < 4; index++) {

        myPlayers.get(participants[index].userId,{
            success: function(tempPlayer) {
                // The object was retrieved successfully.
                players[index] = tempPlayer;
            },
            error: function(error) {
                // The object was not retrieved successfully.
                index--;
            }
        });
    }

    // create game

    var Game = Backtory.Object.extend("games");
    var game = new Game();

    game.set("gameType", gameTypeId);
    game.set("tableValue", 0);
    game.set("players", players);

    game.save({
        success: function(game) {
            // Execute any logic that should take place after the object is saved.
            context.log('New object created with _id: ' + game.get("_id"));
        },

        error: function(error) {
            // Execute any logic that should take place if the save fails.
                context.log('Failed to create new object, with error code: ' + error.code);
        }
    });

    // create rounds

    // create participants

    

    // save data finished
    
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

    console.log(rndNumbers);
    console.log(selectedTopics);

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

exports.select = function(requestBody, context) {
    console.log("alaki");
};