// For Server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");
var waitUntil = require("./myLibs/wait-until");
var utility = require("./utility");
var request = require("./myLibs/request");
var keywordsFile = require("./keywords");

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