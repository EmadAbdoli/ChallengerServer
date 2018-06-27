var utility = require("./utility");
//var sdk = require("backtory-sdk");
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

// on MatchFound we call this function
exports.recommend = function (requestBody, context) {

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

    // TODO: save matchid and participants if needed.
    
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

    var result = 
    [
        topics[rndNumbers[0]],
        topics[rndNumbers[1]],
        topics[rndNumbers[2]],
    ];

    console.log(rndNumbers);
    console.log(result);

    //var finalResult = {
    //    welcomeMessage: "Welcome to this match",
    //    topics: result
    //}
    
    // Return selected questions for this challenge
    context.succeed(JSON.stringify(result));
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
    var choice = requestBody.message.myChoice;

    // 2. Check correct answer
    if (hisChoice == 3) {
        result = { operation: 'addScore', userId: userId, score: 10 };
    } else {
        result = { operation: 'doNothing' };
    }

    context.succeed({
        message: JSON.stringify(result)
    });
};

exports.select = function(requestBody, context) {
    console.log("alaki");
};