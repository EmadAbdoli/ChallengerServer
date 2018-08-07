var utility = require("./utility");
var waitUntil = require("./myLibs/wait-until");

// For server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");

//var fs = require('fs');
//Backtory.setConfigFileLocation("C:/Users/Emad/Downloads/Compressed/Ubuntu.1604.2017.711.0_v1/rootfs/home/Emad/Server_backtory/src/backtory_config.json");


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

    //console.log(requestBody);
    context.log(requestBody);
    //context.log(requestBody.properties);

    var userId = requestBody.userId;
    var eventType = requestBody.message;
    var props = requestBody.properties;

    var result;
    var dontsendResult = false;


    switch (eventType) 
    {

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

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

                if (Object.keys(props.choices).length == utility.playerCounts)
                {
                    dontsendResult = true;
                    let tkeywordsGameId = {val: -1};

                    var topicIndex = utility.calcTopic(props.choices);
                    props["topic"]=  props.topics[topicIndex];

                    var tKeywords = utility.getTopicKeywords(props["topic"], topicIndex);

                    utility.sendNewGameRequest(props["topic"], tKeywords, tkeywordsGameId);
                    utility.setRoundParticipants(props.gameId, props.topic, props.pids);

                    result = {operation: 'subjectSelected', 
                                userId: userId, choice: requestBody.data.choice, topic : topicIndex, keywords: tKeywords};

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
                    result = { operation : 'subjectSelection', userId: userId, choice: requestBody.data.choice};
                }
            }            

            break;

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "selectedKeywords":

            var userSelectedKeywords = JSON.parse(requestBody.data.userKeywords);

            if ((userId in props.chosenKeywords) == true)
            {
                result = {operation: 'invalidOperation2', userId: userId};
            }
            else
            {
                props.chosenKeywords[userId] = userSelectedKeywords;

                if (Object.keys(props.chosenKeywords).length == utility.playerCounts)
                {
                    dontsendResult = true;
                    var keywordsUnion = [];

                    for (var i = 0; i < utility.playerCounts; i++)
                    {
                        var tUserKeys = props.chosenKeywords[props.uids[i]];

                        for (var j = 0; j < tUserKeys.length; j++)
                        {
                            if (keywordsUnion.includes(tUserKeys[j]) == false)
                                keywordsUnion.push(tUserKeys[j]);
                        }
                    }

                    let checker = {val: false, blanksKeys: {}, commonKeys: [], theText: ""};
                    utility.sendGetParagraphsRequest(props.keywordsGameId, keywordsUnion, checker);

                    waitUntil()
                    .interval(100)
                    .times(Infinity)
                    .condition(function() {
                        return (checker.val == true ? true : false);
                    })
                    .done(function(temp) {

                        var blanksKeywordsKeys = Object.keys(checker.blanksKeys);
                        var blanksKeyArr = [];
                        for (var i = 0; i < blanksKeywordsKeys.length; i++)
                        {
                            blanksKeyArr.push(checker.blanksKeys[blanksKeywordsKeys[i]]);
                        }

                        result = { operation : 'textReady', userId: userId,
                                    blanksKeys: blanksKeyArr, commonKeys: checker.commonKeys, theText: checker.theText,
                                    turnUid: props.uids[0], sequence: 1
                                 };

                        props.blankKeys = checker.blanksKeys;
                        props.commonKeys = checker.commonKeys;
                        props.theText = checker.theText;
                        
                        props.sequence = 2;

                        var d = new Date();
                        var seconds = Math.round(d.getTime() / 1000);
                        props.lastTurnStartTime = seconds;

                        props.turnUid = props.uids[0];
                        props.turn = 0;
                        props.sequence = 1;
            
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
                    result = { operation : 'selectedKeywords', userId: userId};
                }
            }
            break;

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "PassTurn":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                if (userId == props.turnUid)
                {
                    props.turn = (props.turn + 1) % utility.playerCounts;
                    props.turnUid = props.uids[props.turn];
                    props.sequence = props.sequence + 1;

                    var d = new Date();
                    var seconds = Math.round(d.getTime() / 1000);
                    props.lastTurnStartTime = seconds;

                    result = { operation : 'nextTrun',
                               userId: userId,
                               turnUid: props.turnUid,
                               sequence: props.sequence
                             };
                }
                else
                {
                    result = {operation: 'notYourTurn', userId: userId};
                }
            }

        break;

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "turnTimeout":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                var d = new Date();
                var seconds = Math.round(d.getTime() / 1000);

                if (seconds - props.lastTurnStartTime >= utility.eachTurnTime)
                {
                    props.turn = (props.turn + 1) % utility.playerCounts;
                    props.turnUid = props.uids[props.turn];
                    props.sequence = props.sequence + 1;
                    props.lastTurnStartTime = seconds;

                    result = { operation : 'nextTrun',
                               userId: userId,
                               turnUid: props.turnUid,
                               sequence: props.sequence
                             };
                }
            }
        break;
    
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "PutWord":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);
            
            var blanktoFillIndex = JSON.parse(requestBody.data.blankIndex);
            var wordtoPutInBlank = JSON.parse(requestBody.data.wordToPut);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                if (userId == props.turnUid)
                {
                    //blankKeys: {},
                    //commonKeys: [],
                    //turnUid: -1,
                    //turn: -1,
                    //sequence: -1,
                    //lastTurnStartTime: -1,
                    //filledBlanks: {},
                    //filledBlankOwners: {},
                    //rejectedWords: [],
                    //rejectionOwners: [],
                    //rejectionVotes: []

                    if (Object.keys(props.filledBlanks).findIndex(function(element){return element == blanktoFillIndex}) != -1)
                    {
                        result = {operation: 'blankIsFull',
                                    userId: userId,
                                    turnUid: props.turnUid,
                                    sequence: props.sequence,
                                    filledBlanks: props.filledBlanks
                                 };
                    }
                    else
                    {
                        props.filledBlanks[blanktoFillIndex] = wordtoPutInBlank;
                        props.filledBlankOwners[blanktoFillIndex] = userId;

                        var d = new Date();
                        var seconds = Math.round(d.getTime() / 1000);

                        props.turn = (props.turn + 1) % utility.playerCounts;
                        props.turnUid = props.uids[props.turn];
                        props.sequence = props.sequence + 1;
                        props.lastTurnStartTime = seconds;

                        result = { operation : 'PutWord',
                                    userId: userId,
                                    turnUid: props.turnUid,
                                    sequence: props.sequence,
                                    filledBlanks: props.filledBlanks
                                 };
                    }
                }
                else
                {
                    result = {operation: 'notYourTurn', userId: userId};
                }
            }


        break;

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "RejectWord":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);
            
            var blankToRejectIndex = JSON.parse(requestBody.data.blankIndex);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                if (userId == props.turnUid)
                {
                    //blankKeys: {},
                    //commonKeys: [],
                    //turnUid: -1,
                    //turn: -1,
                    //sequence: -1,
                    //lastTurnStartTime: -1,
                    //filledBlanks: {},
                    //filledBlankOwners: {},
                    //rejectedWords: [],
                    //rejectionOwners: [],
                    //rejectionVotes: []

                    if (Object.keys(props.filledBlanks).findIndex(function(element){return element == blankToRejectIndex}) == -1)
                    {
                        result = {operation: 'blankIsEmpty',
                                    userId: userId,
                                    turnUid: props.turnUid,
                                    sequence: props.sequence,
                                    filledBlanks: props.filledBlanks
                                 };
                    }
                    else
                    {
                        var newReject = [];
                        newReject.push(blankToRejectIndex);
                        newReject.push(props.filledBlanks[blankToRejectIndex]);
                        
                        props.rejectedWords.push(newReject);
                        props.rejectionOwners.push(userId);

                        var d = new Date();
                        var seconds = Math.round(d.getTime() / 1000);

                        props.sequence = props.sequence + 1;
                        props.lastTurnStartTime = seconds;

                        result = { operation : 'voteActive',
                                    userId: userId,
                                    rejectIndex: blankToRejectIndex,
                                    turnUid: props.turnUid,
                                    sequence: props.sequence,
                                    filledBlanks: props.filledBlanks
                                 };
                    }
                }
                else
                {
                    result = {operation: 'notYourTurn', userId: userId};
                }
            }

        break;

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "rejectVote":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);
            
            var userVote = JSON.parse(requestBody.data.myVote);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                //blankKeys: {},
                //commonKeys: [],
                //turnUid: -1,
                //turn: -1,
                //sequence: -1,
                //lastTurnStartTime: -1,
                //filledBlanks: {},
                //filledBlankOwners: {},
                //rejectedWords: [],
                //rejectionOwners: [],
                //rejectionVotes: []

                var rejectIndex = props.rejectedWords.length;
                
                var prevVotes;
                if (props.rejectionVotes.length == props.rejectedWords.length)
                {
                    prevVotes = props.rejectionVotes[rejectIndex-1];
                }
                else
                {
                    prevVotes = {};
                }

                prevVotes[userId] = userVote;
                props.rejectionVotes[rejectIndex-1] = prevVotes;

                if (Object.keys(prevVotes).length == utility.playerCounts)
                {
                    var votingResult = utility.calcVotingResult(props.rejectionVotes[rejectIndex-1]);
                    props.rejectedWords[rejectIndex-1].push(votingResult);

                    if (votingResult == 1)
                    {
                        var wordIndexInBlanks = props.rejectedWords[rejectIndex-1][0];
                        delete props.filledBlanks[wordIndexInBlanks];
                        delete props.filledBlankOwners[wordIndexInBlanks];
                    }

                    var d = new Date();
                    var seconds = Math.round(d.getTime() / 1000);

                    props.turn = (props.turn + 1) % utility.playerCounts;
                    props.turnUid = props.uids[props.turn];
                    props.sequence = props.sequence + 1;
                    props.lastTurnStartTime = seconds;

                    result = { operation : 'rejectionResult',
                                vResult: votingResult,
                                turnUid: props.turnUid,
                                sequence: props.sequence,
                                filledBlanks: props.filledBlanks
                                };
                }
                else
                {
                    result = { operation : 'voteSubmited',
                                userId: userId,
                                vote: userVote,
                                turnUid: props.turnUid,
                                sequence: props.sequence,
                                filledBlanks: props.filledBlanks
                                };
                }
            }

        break;


        default:
            break;
    }

    if(dontsendResult == false)
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
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
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

var reqbody3 = {
    "message":"selectedKeywords",
    "userId":"5b445c62e4b0a2a06398f896",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "userKeywords":"[\"president\",\"obama\",\"voting\",\"year\",\"polling\",\"questions\",\"news\",\"new\",\"faith\",\"volunteering\"]"
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices":{
            "5b4457b7e4b0712f42bad646":"0",
            "5b445c73e4b0a2a06398f8a0":"1",
            "5b445c62e4b0a2a06398f896":"2"
        },
        "topics":["Food","Voting","Shopping"],
        "topic":"Voting",
        "chosenKeywords":{
            "5b4457b7e4b0712f42bad646":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c73e4b0a2a06398f8a0":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"]
        },
        "keywordsGameId":47,
        "gameId":"5b4f31c76374f60001d52af9",
        "theText": "",
        "blankKeys": {},
        "commonKeys": [],
        "turnUid": -1,
        "turn": -1,
        "sequence": -1,
        "filledBlanks": {},
        "filledBlankOwners": {},
        "rejectedWords": [],
        "rejectionOwners": [],
        "rejectionVotes": [],
    }
}

var reqbody4 = {
    "message":"TimeOutAlarm",
    "userId":"5b4457b7e4b0712f42bad646",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence":"1"
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices":{
            "5b4457b7e4b0712f42bad646":"0",
            "5b445c73e4b0a2a06398f8a0":"1",
            "5b445c62e4b0a2a06398f896":"2"
        },
        "topics":["Food","Voting","Shopping"],
        "topic":"Voting",
        "chosenKeywords":{
            "5b4457b7e4b0712f42bad646":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c73e4b0a2a06398f8a0":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c62e4b0a2a06398f896":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"]
        },
        "keywordsGameId":47,
        "gameId":"5b4f31c76374f60001d52af9",
        "theText": "",
        "blankKeys": {},
        "commonKeys": [],
        "turnUid": "5b4457b7e4b0712f42bad646",
        "turn": 0,
        "sequence": 1,
        "lastTurnStartTime": 1533375680,
        "filledBlanks": {},
        "filledBlankOwners": {},
        "rejectedWords": [],
        "rejectionOwners": [],
        "rejectionVotes": [],
    }
}

var reqbody5 = {
    "message":"PutWord",
    "userId":"5b4457b7e4b0712f42bad646",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence":"1",
        "blankIndex": "11",
        "wordToPut": '\"then?\"'
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices":{
            "5b4457b7e4b0712f42bad646":"0",
            "5b445c73e4b0a2a06398f8a0":"1",
            "5b445c62e4b0a2a06398f896":"2"
        },
        "topics":["Food","Voting","Shopping"],
        "topic":"Voting",
        "chosenKeywords":{
            "5b4457b7e4b0712f42bad646":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c73e4b0a2a06398f8a0":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c62e4b0a2a06398f896":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"]
        },
        "keywordsGameId":47,
        "gameId":"5b4f31c76374f60001d52af9",
        "theText": "",
        "blankKeys":{"8":"you?","15":"the","36":"No.","62":"her?","73":"the","121":"she","180":"tall","254":"her","271":"facial","395":"seen"},
        "commonKeys":["the","you?","No.","her","she","the","seen","facial","her?","tall"],
        "turnUid": "5b4457b7e4b0712f42bad646",
        "turn": 0,
        "sequence": 1,
        "lastTurnStartTime": 1533375680,
        "filledBlanks": {"3":"any","4":"should","5":"to","6":"subject","7":"school","8":"movie","9":"then?"},
        "filledBlankOwners": {"0":"5b445c73e4b0a2a06398f8a0"},
        "rejectedWords": [],
        "rejectionOwners": [],
        "rejectionVotes": [],
    }
}

var reqbody4 = {
    "message":"TimeOutAlarm",
    "userId":"5b4457b7e4b0712f42bad646",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence":"1"
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices":{
            "5b4457b7e4b0712f42bad646":"0",
            "5b445c73e4b0a2a06398f8a0":"1",
            "5b445c62e4b0a2a06398f896":"2"
        },
        "topics":["Food","Voting","Shopping"],
        "topic":"Voting",
        "chosenKeywords":{
            "5b4457b7e4b0712f42bad646":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c73e4b0a2a06398f8a0":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c62e4b0a2a06398f896":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"]
        },
        "keywordsGameId":47,
        "gameId":"5b4f31c76374f60001d52af9",
        "theText": "",
        "blankKeys": {},
        "commonKeys": [],
        "turnUid": "5b4457b7e4b0712f42bad646",
        "turn": 0,
        "sequence": 1,
        "lastTurnStartTime": 1533375680,
        "filledBlanks": {},
        "filledBlankOwners": {},
        "rejectedWords": [],
        "rejectionOwners": [],
        "rejectionVotes": [],
    }
}

var reqbody6 = {
    "message":"RejectWord",
    "userId":"5b445c73e4b0a2a06398f8a0",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence":"1",
        "blankIndex": "3"
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices":{
            "5b4457b7e4b0712f42bad646":"0",
            "5b445c73e4b0a2a06398f8a0":"1",
            "5b445c62e4b0a2a06398f896":"2"
        },
        "topics":["Food","Voting","Shopping"],
        "topic":"Voting",
        "chosenKeywords":{
            "5b4457b7e4b0712f42bad646":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c73e4b0a2a06398f8a0":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c62e4b0a2a06398f896":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"]
        },
        "keywordsGameId":47,
        "gameId":"5b4f31c76374f60001d52af9",
        "theText": "",
        "blankKeys":{"8":"you?","15":"the","36":"No.","62":"her?","73":"the","121":"she","180":"tall","254":"her","271":"facial","395":"seen"},
        "commonKeys":["the","you?","No.","her","she","the","seen","facial","her?","tall"],
        "turnUid": "5b4457b7e4b0712f42bad646",
        "turn": 0,
        "sequence": 1,
        "lastTurnStartTime": 1533375680,
        "filledBlanks": {"3":"any","4":"should","5":"to","6":"subject","7":"school","8":"movie","9":"then?"},
        "filledBlankOwners": {"0":"5b445c73e4b0a2a06398f8a0"},
        "rejectedWords": [],
        "rejectionOwners": [],
        "rejectionVotes": [],
    }
}

var reqbody7 = {
    "message":"rejectVote",
    "userId":"5b445c73e4b0a2a06398f8a0",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence":"1",
        "myVote": "1"
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices":{
            "5b4457b7e4b0712f42bad646":"0",
            "5b445c73e4b0a2a06398f8a0":"1",
            "5b445c62e4b0a2a06398f896":"2"
        },
        "topics":["Food","Voting","Shopping"],
        "topic":"Voting",
        "chosenKeywords":{
            "5b4457b7e4b0712f42bad646":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c73e4b0a2a06398f8a0":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"],
            "5b445c62e4b0a2a06398f896":["president","obama","voting","year","polling","questions","news","new","faith","volunteering"]
        },
        "keywordsGameId":47,
        "gameId":"5b4f31c76374f60001d52af9",
        "theText": "",
        "blankKeys":{"8":"you?","15":"the","36":"No.","62":"her?","73":"the","121":"she","180":"tall","254":"her","271":"facial","395":"seen"},
        "commonKeys":["the","you?","No.","her","she","the","seen","facial","her?","tall"],
        "turnUid": "5b4457b7e4b0712f42bad646",
        "turn": 0,
        "sequence": 1,
        "lastTurnStartTime": 1533375680,
        "filledBlanks": {"3":"any","4":"should","5":"to","6":"subject","7":"school","8":"movie","9":"then?"},
        "filledBlankOwners": {"0":"5b445c73e4b0a2a06398f8a0"},
        "rejectedWords": [[3,"any"]],
        "rejectionOwners": ["5b445c73e4b0a2a06398f8a0"],
        "rejectionVotes": [{"5b4457b7e4b0712f42bad646":1,"5b445c62e4b0a2a06398f896":0}],
    }
}

var formParams = {};
formParams.topic = "Health";
formParams.keywords = '["doctor","problem","blood","appointment","results","emergency","medication","test","insurance","pressure","problems","stomach","professor","stress","antihistamine","sleep","breath","medicine","feeling","good","lately","health","effects","infection","chest","information","prescription","itching","trouble"]';


//this.gameEventController(reqbody7);