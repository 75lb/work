var util = require("util"),
    Job = require("..").Job;

function someCommand(fail){
    return function(){
        if (fail){
            throw new Error("BROKE");
        }
    };
}
function whiteSpace(length){
    for(var i=0, padding = ""; i<length; i++){
        padding += " ";
    }
    return padding;
}

var job = new Job({ name: "main", commandSync: someCommand() });
var job1 = new Job({ name: "one", commandSync: someCommand() });
var job2 = new Job({ name: "two", commandSync: someCommand() });
var onechild1 = new Job({ name: "one child 1", runOn: "fail", commandSync: someCommand()});
var onechild2 = new Job({ name: "one child 2", commandSync: someCommand()});
var twochild1 = new Job({ name: "two child 1", commandSync: someCommand()});
var twochild2 = new Job({ name: "two child 2", commandSync: someCommand()});

job1.add(onechild1);
job1.add(onechild2);
job2.add(twochild1);
job2.add(twochild2);
job.add(job1);
job.add(job2);

job.on("monitor", function(job, eventName, data){
    console.log("%s%s, %s, %s, %s", whiteSpace(job.getDepth()), job.name, eventName, job.state, JSON.stringify(data) || "");
}).print().run();

// job.monitor(process.stdout).run();
