var utility = require("./utility");
//var Backtory = require("node_modules/backtory-sdk");
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

// on MatchFound we call this function
exports.onMatchFoundController = function (requestBody, context) {

    var matchId = requestBody.realtimeChallengeId;
    var participants = requestBody.participants;
    var matchmakingName = requestBody.matchmakingName;
    var gameTypeId = gameTypeIdFinder(matchmakingName);

    // fetch gameType

    var GameType = Backtory.Object.extend("gameType");
    var gameTypeQuery = new Backtory.Query(GameType);

    gameTypeQuery.equalTo("gameTypeId", "1");
    gameTypeQuery.find({
        success: function(results) {
            var gameType = results[0]; // Backtory.Object

            var prize = gameType.get("prize");
            var rounds = gameType.get("round");
            var level = gameType.get("level");
            var coin = gameType.get("coin");

            gameType.set("coin", coin + 2);
            gameType.save();
        },
        error: function(error)
        {

        }
    });
    /*
    gameTypeQuery.get(gameTypesIds[gameTypeId] , {
        success:function(gameType)
        {
            var prize = gameType.get("prize");
            var rounds = gameType.get("round");
            var level = gameType.get("level");
            var coin = gameType.get("coin");

            gameType.set("coin", coin + 2);
            gameType.save();
        },
        error:function(error)
        {
            context.error("Error in gameTypeQuery");
        }
    });
*/
    context.log("Hi There");

    // create game

    // fetch players

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
    "realtimeChallengeId": "123123",
    "matchmakingName": "GameMatching1",
    "participants": [
      { "userId": "12345123", "skill": 110, "metaData": "" },
      { "userId": "12375123", "skill": 120, "metaData": "" },
      { "userId": "12385123", "skill": 130, "metaData": "" }
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

//this.onMatchFoundController(reqbody, "");
//this.gameEventController(reqbody1, "");