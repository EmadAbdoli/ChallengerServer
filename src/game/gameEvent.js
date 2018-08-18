var utility = require("./utility");
var waitUntil = require("./myLibs/wait-until");
var eventsHelper = require("./eventsHelper");

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
                    
                    eventsHelper.selectingSubject(props, context, userId, requestBody.data.choice);
                    //eventsHelper.selectingSubject(props, userId, requestBody.data.choice);
                }
                else
                {
                    result = {operation : 'subjectSelection', userId: userId, choice: requestBody.data.choice};
                }
            }            

            break;

        /************************************************************************************ */
        /************************************************************************************ */

        case "subjectSelectionTimeout":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                dontsendResult = true;
                eventsHelper.selectingSubject(props, context, userId, -1);
                //eventsHelper.selectingSubject(props, userId, -1);
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
                    eventsHelper.gettingTextReady(props, context, userId);
                    //eventsHelper.gettingTextReady(props, userId);
                }
                else
                {
                    result = { operation : 'selectedKeywords', userId: userId};
                }
            }
        break;

        /************************************************************************************ */
        /************************************************************************************ */

        case "KeywordSelTimeout":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                dontsendResult = true;
                eventsHelper.gettingTextReady(props, context, userId);
                //eventsHelper.gettingTextReady(props, userId);
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

                    eventsHelper.checkTrueWords(props, false);

                    var d = new Date();
                    var seconds = Math.round(d.getTime() / 1000);
                    props.lastTurnStartTime = seconds;

                    result = { operation : 'nextTrun',
                               userId: userId,
                               turnUid: props.turnUid,
                               sequence: props.sequence,
                               userScore: props.userScores,
                               blankStates: props.filledBlankStates
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

                eventsHelper.checkTrueWords(props, false);

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
                               sequence: props.sequence,
                               userScore: props.userScores,
                               blankStates: props.filledBlankStates
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
                        props.filledBlankSeqs[blanktoFillIndex] = props.sequence;
                        props.filledBlankStates[blanktoFillIndex] = 0;

                        props.userPostCounts[userId] = props.userPostCounts[userId] + 1;
                        props.userScores[userId] = props.userScores[userId] + utility.putwordScore;
                        props.userActions[userId] = props.userActions[userId] + 1;

                        if (eventsHelper.isGameFinishState(props))
                        {
                            result = eventsHelper.doFinishingTasks(props, userId);
                        }
                        else
                        {
                            eventsHelper.checkTrueWords(props, false);

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
                                        filledBlanks: props.filledBlanks,
                                        userScores: props.userScores,
                                        userActions: props.userActions,
                                        blankStates: props.filledBlankStates
                            };
                        }
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
                        if (props.filledBlankStates[blankToRejectIndex] == 1)
                        {
                            result = {operation: 'blankIsFinalized',
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

                            eventsHelper.checkTrueWords(props, false);

                            props.userRejectCounts[userId] = props.userRejectCounts[userId] + 1;
                            props.userScores[userId] = props.userScores[userId] + utility.rejectWordScore;
                            props.userActions[userId] = props.userActions[userId] + 1;

                            var d = new Date();
                            var seconds = Math.round(d.getTime() / 1000);

                            props.sequence = props.sequence + 1;
                            props.lastTurnStartTime = seconds;

                            result = { operation : 'voteActive',
                                        userId: userId,
                                        rejectIndex: blankToRejectIndex,
                                        turnUid: props.turnUid,
                                        sequence: props.sequence,
                                        filledBlanks: props.filledBlanks,
                                        userScores: props.userScores,
                                        userActions: props.userActions,
                                        blankStates: props.filledBlankStates
                                    };
                        }
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
                    result = eventsHelper.findingVotesResult(props);
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

        /************************************************************************************ */
        /************************************************************************************ */

        case "voteForRejectTimeout":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                result = eventsHelper.findingVotesResult(props);
            }

        break;

        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */
        /************************************************************************************ */

        case "theEnd":

            var tempSeq = props.sequence;
            var requestSeq = JSON.parse(requestBody.data.sequence);

            if (requestSeq != tempSeq)
            {
                result = {operation: 'invalidOperation3', userId: userId};
            }
            else
            {
                if (eventsHelper.isGameFinishState(props))
                {
                    result = eventsHelper.doFinishingTasks(props, userId);
                }
                else
                {
                    result = {operation: 'invalidGameEnd', userId: userId};
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
    "userId" : "5b445c73e4b0a2a06398f8a0",
    "properties": {
        "uids":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30","5b547ff7e4b0712f42c49855"],
        "pids":["5b445c735ce7180001bfaf7c","5b6c290d0b088c0001d39de2","5b547ff8b291a40001e53f28"],
        "userScores":{"5b445c73e4b0a2a06398f8a0":0,"5b6c290ce4b09aa3e74c8c30":0,"5b547ff7e4b0712f42c49855":0},
        "userActions":{"5b445c73e4b0a2a06398f8a0":0,"5b6c290ce4b09aa3e74c8c30":0,"5b547ff7e4b0712f42c49855":0},
        "choices":{"5b547ff7e4b0712f42c49855":"0","5b6c290ce4b09aa3e74c8c30":"2"},
        "topics":["Health","College Life","Shopping"],"topic":"Shopping",
        "chosenKeywords":{},
        "keywordsGameId":196,
        "gameId":"5b6eac240b088c00014c70cf",
        "startTime":1533979738,
        "theText":"",
        "blankKeys":{}
        ,"commonKeys":[],
        "turnUid":"",
        "turn":2,
        "sequence":1,
        "lastTurnStartTime":1533980043,
        "filledBlanks":{},
        "filledBlanksShare":{},
        "filledBlankOwners":{},
        "filledBlankSeqs":{},
        "filledBlankStates":{},
        "rejectedWords":[],
        "rejectionOwners":[],
        "choices": {1:1,2:1},
        "topics": ["Selling a House","At the Bank","Health"],
        "topic" : "",
        "chosenKeywords": {},
        "keywordsGameId" : "",
        "gameId" : "5b4dde7d0f747e00014d84e9"
    },
    "data" :{
        "choice": 0,
        "sequence": 1,
        "topics": '["Selling a House","At the Bank","Health"]',
    },
    "clientRequestId": "26e7379d-f2e6-46d3-be78-3f300345517e"
}

var reqbody3 = {
    "message":"selectedKeywords",
    "userId":"5b445c62e4b0a2a06398f896",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence": 1,
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
        "keywordBlankKeys": {},
        "commonKeys": [],
        "turnUid": -1,
        "turn": -1,
        "sequence": 1,
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
        "sequence":"12",
        "blankIndex": "2",
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
        "sequence": 12,
        "lastTurnStartTime": 1533375680,
        "filledBlanks": {"0":"you?","1":"the","2":"No.","4":"the","5":"she","6":"tall","7":"her","8":"facial","9":"seen"},
        "filledBlankOwners": {"0":"5b445c73e4b0a2a06398f8a0"},
        "filledBlankStates": {"3":"0","4":"0","5":"0","6":"0","7":"0","8":"0","9":"0"},
        "filledBlanksShare":{"3":["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0"],"9":["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0"]},
        "filledBlankSeqs":{"3":"11","4":"2","5":"10","6":"8","7":"6","8":"5","9":"1"},
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
    "message":"voteForRejectTimeout",
    "userId":"5b445c73e4b0a2a06398f8a0",
    "challengeId":"5b4f31c7e4b0115f590dda9d",
    "data":{
        "sequence":"1",
    },
    "properties":{
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "userScores": {"5b4457b7e4b0712f42bad646":10,"5b445c73e4b0a2a06398f8a0":15,"5b445c62e4b0a2a06398f896":10},
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

var request8 = 
{
    "message": "subjectSelectionTimeout",
    "userId" : "4",
    "properties": {
        "uids": ["5b4457b7e4b0712f42bad646","5b445c73e4b0a2a06398f8a0","5b445c62e4b0a2a06398f896"],
        "pids": ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"],
        "choices": {1:1,2:1},
        "topics": ["Selling a House","At the Bank","Health"],
        "topic" : "",
        "sequence": 1,
        "chosenKeywords": {},
        "keywordsGameId" : "",
        "gameId" : "5b4dde7d0f747e00014d84e9"
    },
    "data" :{
        "sequence": 1
    },
    "clientRequestId": "26e7379d-f2e6-46d3-be78-3f300345517e"
}

var newRequest = 
{
    "message":"PassTurn",
    "userId":"5b445c73e4b0a2a06398f8a0",
    "challengeId":"5b6cabd8e4b0a48bfe84f10e",
    "data":{"sequence":"12"},
    "properties":
    {
        "uids":["5b6c290ce4b09aa3e74c8c30","5b445c73e4b0a2a06398f8a0","5b547ff7e4b0712f42c49855"],
        "pids":["5b6c290d0b088c0001d39de2","5b445c735ce7180001bfaf7c","5b547ff8b291a40001e53f28"],
        "userScores":{"5b6c290ce4b09aa3e74c8c30":20,"5b445c73e4b0a2a06398f8a0":20,"5b547ff7e4b0712f42c49855":20},
        "userActions":{"5b6c290ce4b09aa3e74c8c30":2,"5b445c73e4b0a2a06398f8a0":2,"5b547ff7e4b0712f42c49855":2},
        "choices":{"5b547ff7e4b0712f42c49855":"0","5b445c73e4b0a2a06398f8a0":"2","5b6c290ce4b09aa3e74c8c30":"1"},
        "topics":["Driving","Food","Small Talk"],"topic":"Small Talk",
        "chosenKeywords":{"5b6c290ce4b09aa3e74c8c30":["next","music","movie","today","family","friend","weather","apologize","invitation","instruments"],"5b445c73e4b0a2a06398f8a0":["music","sorry","friend","thanks","weather","question","apologize","invitation","assignments","instruments"],"5b547ff7e4b0712f42c49855":["next","phone","music","sorry","right","movie","party","invitation","assignments","instruments"]},
        "keywordsGameId":189,"gameId":"5b6cabd80e66e7000168a69f",
        "theText":"A: Don't %BLANK% think %BLANK% nice out? B: Yes, %BLANK% think so %BLANK% A: %BLANK% think that it's going to %BLANK%. B: I hope that it does rain. A: You like the rain? B: The sky looks so clean %BLANK% it rains. I love it. A: I understand. Rain does make it smell cleaner. B: I love most how it is %BLANK% night after it rains. A: How come? B: You can see the stars so much more clearly after it rains. A: I %BLANK% love for it to rain %BLANK%. B: I would too.",
        "blankKeys":{"8":"you","19":"it's","44":"I","62":"too.","72":"I","97":"rain","174":"after","275":"at","397":"would","404":"today"},
        "commonKeys":["it's","at","after","I","rain","would","too.","I","you"],
        "turnUid":"5b445c73e4b0a2a06398f8a0","turn":1,"sequence":12,"lastTurnStartTime":1533848696,
        "filledBlanks":{"0":"you","1":"rain","4":"I","5":"rain"},
        "filledBlanksShare":{"0":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30"],"5":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30"]},
        "filledBlankOwners":{"0":"5b6c290ce4b09aa3e74c8c30","1":"5b445c73e4b0a2a06398f8a0","4":"5b6c290ce4b09aa3e74c8c30","5":"5b445c73e4b0a2a06398f8a0"},
        "filledBlankSeqs":{"0":3,"1":4,"4":7,"5":8},
        "filledBlankStates":{"0":0,"1":0,"4":0,"5":0},
        "rejectedWords":[[0,"you",0],[5,"rain",0]],
        "rejectionOwners":["5b547ff7e4b0712f42c49855","5b547ff7e4b0712f42c49855"],
        "rejectionVotes":[{"5b547ff7e4b0712f42c49855":1,"5b445c73e4b0a2a06398f8a0":0,"5b6c290ce4b09aa3e74c8c30":0},{"5b547ff7e4b0712f42c49855":1,"5b445c73e4b0a2a06398f8a0":0,"5b6c290ce4b09aa3e74c8c30":0}]
    }
}

var newReq2 = 
{
    "message":"theEnd",
    "userId":"5b6c290ce4b09aa3e74c8c30",
    "challengeId":"5b6eac24e4b057f917381a35",
    "data":{"sequence":"31"},
    "properties":
    {
        "uids":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30","5b547ff7e4b0712f42c49855"],
        "pids":["5b445c735ce7180001bfaf7c","5b6c290d0b088c0001d39de2","5b547ff8b291a40001e53f28"],
        "userScores":{"5b445c73e4b0a2a06398f8a0":90,"5b6c290ce4b09aa3e74c8c30":75,"5b547ff7e4b0712f42c49855":70},
        "userActions":{"5b445c73e4b0a2a06398f8a0":6,"5b6c290ce4b09aa3e74c8c30":6,"5b547ff7e4b0712f42c49855":4},
        "choices":{"5b547ff7e4b0712f42c49855":"0","5b445c73e4b0a2a06398f8a0":"2","5b6c290ce4b09aa3e74c8c30":"2"},
        "topics":["Health","College Life","Shopping"],"topic":"Shopping",
        "chosenKeywords":{"5b6c290ce4b09aa3e74c8c30":["idea","today","choice","thanks","credit","section","popular","outlets","receipt","customer"],"5b445c73e4b0a2a06398f8a0":["gift","idea","today","choice","section","popular","outlets","receipt","discount","customer"],"5b547ff7e4b0712f42c49855":["gift","idea","size","outlet","thanks","credit","section","discount","customer","difference"]},
        "keywordsGameId":196,"gameId":"5b6eac240b088c00014c70cf",
        "startTime":1533979738,
        "theText":"A: My wife's birthday is %BLANK%. I need some flowers. B: We have lots of fresh red %BLANK% A: How much do the %BLANK% cost? B: $20 a dozen. A: That sounds good. Last %BLANK% I paid $30. B: Yes, you came here %BLANK% the right day. They're on %BLANK% %BLANK% A: Give me a dozen. B: Very good. %BLANK% you like %BLANK% else? A: No, I'll just %BLANK% her the roses and a card. B: She should be very pleased with these roses.",
        "blankKeys":{"25":"today","84":"roses.","111":"roses","165":"year","206":"on","232":"sale","249":"today.","290":"Would","296":"anything","328":"give"}
        ,"commonKeys":["sale","anything","roses.","give","year","on","Would","today.","roses"],
        "turnUid":"5b547ff7e4b0712f42c49855",
        "turn":2,
        "sequence":31,
        "lastTurnStartTime":1533980043,
        "filledBlanks":{"0":"today","1":"roses.","2":"roses","3":"year","4":"on","5":"sale","6":"today.","7":"Would","8":"anything","9":"give"},
        "filledBlanksShare":{},
        "filledBlankOwners":{"0":"5b445c73e4b0a2a06398f8a0","1":"5b6c290ce4b09aa3e74c8c30","2":"5b547ff7e4b0712f42c49855","3":"5b445c73e4b0a2a06398f8a0","4":"5b547ff7e4b0712f42c49855","5":"5b445c73e4b0a2a06398f8a0","6":"5b6c290ce4b09aa3e74c8c30","7":"5b547ff7e4b0712f42c49855","8":"5b445c73e4b0a2a06398f8a0","9":"5b6c290ce4b09aa3e74c8c30"},
        "filledBlankSeqs":{"0":3,"1":4,"2":5,"3":6,"4":8,"5":24,"6":25,"7":11,"8":12,"9":17},
        "filledBlankStates":{"0":1,"1":1,"2":1,"3":1,"4":1,"5":0,"6":0,"7":1,"8":1,"9":1},
        "rejectedWords":[[9,"give",1],[5,"on",1],[6,"sale",1]],
        "rejectionOwners":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30","5b547ff7e4b0712f42c49855"],"rejectionVotes":[{"5b445c73e4b0a2a06398f8a0":1,"5b6c290ce4b09aa3e74c8c30":1,"5b547ff7e4b0712f42c49855":1},{"5b6c290ce4b09aa3e74c8c30":1,"5b547ff7e4b0712f42c49855":1,"5b445c73e4b0a2a06398f8a0":1},{"5b445c73e4b0a2a06398f8a0":1,"5b547ff7e4b0712f42c49855":1,"5b6c290ce4b09aa3e74c8c30":0}]
    }
}

var req1 = {
    "message":"PutWord",
    "userId":"5b445c73e4b0a2a06398f8a0",
    "challengeId":"5b73b979e4b0d99b00f16bb4",
    "data":{
        "sequence":"24",
        "blankIndex":"9",
        "wordToPut":"\"in\""},
    "properties":{
        "uids":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30","5b547ff7e4b0712f42c49855"],
        "pids":["5b445c735ce7180001bfaf7c","5b6c290d0b088c0001d39de2","5b547ff8b291a40001e53f28"],
        "matchName":"GameMatching1",
        "userScores":{"5b445c73e4b0a2a06398f8a0":70,"5b6c290ce4b09aa3e74c8c30":90,"5b547ff7e4b0712f42c49855":95},
        "userActions":{"5b445c73e4b0a2a06398f8a0":4,"5b6c290ce4b09aa3e74c8c30":6,"5b547ff7e4b0712f42c49855":5},
        "choices":{"5b547ff7e4b0712f42c49855":"0","5b6c290ce4b09aa3e74c8c30":"0","5b445c73e4b0a2a06398f8a0":"1"},
        "topics":["Driving","Shopping","College Life"],
        "topic":"Driving","chosenKeywords":{"5b547ff7e4b0712f42c49855":["space","police","campus","warning","learner","license","accident","apartment","insurance","appointment"]},
        "keywordsGameId":216,"gameId":"5b73b9790bc5b6000132237a","startTime":1534310835,
        "theText":"A: So how did %BLANK% do on my %BLANK% test? B: %BLANK% %BLANK% want the %BLANK% A: Of course, I do. B: Well, you really didn't do all that well. A: How bad did I do? B: To be %BLANK% honest, you %BLANK% your test. A: How? B: There %BLANK% a number of reasons. A: What were they? B: %BLANK% you just can't drive. A: Can I have another try? B: You can take it %BLANK% a couple weeks.",
        "blankKeys":{"13":"I","31":"driving","41":"Do","55":"you","69":"truth?","160":"completely","185":"failed","220":"were","266":"Basically,","344":"in"},
        "commonKeys":["in","Basically,","completely","Do","were","failed","I","truth?","you","driving"],
        "turnUid":"5b445c73e4b0a2a06398f8a0","turn":0,
        "sequence":24,
        "lastTurnStartTime":1534311067,
        "filledBlanks":{"0":"I","1":"driving","2":"Do","3":"you","4":"truth?","5":"completely","6":"failed","7":"were","8":"Basically,"},
        "filledBlanksShare":{},
        "filledBlankOwners":{"0":"5b547ff7e4b0712f42c49855","1":"5b547ff7e4b0712f42c49855","2":"5b547ff7e4b0712f42c49855","3":"5b445c73e4b0a2a06398f8a0","4":"5b445c73e4b0a2a06398f8a0","5":"5b6c290ce4b09aa3e74c8c30","6":"5b547ff7e4b0712f42c49855","7":"5b6c290ce4b09aa3e74c8c30","8":"5b547ff7e4b0712f42c49855"},
        "filledBlankSeqs":{"0":20,"1":5,"2":16,"3":17,"4":21,"5":10,"6":11,"7":22,"8":23},
        "filledBlankStates":{"0":0,"1":1,"2":1,"3":1,"4":0,"5":1,"6":1,"7":0,"8":0},
        "rejectedWords":[[3,"Basically,",1],[2,"I",1],[0,"you",1]],
        "rejectionOwners":["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30","5b6c290ce4b09aa3e74c8c30"],
        "rejectionVotes":[{"5b445c73e4b0a2a06398f8a0":1,"5b547ff7e4b0712f42c49855":1,"5b6c290ce4b09aa3e74c8c30":0},{"5b6c290ce4b09aa3e74c8c30":1,"5b547ff7e4b0712f42c49855":1,"5b445c73e4b0a2a06398f8a0":1},{"5b6c290ce4b09aa3e74c8c30":1,"5b547ff7e4b0712f42c49855":1,"5b445c73e4b0a2a06398f8a0":0}],
        "userPostCounts":{"5b445c73e4b0a2a06398f8a0":3,"5b6c290ce4b09aa3e74c8c30":4,"5b547ff7e4b0712f42c49855":5},
        "userRejectCounts":{"5b445c73e4b0a2a06398f8a0":1,"5b6c290ce4b09aa3e74c8c30":2,"5b547ff7e4b0712f42c49855":0},
        "userJudgedVotes":{"5b445c73e4b0a2a06398f8a0":[2,1],"5b6c290ce4b09aa3e74c8c30":[2,1],"5b547ff7e4b0712f42c49855":[3,0]}
    }
}

var formParams = {};
formParams.topic = "Health";
formParams.keywords = '["doctor","problem","blood","appointment","results","emergency","medication","test","insurance","pressure","problems","stomach","professor","stress","antihistamine","sleep","breath","medicine","feeling","good","lately","health","effects","infection","chest","information","prescription","itching","trouble"]';


//this.gameEventController(reqbody3);