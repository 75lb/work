var SyncJob = require("../lib/JobSync");

function createJob(msg){
    return new SyncJob({
        name: "job",
        command: console.log,
        args: msg
    });
}

var queue = new SyncJob({ name: "queue" });
queue.add(createJob("clive"));
queue.add(createJob("hater"));
queue.add(createJob("nigeria"));
queue.run();
