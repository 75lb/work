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
    it.skip("queue synopsis", function(){
        var queue = new Queue({ name: "Main Queue" })
            .on("queue-starting", function(queue){ l("Queue starting: " + queue.name); })
            .on("queue-complete", function(queue){ l("Queue complete: " + queue.name); })
            .on("job-starting", function(job){ l("Job starting: " + job.name); })
            .on("job-progress", function(job, progress){ 
                l("Job progress: " + job.name + progress.percentComplete); 
            })
            .on("job-complete", function(job){ l("Job complete: " + job.name); })
            .on("job-success", function(job){ l("Job success: " + job.name); })
            .on("job-fail", function(job){ l("Job fail: " + job.name); })
            .on("job-info", function(job, msg){ l("Job info: " + msg + job.name); })
            .on("job-warning", function(job, msg){ l("job-warning: " + msg + job.name); })
            .on("job-error", function(job, err){ l("job-error: " + job.name + err); })
            .on("job-terminated", function(job){ l("job-terminated: " + job.name); });

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
                commandSync: l,
                args: ["SUCCESS, %s!", person]
            });
            
            job.onFail.add({
                name: util.format("notify %s of failure", person),
                commandSync: l,
                args: ["FAILED, %s!", person]
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
       
       var testQueue = new TestQueue({ name: "tq" });
       
       files.forEach(function(file){
           var job = new Job({ name: "test " + file });
           job.data = { file: file };
           testQueue.add(job);
       });
       
       assert.deepEqual(testQueue.distinctExtensions(), [ ".wmv", ".avi", ".mp4" ]);
       
    });
    
    describe("start() runs queued jobs in expected order", function(){
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
                    },10);
                }
            });
            var job2 = new Job({
                name: "two", 
                command: function(){
                    this.emitSuccess();
                }
            });
        
            var queue = new Queue({ name: "tq" });
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
    
        it("mixed jobs", function(done){
            var output = [];
            var queue = new Queue({ name: "test-queue"}),
                job1 = new GenericJob("job1", true, 20),
                job2 = new GenericJob("job2", false, 10),
                job3 = new GenericJob("job3", true, 5);
            queue.add([ job1, job2, job3 ]);
        
            function register(job){
                output.push(job.name);
            }
            job1.on("job-complete", register );
            job2.on("job-complete", register );
            job3.on("job-complete", register );

            queue
                .on("queue-complete", function (){ 
                    assert.deepEqual(output, ["job2", "job3", "job1"]);
                    done();
                })
                .start();
        });

        it("sync jobs", function(done){
            var output = [];
            var queue = new Queue({ name: "test-queue"}),
                job1 = new GenericJob("job1", false, 20),
                job2 = new GenericJob("job2", false, 10),
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

        it("async jobs", function(done){
            var output = [];
            var queue = new Queue({ name: "test-queue"}),
                job1 = new GenericJob("job1", true, 20),
                job2 = new GenericJob("job2", true, 10),
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
                    assert.deepEqual(output, ["job3", "job2", "job1"]);
                    done();
                })
                .start();
        });
        
        it("sequentially executed, sync commands with onSuccess queues", function(done){
            var queue = new Queue({ name: "main" });
            var completeJobs = [];
            function register(val){
                completeJobs.push(val);
            }
            
            queue
                .add([
                    { 
                        name: "one", 
                        commandSync: String, 
                        onSuccess: new Queue({ name: "one onSuccess" }).add({
                            name: "one succeeded",
                            commandSync: String
                        })
                    },
                    { 
                        name: "two", 
                        commandSync: String,
                        onSuccess: new Queue({ name: "two onSuccess" }).add({
                            name: "two succeeded",
                            commandSync: String
                        })
                    }
                ])
                .on("job-starting", function(job){
                    register(job.name + " starting");
                })
                .on("job-complete", function(job){
                    register(job.name + " complete");
                })
                .on("queue-starting", function(queue){
                    register(queue.name + " starting");
                })
                .on("queue-complete", function(queue){
                    register(queue.name + " complete");
                    if (queue.name == "main"){
                        assert.deepEqual(
                            completeJobs, 
                            [ 
                                'main starting',
                                'one starting',
                                'one onSuccess starting',
                                'one succeeded starting',
                                'one succeeded complete',
                                'one onSuccess complete',
                                'one complete',
                                'two starting',
                                'two onSuccess starting',
                                'two succeeded starting',
                                'two succeeded complete',
                                'two onSuccess complete',
                                'two complete',
                                'main complete' 
                            ],
                            completeJobs
                        );
                        done();
                    }
                })
                .start();
        });
        
        it("parallel executed, async commands with onSuccess queues", function(done){
            var queue = new Queue({ name: "main" });
            var completeJobs = [];
            function register(val){
                completeJobs.push(val);
            }
            
            queue
                .add([
                    { 
                        name: "one", 
                        async: true,
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.emitSuccess();
                            }, 20)
                        }, 
                        onSuccess: new Queue({ name: "one onSuccess" }).add({
                            name: "one succeeded",
                            async: true,
                            command: function(){ 
                                var self = this;
                                setTimeout(function(){
                                    self.emitSuccess();
                                }, 5)
                            }, 
                        })
                    },
                    { 
                        name: "two", 
                        async: true,
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.emitSuccess();
                            }, 10)
                        }, 
                        onSuccess: new Queue({ name: "two onSuccess" }).add({
                            name: "two succeeded",
                            async: true,
                            command: function(){ 
                                var self = this;
                                setTimeout(function(){
                                    self.emitSuccess();
                                }, 55)
                            }, 
                        })
                    }
                ])
                .on("job-starting", function(job){
                    register(job.name + " starting");
                })
                .on("job-complete", function(job){
                    register(job.name + " complete");
                })
                .on("queue-starting", function(queue){
                    register(queue.name + " starting");
                })
                .on("queue-complete", function(queue){
                    register(queue.name + " complete");
                    if (queue.name == "main"){
                        assert.deepEqual(
                            completeJobs, 
                            [ 
                                'main starting',
                                'one starting',
                                'two starting',
                                'two onSuccess starting',
                                'two succeeded starting',
                                'one onSuccess starting',
                                'one succeeded starting',
                                'one succeeded complete',
                                'one onSuccess complete',
                                'one complete',
                                'two succeeded complete',
                                'two onSuccess complete',
                                'two complete',
                                'main complete' 
                            ],
                            util.inspect(completeJobs)
                        );
                        done();
                    }
                })
                .start();
        });

        it("sequentially executed, async commands with onSuccess queues", function(done){
            var queue = new Queue({ name: "main" });
            var completeJobs = [];
            function register(val){
                completeJobs.push(val);
            }
            
            queue
                .add([
                    { 
                        name: "one", 
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.emitSuccess();
                            }, 20)
                        }, 
                        onSuccess: new Queue({ name: "one onSuccess" }).add({
                            name: "one succeeded",
                            command: function(){ 
                                var self = this;
                                setTimeout(function(){
                                    self.emitSuccess();
                                }, 5)
                            }, 
                        })
                    },
                    { 
                        name: "two", 
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.emitSuccess();
                            }, 10)
                        }, 
                        onSuccess: new Queue({ name: "two onSuccess" }).add({
                            name: "two succeeded",
                            command: function(){ 
                                var self = this;
                                setTimeout(function(){
                                    self.emitSuccess();
                                }, 55)
                            }, 
                        })
                    }
                ])
                .on("job-starting", function(job){
                    register(job.name + " starting");
                })
                .on("job-complete", function(job){
                    register(job.name + " complete");
                })
                .on("queue-starting", function(queue){
                    register(queue.name + " starting");
                })
                .on("queue-complete", function(queue){
                    register(queue.name + " complete");
                    if (queue.name == "main"){
                        assert.deepEqual(
                            completeJobs, 
                            [ 
                                'main starting',
                                'one starting',
                                'one onSuccess starting',
                                'one succeeded starting',
                                'one succeeded complete',
                                'one onSuccess complete',
                                'one complete',
                                'two starting',
                                'two onSuccess starting',
                                'two succeeded starting',
                                'two succeeded complete',
                                'two onSuccess complete',
                                'two complete',
                                'main complete' 
                            ],
                            util.inspect(completeJobs)
                        );
                        done();
                    }
                })
                .start();
        });
    });
});
