// For Server
var Backtory = require("backtory-sdk");
// For Local
//var Backtory = require("./../../api/node_modules/backtory-sdk");

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
    if(res[1] == res[0]) result = utility.getRandomInt(2);
    if(res[2] > res[result]) result = 2;
    if(res[2] == res[result]) 
    {
        if (utility.getRandomInt(2) == 0)
            result = 2;
    }

    return result;
}

/********************************************************************************** */
/********************************************************************************** */

exports.setGameRelations = function(gid, participants)
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
        success:function(game){}
    });
}

/********************************************************************************** */
/********************************************************************************** */

exports.setGameTypeRelations = function(game, gameTypeId, matchId)
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

    console.log("players' games saved");
}

/********************************************************************************** */
/********************************************************************************** */