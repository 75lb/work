var util = require("util"),
    Job = require("..").Job;

var job = new Job({ name: "main", commandSync: String });
var job1 = new Job({ name: "one", commandSync: String });
var job2 = new Job({ name: "two", commandSync: String });
var onechild1 = new Job({ name: "one child 1", commandSync: String});
var onechild2 = new Job({ name: "one child 2", commandSync: String});
var twochild1 = new Job({ name: "two child 1", commandSync: String});
var twochild2 = new Job({ name: "two child 2", commandSync: String});

function log(job){
    console.log(job.name);
}
job1.add(onechild1);
job1.add(onechild2);
job2.add(twochild1);
job2.add(twochild2);
job.add(job1);
job.add(job2);

job.on("monitor", function(job, eventName){
    console.log("%s, %s", job.name, eventName);
}).run();

// job.monitor(process.stdout).run();
