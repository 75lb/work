var work = require("../lib/work"),
    util = require("util"),
    _ = require("underscore"),
    path = require("path"),
    assert = require("assert"),
    Queue = work.Queue,
    Job = work.Job;

function l(msg){
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(this, args);
}

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

    it("add(jobOptionsArray)", function(){
        var queue = new Queue({ name: "test" }),
            output = [];

        function run(){
            output.push(1);
        }
        
        queue.add([
            { name: "job 1", command: run },
            { name: "job 2", command: run },
            { name: "job 3", command: run }
        ]);
        
        assert.strictEqual(queue.jobs.length, 3);
        assert.strictEqual(queue.jobs[1].name, "job 2");
        
        queue.on("queue-complete", function(){
                assert.strictEqual(output.length, 3);
            })
            .start();
    });

    it("add(jobArray)", function(){
        var queue = new Queue({ name: "test" }),
            output = [];

        function run(){
            output.push(1);
        }
        
        queue.add([
            new Job({ name: "job 1", command: run }),
            new Job({ name: "job 2", command: run }),
            new Job({ name: "job 3", command: run })
        ]);
        
        assert.strictEqual(queue.jobs.length, 3);
        assert.strictEqual(queue.jobs[1].name, "job 2");
        
        queue.on("queue-complete", function(){
                assert.strictEqual(output.length, 3);
            })
            .start();
    });

    it("should be possible to subclass and extend a queue", function(){
       var files = ["one.wmv", "two.avi", "three.avi", "four.mp4", "five.mp4"];
       
       function TestQueue(options){
           Queue.call(this, options);
       }
       util.inherits(TestQueue, Queue);
       TestQueue.prototype.distinctExtensions = function(){
           var exts = [];
           this.jobs.forEach(function(job){
               exts.push(path.extname(job.data.file));
           });
           return _.uniq(exts);
       };
       
       var testQueue = new TestQueue();
       
       files.forEach(function(file){
           var job = new Job({ name: "test " + file });
           job.data = { file: file };
           testQueue.add(job);
       });
       
       assert.deepEqual(testQueue.distinctExtensions(), [ ".wmv", ".avi", ".mp4" ]);
       
    });
    
    describe("start() behaviour", function(){
        function GenericJob(name, async, time){
            Job.call(this, { 
                name: name, 
                async: async,
                command: function(){
                    var self = this;
                    setTimeout(function(){
                        self.emitSuccess();
                    },time);
                }
            });
        }
        util.inherits(GenericJob, Job);
        
        it("all synchronous jobs", function(done){
            var job1Success = false,
                job2Success = false;
            
            var job1 = new Job({
                name: "one",
                command: function(){
                    var self = this;
                    setTimeout(function(){
                        self.emitSuccess();
                    },100);
                }
            });
            var job2 = new Job({
                name: "two", 
                command: function(){
                    this.emitSuccess();
                }
            });
        
            var queue = new Queue();
            queue.add([ job1, job2 ]);
        
            job1.on("job-success", function(){
                job1Success = true;
                assert.strictEqual(job2Success, false);
            });
            job2.on("job-success", function(){
                job2Success = true;
                assert.strictEqual(job1Success, true);
            });
        
            queue.start()
                .on("queue-complete", function(){ done(); });
        })
    
        it("mixed jobs 1", function(done){
            var output = [];
            var queue = new Queue({ name: "test-queue"}),
                job1 = new GenericJob("job1", true, 50),
                job2 = new GenericJob("job2", false, 20),
                job3 = new GenericJob("job3", true, 5);
            queue.add([ job1, job2, job3 ]);
        
            job1.on("job-complete", function(){
                output.push(this.name);
            });
            job2.on("job-complete", function(){
                output.push(this.name);
            });
            job3.on("job-complete", function(){
                output.push(this.name);
            });

            queue
                .on("queue-complete", function (){ 
                    assert.deepEqual(output, ["job2", "job3", "job1"]);
                    done();
                })
                .start();
        });

        it("mixed jobs 2", function(done){
            var output = [];
            var queue = new Queue({ name: "test-queue"}),
                job1 = new GenericJob("job1", false, 50),
                job2 = new GenericJob("job2", false, 20),
                job3 = new GenericJob("job3", false, 5);
            queue.add([ job1, job2, job3 ]);
        
            job1.on("job-complete", function(){
                output.push(this.name);
            });
            job2.on("job-complete", function(){
                output.push(this.name);
            });
            job3.on("job-complete", function(){
                output.push(this.name);
            });

            queue
                .on("queue-complete", function (){ 
                    assert.deepEqual(output, ["job1", "job2", "job3"]);
                    done();
                })
                .start();
        });
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
