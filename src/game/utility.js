// For Server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");
var waitUntil = require("./myLibs/wait-until");
var request = require("./myLibs/request");
var keywordsFile = require("./keywords");

/********************************************************************************** */
/********************************************************************************** */

var randomKeywordCounts = 20;

exports.playerCounts = 3;
var pCounts = 3;

/********************************************************************************** */
/********************************************************************************** */

var gameTypesIds = 
{
    "1" : "5ae58c6f77e6b100010d11c5",
    "2" : "5ae58c21790c0c0001d2387b"
}

/********************************************************************************** */
/********************************************************************************** */

exports.getRandomInt = function (max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/********************************************************************************** */
/********************************************************************************** */

exports.gameTypeIdFinder = function(matchName)
{
    var arr = matchName.split("Matching");
    return arr[1];
}

/********************************************************************************** */
/********************************************************************************** */

exports.getUserPid = function(participant)
{
    var metastring = participant.metaData;
    var myMetadata = JSON.parse(metastring);

    return myMetadata[1];
}

/********************************************************************************** */
/********************************************************************************** */

exports.calcTopic = function (choices) // Designed for 3 Topics
{
    var res = [0,0,0];
    for (var uid in choices)
    {
        res[choices[uid]] = res[choices[uid]] + 1;
    }

    var result = 0;
    if(res[1] > res[0]) result = 1;
    if(res[1] == res[0]) result = this.getRandomInt(2);
    if(res[2] > res[result]) result = 2;
    if(res[2] == res[result]) 
    {
        if (this.getRandomInt(2) == 0)
            result = 2;
    }

    return result;
}

/********************************************************************************** */
/********************************************************************************** */

exports.setGameRelations = function(gid, participants, checker)
{
    var Game = Backtory.Object.extend("games");
    var game = new Game();
    var gamePlayerRelation = game.relation("players");
    game.set("_id", gid);

    var Player = Backtory.Object.extend("players");
    for(var i = 0; i < participants.length; i++)
    {
        var tempPlayer = new Player();
        var pid = this.getUserPid(participants[i]);

        tempPlayer.set("_id", pid);
        gamePlayerRelation.add(tempPlayer);
    }

    game.save({
        success:function(game)
        {
            checker.gameRel = true;
        }
    });
}

/********************************************************************************** */
/********************************************************************************** */

exports.setGameTypeRelations = function(game, gameTypeId, matchId, checker)
{
    var GameType = Backtory.Object.extend("gameType");

    var myGameType = new GameType();
    myGameType.set("_id", gameTypesIds[gameTypeId]);
    var gamesRelation = myGameType.relation("games");
    gamesRelation.add(game);

    myGameType.save({
        success:function(gameType)
        {
            game.set("gameType", gameType);
            game.set("tableValue", 1);
            game.set("challengeId",matchId);

            game.save();

            checker.gameTypeRel = true;
        }
    });
}

/********************************************************************************** */
/********************************************************************************** */

exports.setPlayersRelations = function(gid, participants)
{
    var Game = Backtory.Object.extend("games");
    var Player = Backtory.Object.extend("players");
    
    var game = new Game();
    game.set("_id", gid);

    for(var i = 0; i < participants.length; i++)
    {
        var tempPlayer = new Player();
        var pid = this.getUserPid(participants[i]);

        tempPlayer.set("_id", pid);
        var pGames = tempPlayer.relation("games");
        pGames.add(game);
        tempPlayer.save({
            success:function(tempPlayer){}
        });        
    }
}

/********************************************************************************** */
/********************************************************************************** */

exports.getTopicKeywords = function(topic)
{
    var topicKeywordDict = {};
    topicKeywordDict["Travel"] = keywordsFile.Travel;
    topicKeywordDict["College Life"] = keywordsFile.CollegeLife;
    topicKeywordDict["Employment"] = keywordsFile.Employment;
    topicKeywordDict["Voting"] = keywordsFile.Voting;
    topicKeywordDict["Small Talk"] = keywordsFile.SmallTalk;
    topicKeywordDict["Driving"] = keywordsFile.Driving;
    topicKeywordDict["At the Bank"] = keywordsFile.AtTheBank;
    topicKeywordDict["Health"] = keywordsFile.Health;
    topicKeywordDict["Crime"] = keywordsFile.Crime;
    topicKeywordDict["Shopping"] = keywordsFile.Shopping;
    topicKeywordDict["Food"] = keywordsFile.Food;

    var tKeys = topicKeywordDict[topic];

    // get 20 random keyword...
    var randomKeywords = {};

    for (var i = 0; i < randomKeywordCounts; i++)
    {
        var rand = this.getRandomInt(tKeys.length);

        if ((rand in randomKeywords) == false)
            randomKeywords[rand] = tKeys[rand];
        else
            i--;
    }

    var result = [];
    for (var index in randomKeywords)
    {
        result.push(randomKeywords[index]);
    }

    return result;
}

/********************************************************************************** */
/********************************************************************************** */

exports.setgameKeywordsId = function(gameId, keywordsGameId)
{
    var Game = Backtory.Object.extend("games");
    var game = new Game();
    game.set("_id", gameId);
    game.set("keywordsGameId", keywordsGameId.toString());

    game.save({
        success:function(tempGame){}
    });
}

/********************************************************************************** */
/********************************************************************************** */

exports.sendRequest = function(reqType, formParams, tkeywordsGameId)
{
    request({
        url: "http://216.158.80.50/text_parser/" + reqType,
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        method: "POST",
        form: formParams,
    }, function (error, response, body){
        
        if (error == null)
        {
            switch (reqType) {
                case "new_game":

                    var myBody = JSON.parse(body);
                    tkeywordsGameId.val = myBody.game_id;

                    break;
            
                default:
                    break;
            }

        }
        else
        {
            return null;
        }
    });
}

/********************************************************************************** */
/********************************************************************************** */

exports.setRoundParticipants = function(gameId, topic, pids)
{
    var Round = Backtory.Object.extend("rounds");
    var Game = Backtory.Object.extend("games");
    var Player = Backtory.Object.extend("players");
    var Participants = Backtory.Object.extend("participants");
    
    var partiIds = [];
    let counter = {val: 0};
    var rid = {val: 0};

    var game = new Game();
    game.set("_id", gameId);

    var round = new Round();
    round.set("topic", topic);
    round.set("game", game);

    round.save({
        success:function(tRound)
        {
            rid.val = tRound.get("_id");

            for (var i = 0; i < pCounts; i++)
            {
                var tempParti = new Participants();
                var tempPlayer = new Player();
                tempPlayer.set("_id",pids[i]);

                tempParti.set("player",tempPlayer);
                tempParti.set("round", tRound);

                tempParti.save({
                    success:function(parti)
                    {
                        partiIds.push(parti.get("_id"));
                        counter.val = counter.val + 1;
                    }
                });
            }
        }
    });

    waitUntil()
        .interval(100)
        .times(Infinity)
        .condition(function() {
            return (counter.val == pCounts ? true : false);
        })
        .done(function(temp) {

            var newRound = new Round();
            var roundPartiRelation = newRound.relation("participants");
            newRound.set("_id",rid.val);

            for (var i = 0; i < pCounts; i++)
            {
                var tempParti = new Participants();
                tempParti.set("_id", partiIds[i]);
                roundPartiRelation.add(tempParti);
            }

            newRound.save({
                success:function(alaki){}
            });


        });
}

//var pids = ["5b4457b74f83de0001e9bd59","5b445c735ce7180001bfaf7c","5b445c624f83de0001e9d101"];

//this.setRoundParticipants("5b4f5bb6b291a40001c7ef1b","Driving",pids);