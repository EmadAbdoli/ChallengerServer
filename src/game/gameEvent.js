var utility = require("./utility");
var waitUntil = require("./myLibs/wait-until");


// For server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");

//var fs = require('fs');
//Backtory.setConfigFileLocation("C:/Users/Emad/Downloads/Compressed/Ubuntu.1604.2017.711.0_v1/rootfs/home/Emad/Server_backtory/src/backtory_config.json");
var playerCounts = 3;


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
    var props = requestBody.properties;

    var result;
    var checkKeywordsGameId = false;
    let tkeywordsGameId = {val: -1};


    switch (eventType) 
    {

        /****************************************************** */
        /****************************************************** */

        case "SubjectSelection":

            if (props.topic != "")
            {
                result = {operation: 'invalidOperation1', userId: userId};
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
                    checkKeywordsGameId = true;

                    var topicIndex = utility.calcTopic(props.choices);
                    props["topic"]=  props.topics[topicIndex];

                    var tKeywords = utility.getTopicKeywords(props["topic"], topicIndex);

                    var reqType = "new_game";
                    var formParams = {};
                    formParams.topic = props.topics[topicIndex];
                    
                    formParams.keywords = '[';
                    for (var i = 0; i < tKeywords.length; i++)
                    {
                        formParams.keywords += '"' + tKeywords[i] + '"';
                        if ( i != tKeywords.length - 1) formParams.keywords += ',';
                    }
                    formParams.keywords += ']';

                    utility.sendRequest(reqType, formParams, tkeywordsGameId);

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

            var userSelectedKeywords = JSON.parse(requestBody.data.userKeywords);

            if ((userId in props.chosenKeywords) == true)
            {
                result = {operation: 'invalidOperation2', userId: userId};
            }
            else
            {
                props.chosenKeywords[userId] = userSelectedKeywords;

                if (Object.keys(props.chosenKeywords).length == playerCounts)
                {

                    // send get_paragraphs for API
                }
                else
                {
                    result = { operation : 'selectedKeywords', userId: userId};
                }
            }
            break;

        /****************************************************** */
        /****************************************************** */
    
        default:
            break;
    }

    if (checkKeywordsGameId)
    {
        waitUntil()
        .interval(100)
        .times(Infinity)
        .condition(function() {
            return (tkeywordsGameId.val != -1 ? true : false);
        })
        .done(function(temp) {
            
            props.keywordsGameId = tkeywordsGameId.val;

            utility.setgameKeywordsId(props.gameId, props.keywordsGameId);

            var tResult = {message: JSON.stringify(result), properties: props};
            // For Local
            //console.log(tResult);
            // For Server
            context.log(tResult);
            context.succeed(tResult);
        });
    }
    else
    {
        //context.log(props);
        var tResult = {message: JSON.stringify(result), properties: props};
        // For Local
        //console.log(tResult);
        // For Server
        context.log(tResult);
        context.succeed(tResult);
    }
};

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

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
        "choices": {1:1,2:1},
        "topics": ["Selling a House","At the Bank","Health"],
        "topic" : "",
        "chosenKeywords": {},
        "keywordsGameId" : "",
        "gameId" : "5b4dde7d0f747e00014d84e9"
    },
    "data" :{
        "choice": 0,
        "topics": '["Selling a House","At the Bank","Health"]',
    },
    "clientRequestId": "26e7379d-f2e6-46d3-be78-3f300345517e"
}

var formParams = {};
formParams.topic = "Health";
formParams.keywords = '["doctor","problem","blood","appointment","results","emergency","medication","test","insurance","pressure","problems","stomach","professor","stress","antihistamine","sleep","breath","medicine","feeling","good","lately","health","effects","infection","chest","information","prescription","itching","trouble"]';


//this.gameEventController(reqbody2);