var SyncJob = require("./lib/SyncJob");
var AsyncJob = require("./lib/AsyncJob");
var l = console.log;
var a = new SyncJob({ name: "repl" });
var b = new SyncJob({ name: "repl" });

function command(){
    setTimeout(function(){
        throw new Error("broken");
    }, 10);
}

try{
    command();
    l("OK");
} catch(err){
    l("ERROR");
    l(err);
}