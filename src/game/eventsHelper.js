// For Server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");
var waitUntil = require("./myLibs/wait-until");
var utility = require("./utility");
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

        props.blankKeys = checker.blanksKeys;
        props.commonKeys = checker.commonKeys;
        props.theText = checker.theText;

        var d = new Date();
        var seconds = Math.round(d.getTime() / 1000);
        
        props.lastTurnStartTime = seconds;
        props.turnUid = props.uids[0];
        props.turn = 0;
        props.sequence = props.sequence + 1;

        result = { operation : 'textReady', userId: userId,
                    blanksKeys: blanksKeyArr, commonKeys: checker.commonKeys, theText: checker.theText,
                    turnUid: props.uids[0], sequence: props.sequence
                    };

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

exports.findingVotesResult = function (props)
{
    var rejectIndex = props.rejectedWords.length;    
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

    return result;
}