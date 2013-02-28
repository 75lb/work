var Queue = require("../lib/queue"),
    Job = require("../lib/job"),
    util = require("util");

// describe("Queue", function(){
//     it("queue synopsis", function(){
    
        var queue = new Queue({ name: "Main Queue" })
            .on("queue-starting", function(state){ console.log("Queue starting: " + state); })
            .on("queue-complete", function(state){ console.log("Queue complete: " + state); })
            .on("job-starting", function(state){ console.log("Job starting: " + state); })
            .on("job-progress", function(state, progress){ 
                console.log("Job progress: " + state + progress.percentComplete); 
            })
            .on("job-complete", function(state){ console.log("Job complete: " + state); })
            .on("job-success", function(state){ console.log("Job success: " + state); })
            .on("job-fail", function(state){ console.log("Job fail: " + state); })
            .on("job-info", function(state, msg){ console.log("Job info: " + msg + state); })
            .on("job-warning", function(state, msg){ console.log("job-warning: " + msg + state); })
            .on("job-error", function(state, err){ console.log("job-error: " + state + err); })
            .on("job-terminated", function(state){ console.log("job-terminated: " + state); });

        ["Dave", "Alan", "Geoff", "Mohammad", "Jesus", "Mandy"].forEach(function(person){
            var job = new Job({
                name: util.format("%s job application", person),
                command: function(){
                   if (Math.floor(Math.random() * 2)){
                       this.emitSuccess();
                   } else {
                       this.emitFail();
                   }
                }
            });

            job.onSuccess.add({
                name: util.format("notify %s of success", person),
                command: function(){
                    console.log("SUCCESS, %s!", person);
                    this.emitSuccess();
                }
            });
            
            job.onFail.add({
                name: util.format("notify %s of failure", person),
                command: function(){
                    console.log("FAILED, %s!", person);
                    this.emitSuccess();
                }
            });

            queue.add(job);
        });

        queue.print();
        queue.start();
//    });
// });

/**
list of jobs
execution plan
execute jobs 
 in sequence or 
 a group of jobs in parallel
 
[
    { name: "job 1", command: func }, 
    { name: "job 2", command: func },
    { 
        name: "job 3", 
        onComplete: [
            { name: "job 4", command: func, async: true }
            { name: "job 5", command: func, async: true }
            { name: "job 6", command: func, async: true }
        ]
    },
    { name: "job 7", command: func, async: true },
    { name: "job 8", command: func, async: true },
    { name: "job 8", command: func },
    { name: "job 8", command: func, async: true }
]
*/
