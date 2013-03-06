var work = require("../lib/work"),
    util = require("util"),
    assert = require("assert"),
    Queue = work.Queue,
    Job = work.Job;

describe("Queue", function(){
    it("queue synopsis", function(){
        function log(){}
        var queue = new Queue({ name: "Main Queue" })
            .on("queue-starting", function(state){ log("Queue starting: " + state); })
            .on("queue-complete", function(state){ log("Queue complete: " + state); })
            .on("job-starting", function(state){ log("Job starting: " + state); })
            .on("job-progress", function(state, progress){ 
                log("Job progress: " + state + progress.percentComplete); 
            })
            .on("job-complete", function(state){ log("Job complete: " + state); })
            .on("job-success", function(state){ log("Job success: " + state); })
            .on("job-fail", function(state){ log("Job fail: " + state); })
            .on("job-info", function(state, msg){ log("Job info: " + msg + state); })
            .on("job-warning", function(state, msg){ log("job-warning: " + msg + state); })
            .on("job-error", function(state, err){ log("job-error: " + state + err); })
            .on("job-terminated", function(state){ log("job-terminated: " + state); });

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
                    log("SUCCESS, %s!", person);
                    this.emitSuccess();
                }
            });
            
            job.onFail.add({
                name: util.format("notify %s of failure", person),
                command: function(){
                    log("FAILED, %s!", person);
                    this.emitSuccess();
                }
            });

            queue.add(job);
        });

        queue.start();
   });

    it("add(job)", function(){
        var queue = new Queue({ name: "test" });
        queue.add(new Job({ name: "test" }));
        
        assert.strictEqual(queue.jobs.length, 1);
        assert.strictEqual(queue.jobs[0].name, "test");        
    });

    it("add(jobOptions)", function(){
        var queue = new Queue({ name: "test" });
        queue.add({ name: "test" });
        
        assert.strictEqual(queue.jobs.length, 1);
        assert.strictEqual(queue.jobs[0].name, "test");
    });

    it("add(jobArray)", function(){
        var queue = new Queue({ name: "test" }),
            output = [];

        function run(number){
            output.push(number);
        }
        
        queue.add([
            { name: "job 1", command: run, args: 1 },
            { name: "job 2", command: run, args: 2 },
            { name: "job 3", command: run, args: 3 }
        ]);
        
        assert.strictEqual(queue.jobs.length, 3);
        assert.strictEqual(queue.jobs[1].name, "job 2");
        
        queue.start()
            .on("queue-complete", function(){
                assert.strictEqual(output.length, 3);
            });
    });

    it("should be possible to collect stats about the queued jobs", function(){
       var files = ["one.wmv", "two.avi", "three.avi", "four.mp4", "five.mp4"];
       
       
    });
});

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
