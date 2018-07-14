var utility = require("./utility");
var keywordsFile = require("./keywords");

// For server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");
var waitUntil = require("./myLibs/wait-until");

//var fs = require('fs');
//Backtory.setConfigFileLocation("C:/Users/Emad/Downloads/Compressed/Ubuntu.1604.2017.711.0_v1/rootfs/home/Emad/Server_backtory/src/backtory_config.json");
var playerCounts = 3;
var topicCount = 11;


//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

// on MatchFound we call this function
// For server
exports.onMatchFoundController = function (requestBody, context) {
// For Local
//exports.onMatchFoundController = function (requestBody) {

    var matchId = requestBody.realtimeChallengeId;
    var participants = requestBody.participants;
    var matchmakingName = requestBody.matchmakingName;
    var gameTypeId = utility.gameTypeIdFinder(matchmakingName);

    var Game = Backtory.Object.extend("games");
    var game = new Game();

    utility.setGameTypeRelations(game, gameTypeId, matchId);
 
    waitUntil()
        .interval(100)
        .times(10)
        .condition(function() {
            return (game.get("_id") != undefined ? true : false);
        })
        .done(function(result) {
            utility.setGameRelations(game.get("_id"), participants);
    });

    waitUntil()
    .interval(1000)
    .times(1)
    .condition(function() {
        return (true ? true : false);
    })
    .done(function(result) {
        utility.setPlayersRelations(game.get("_id"), participants);
    });

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

    var selectedTopics = 
    [
        keywordsFile.topics[rndNumbers[0]],
        keywordsFile.topics[rndNumbers[1]],
        keywordsFile.topics[rndNumbers[2]],
    ];
    
    // Return selected topics for this challenge
    // Todo: for push code on server uncomment this line
    // For Local
    //console.log(JSON.stringify(selectedTopics));
    // For Server
    context.succeed(JSON.stringify(selectedTopics));
};

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

// For server
exports.gameEventController = function (requestBody, context) {
// For local
//exports.gameEventController = function (requestBody) {

    /* requestBody is like this:
   * {
   *   "userId": "1234",
   *   "challengeId": "<UNIQUE-MATCH-ID>",
   *   "message": {
   *      "myChoice": 3,
   *      "someOtherField": "sample text",
   *      ....  
   *    },
   *    "data": { ... },
   *    "properties": { ... },
   * }
   */

    context.log(requestBody);
    //context.log(requestBody.properties);

    var userId = requestBody.userId;
    var eventType = requestBody.message;
    var props;
    if (requestBody.properties == undefined)
        {
            props = {
                "choices": {},
                "topics": [],
                "topic" : ""
            };
        }
    else
        {
            props = requestBody.properties;
        }

    var result;



    switch (eventType) 
    {

        /****************************************************** */
        /****************************************************** */

        case "SubjectSelection":

            if (props.topic != "")
            {
                result = {operation: 'invalidOperation', userId: userId};
            }
            else
            {
                if ((userId in props.choices) == false)
                    props.choices[userId] = requestBody.data.choice;
                else
                    props.choices[userId] = requestBody.data.choice;
                
                props.topics = JSON.parse(requestBody.data.topics);

                if (Object.keys(props.choices).length == playerCounts)
                {
                    var topicIndex = utility.calcTopic(props.choices);
                    props["topic"]=  props.topics[topicIndex];

                    var tKeywords = utility.getTopicKeywords(props["topic"], topicIndex);

                    result = {operation: 'subjectSelected', 
                                userId: userId, choice: requestBody.data.choice, topic : topicIndex, keywords: tKeywords};
                }
                else
                {
                    result = { operation : 'subjectSelection', userId: userId, choice: requestBody.data.choice};
                }
            }            

            break;

        /****************************************************** */
        /****************************************************** */

        case "selectedKeywords":



            break;

        /****************************************************** */
        /****************************************************** */
    
        default:
            break;
    }

    context.log(props);

    var tResult = {message: JSON.stringify(result), properties: props};
    // For Local
    //console.log(tResult);
    // For Server
    context.succeed(tResult);
};

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

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

var reqbody1 = {
    "message": "SubjectSelection",
    "userId" : "3",
    "properties": null,
    "data" :{
        "choice": 0,
        "topics": '["Selling a House","At the Bank","Health"]',
    }
};

var reqbody2 = {
    "message": "SubjectSelection",
    "userId" : "4",
    "properties": {
        "choices": {1:1,2:1,3:1},
        "topics": ["Selling a House","At the Bank","Health"],
        "topic" : ""
    },
    "data" :{
        "choice": 0,
        "topics": '["Selling a House","At the Bank","Health"]',
    },
    "clientRequestId": "26e7379d-f2e6-46d3-be78-3f300345517e"
}

//this.onMatchFoundController(reqbody);
//this.gameEventController(reqbody2);