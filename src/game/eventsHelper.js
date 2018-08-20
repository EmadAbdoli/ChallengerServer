// For Server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");
var waitUntil = require("./myLibs/wait-until");
var utility = require("./utility");
var eventsHelper = require("./eventsHelper");
var request = require("./myLibs/request");
var keywordsFile = require("./keywords");

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

exports.selectingSubject = function (props, context, userId, userChoice)
//exports.selectingSubject = function (props, userId, userChoice)
{
    let tkeywordsGameId = {val: -1};

    var topicIndex = utility.calcTopic(props.choices);
    props["topic"]=  props.topics[topicIndex];

    var tKeywords = utility.getTopicKeywords(props["topic"], topicIndex);

    utility.sendNewGameRequest(props["topic"], tKeywords, tkeywordsGameId);
    utility.setRoundParticipants(props.gameId, props.topic, props.pids);

    props.sequence = props.sequence + 1;

    if (userChoice == -1) userChoice = topicIndex;

    result = {operation: 'subjectSelected', 
                userId: userId,
                choice: userChoice,
                topic : topicIndex,
                keywords: tKeywords,
                sequence: props.sequence
                };

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

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

exports.gettingTextReady = function (props, context, userId)
//exports.gettingTextReady = function (props, userId)
{
    var keywordsUnion = [];
    for (chKeys in props.chosenKeywords)
    {
        var tUserKeys = props.chosenKeywords[chKeys];

        for (var j = 0; j < tUserKeys.length; j++)
        {
            if (keywordsUnion.includes(tUserKeys[j]) == false)
                keywordsUnion.push(tUserKeys[j]);
        }
    }

    let checker = {val: false, blanksKeys: {}, commonKeys: [], keywordBlankKeys: {}, theText: ""};
    utility.sendGetParagraphsRequest(props.keywordsGameId, keywordsUnion, checker);

    waitUntil()
    .interval(50)
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

        let testChecker = {val: false, preTest: {}, postTest: {}};
        utility.getQuizSentences(keywordsUnion, checker.keywordBlankKeys, testChecker, props.keywordsGameId);

        waitUntil()
        .interval(50)
        .times(Infinity)
        .condition(function() {
            return (testChecker.val == true ? true : false);
        })
        .done(function(temp) {

            props.preTest = testChecker.preTest;
            props.postTest = testChecker.postTest;
            props.blankKeys = checker.blanksKeys;
            props.keywordBlankKeys = checker.keywordBlankKeys;
            props.commonKeys = checker.commonKeys;
            props.theText = checker.theText;

            result = { operation : 'textReady', userId: userId,
                        blanksKeys: blanksKeyArr, keywordBlankKeys: checker.keywordBlankKeys, commonKeys: checker.commonKeys, theText: checker.theText, 
                        preTest: props.preTest, postTest: props.postTest /*turnUid: props.uids[0], sequence: props.sequence*/
                        };

            var tResult = {message: JSON.stringify(result), properties: props};
            // For Local
            //console.log(tResult);
            // For Server
            context.log(tResult);
            context.succeed(tResult);
        });
    });
}

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

exports.saveUserTest = function (userId, userAnswers, gameId, uids, pids, isPreTest)
{
    var pid = utility.getPidFromUid(userId, uids, pids);

    var TestTable;
    if (isPreTest == true)
        TestTable = Backtory.Object.extend("preTest");
    else
        TestTable = Backtory.Object.extend("postTest");

    var Player = Backtory.Object.extend("players");
    var Game = Backtory.Object.extend("games");
    
    var testTable = new TestTable();
    var player = new Player();
    var game = new Game();

    player.set("_id", pid);
    game.set("_id", gameId);

    testTable.set("pid", player);
    testTable.set("gid", game);
    testTable.set("q1", userAnswers[0]);
    testTable.set("q2", userAnswers[1]);
    testTable.set("q3", userAnswers[2]);
    
    testTable.save({
        success: function(testObj) {},
        error: function(error) {}
    });
}

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

exports.findingVotesResult = function (props)
{
    var rejectIndex = props.rejectedWords.length;    
    var votingResult = utility.calcVotingResult(props.rejectionVotes[rejectIndex-1]);
    var wordIndexInBlanks = props.rejectedWords[rejectIndex-1][0];

    props.rejectedWords[rejectIndex-1].push(votingResult);

    var mustBeRejected = false;
    var rejectingWord = props.rejectedWords[rejectIndex-1][1];
    var wordIndexInText = Object.keys(props.blankKeys)[wordIndexInBlanks];
    if (rejectingWord != props.blankKeys[wordIndexInText])
    {
        mustBeRejected = true;
    }

    if (votingResult == 1)
    {
        if (mustBeRejected)
        {
            for (uid in props.rejectionVotes[rejectIndex-1])
            {
                if (props.rejectionVotes[rejectIndex-1][uid] == 1)
                {
                    props.userScores[uid] = props.userScores[uid] + utility.trueRejectScore;
                    props.userJudgedVotes[uid][0] = props.userJudgedVotes[uid][0] + 1;
                }
                else
                {
                    props.userJudgedVotes[uid][1] = props.userJudgedVotes[uid][1] + 1;
                }
            }
        }
        else
        {
            for (uid in props.rejectionVotes[rejectIndex-1])
            {
                if (props.rejectionVotes[rejectIndex-1][uid] == 1)
                {
                    props.userJudgedVotes[uid][1] = props.userJudgedVotes[uid][1] + 1;
                }
                else
                {
                    props.userJudgedVotes[uid][0] = props.userJudgedVotes[uid][0] + 1;
                }
            }
        }

        if (props.filledBlanks != undefined && props.filledBlanks[wordIndexInBlanks] != undefined)
            delete props.filledBlanks[wordIndexInBlanks];

        if (props.filledBlankOwners != undefined && props.filledBlankOwners[wordIndexInBlanks] != undefined)
            delete props.filledBlankOwners[wordIndexInBlanks];

        if (props.filledBlankSeqs!= undefined && props.filledBlankSeqs[wordIndexInBlanks] != undefined)
            delete props.filledBlankSeqs[wordIndexInBlanks];

        if (props.filledBlankStates != undefined && props.filledBlankStates[wordIndexInBlanks] != undefined)
            delete props.filledBlankStates[wordIndexInBlanks];
            
        if (props.filledBlanksShare != undefined && props.filledBlanksShare[wordIndexInBlanks] != undefined)
            delete props.filledBlanksShare[wordIndexInBlanks];
    }
    else
    {
        if (mustBeRejected == false)
        {
            var stockHolders = [];
            
            for (uid in props.rejectionVotes[rejectIndex-1])
            {
                if (props.rejectionVotes[rejectIndex-1][uid] == 0)
                {
                    stockHolders.push(uid);
                    props.userJudgedVotes[uid][0] = props.userJudgedVotes[uid][0] + 1;
                }
                else
                {
                    props.userJudgedVotes[uid][1] = props.userJudgedVotes[uid][1] + 1;
                }
            }
            props.filledBlanksShare[wordIndexInBlanks] = stockHolders;
        }
        else // votingResult = 0 && mustBeRejected = true
        {
            for (uid in props.rejectionVotes[rejectIndex-1])
            {
                if (props.rejectionVotes[rejectIndex-1][uid] == 1)
                {
                    props.userJudgedVotes[uid][0] = props.userJudgedVotes[uid][0] + 1;
                }
                else
                {
                    props.userJudgedVotes[uid][1] = props.userJudgedVotes[uid][1] + 1;
                }
            }
        }
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
                filledBlanks: props.filledBlanks,
                userScores: props.userScores
                };

    return result;
}

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

exports.checkTrueWords = function (props, isEndOfGame)
{
    for (bSeqIndex in props.filledBlankSeqs)
    {
        if (props.filledBlankStates[bSeqIndex] == 0)
        {
            if (isEndOfGame == true || props.filledBlankSeqs[bSeqIndex] <= props.sequence - utility.sequencesToCheckTrueWord)
            {
                var blankRealWord = props.filledBlanks[bSeqIndex];

                var tempKeys = Object.keys(props.blankKeys);
                var key = tempKeys[bSeqIndex];
                var blankTrueWord = props.blankKeys[key]; // maybe it is not true....!
                
                if (blankRealWord == blankTrueWord)
                {
                    props.filledBlankStates[bSeqIndex] = 1;

                    for (fbsIndex in props.filledBlanksShare)
                    {
                        if (fbsIndex == bSeqIndex)
                        {
                            var userIds = props.filledBlanksShare[fbsIndex];
                            for (uuid in userIds)
                            {
                                var index = userIds[uuid];
                                props.userScores[index] = props.userScores[index] + utility.trueWordScore;
                            }
                        }
                    }
                }
            }
        }
    }
}

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

exports.isGameFinishState = function (props)
{
    var d = new Date();
    var seconds = Math.round(d.getTime() / 1000);
    
    var finishCheck = eventsHelper.allBlanksFilledCorrect(props);
    
    if (finishCheck == true || (seconds - props.startTime) >= (utility.gameTime))
    {
        return true;
    }
    else
        return false;
}

exports.allBlanksFilledCorrect = function (props)
{
    if (Object.keys(props.filledBlanks).length == Object.keys(props.blankKeys).length)
    {
        var filledBlankKeys = Object.keys(props.filledBlanks);
        var trueBlankKeys = Object.keys(props.blankKeys);

        for (var i = 0; i < filledBlankKeys.length; i++)
        {
            if (props.filledBlanks[filledBlankKeys[i]] != props.blankKeys[trueBlankKeys[i]]) return false;
        }
        
        return true;
    }

    return false;
}

exports.doFinishingTasks = function (props, userId)
{
    eventsHelper.checkTrueWords(props, true);

    //utility.giveUserPrizes(props);

    var d = new Date();
    var seconds = Math.round(d.getTime() / 1000);

    props.sequence = props.sequence + 2;
    props.lastTurnStartTime = seconds;

    result = { operation : 'GameFinished',
                userId: userId,
                sequence: props.sequence,
                filledBlanks: props.filledBlanks,
                userScores: props.userScores,
                userActions: props.userActions,
                blankStates: props.filledBlankStates,
                userPosts: props.userPostCounts,
                userRejects: props.userRejectCounts,
                userJudgedVotes: props.userJudgedVotes
            };

    return result;
}

//********************************************************************************************************** */
//********************************************************************************************************** */
//********************************************************************************************************** */

var uids = ["5b445c73e4b0a2a06398f8a0","5b6c290ce4b09aa3e74c8c30","5b547ff7e4b0712f42c49855"];
var pids = ["5b445c735ce7180001bfaf7c","5b6c290d0b088c0001d39de2","5b547ff8b291a40001e53f28"];
var useId = "5b445c73e4b0a2a06398f8a0";
var gamId = "5b6eac240b088c00014c70cf";
var userAnswers = [1,2,-1];

//eventsHelper.saveUserPreTest(useId, userAnswers, gamId, uids, pids);