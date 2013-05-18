var work = require("../lib/work"),
    util = require("util"),
    _ = require("underscore"),
    path = require("path"),
    assert = require("assert"),
    Job = work.Job;

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

it("add() should refuse to add duplicate");
it("a child should correctly runOn");

describe("Job", function(){
    describe("add", function(){
        it("add(job)", function(){
            var job = new Job({ name: "test" });
            job.add(new Job({ name: "test" }));

            assert.strictEqual(job.children.length, 1);
            assert.ok(job.children[0] instanceof Job);
            assert.strictEqual(job.children[0].name, "test");
        });

        it("add(jobOptions)", function(){
            var job = new Job({ name: "test" });
            job.add({ name: "test" });

            assert.strictEqual(job.children.length, 1);
            assert.ok(job.children[0] instanceof Job);
            assert.strictEqual(job.children[0].name, "test");
        });

        it("add(jobOptionsArray)", function(){
            var job = new Job({ name: "test" });
            job.add([
               { name: "job 1" },
               { name: "job 2" },
               { name: "job 3" }
            ]);

            assert.strictEqual(job.children.length, 3);
            assert.ok(job.children[0] instanceof Job);
            assert.strictEqual(job.children[1].name, "job 2");
        });

        it("add(jobArray)", function(){
            var job = new Job({ name: "test" });
            job.add([
               new Job({ name: "job 1" }),
               new Job({ name: "job 2" }),
               new Job({ name: "job 3" })
            ]);

            assert.strictEqual(job.children.length, 3);
            assert.ok(job.children[0] instanceof Job);
            assert.strictEqual(job.children[1].name, "job 2");
        });
    });
    
    describe("jobs run() in expected order", function(){
        function GenericJob(name, parallel, time, register){
            Job.call(this, { 
                name: name, 
                parallel: parallel,
                command: function(){
                    var self = this;
                    setTimeout(function(){
                        self.success();
                        if (register) register.push(self);
                    },time);
                }
            });
        }
        util.inherits(GenericJob, Job);
        
        it("mixed sequential and parallel jobs", function(done){
            var output = [];
            var main = new GenericJob("main", false, 100, output).add([
                new GenericJob("job1", true, 40, output),
                new GenericJob("job2", false, 20, output),
                new GenericJob("job3", true, 5, output)
            ]);
            main.on("children-complete", function(){
                assert.deepEqual(output, [ "main", "job2", "job3", "job1"]);
                done();
            }).run();
        });

        it("sequential jobs", function(done){
            var output = [];
            var main = new Job({ name: "main"}),
                job1 = new GenericJob("job1", false, 40),
                job2 = new GenericJob("job2", false, 20),
                job3 = new GenericJob("job3", false, 5);
            main.add([ job1, job2, job3 ]);
        
            function register(job){
                output.push(job.name);
                if(output.length === 4){
                    assert.deepEqual(output, ["main", "job1", "job2", "job3"]);
                    done();
                }
            }
            job1.on("complete", register);
            job2.on("complete", register);
            job3.on("complete", register);
            main.on("complete", register).run();
        });

        it("parallel jobs", function(done){
            var output = [];
            function register(job){
                output.push(job.name);
                if(output.length === 4){
                    assert.deepEqual(output, ["main", "job3", "job2", "job1"]);
                    done();
                }
            }

            var main = new Job({ name: "main" }),
                job1 = new GenericJob("job1", true, 40),
                job2 = new GenericJob("job2", true, 20),
                job3 = new GenericJob("job3", true, 5);
            main.add([ job1, job2, job3 ]);
        
            job1.on("complete", register);
            job2.on("complete", register);
            job3.on("complete", register);
            main.on("complete", register).run();
        });
        
        it("monitoring sequential, sync commands with children", function(done){
            var output = [];
            function register(job){
                // l(job.name);
                output.push(job.name);
                if(output.length === 5){
                    assert.deepEqual(output, ["main", "one", "one child", "two", "two child"]);
                    done();
                }
            }
            
            var main = new Job({ name: "main" });
            main.add([
                { 
                    name: "one", 
                    commandSync: String, 
                    children: [{
                        name: "one child",
                        commandSync: String
                    }]
                },
                { 
                    name: "two", 
                    commandSync: String,
                    children: [{
                        name: "two child",
                        commandSync: String
                    }]
                }
            ]);
            
            main.on("monitor", function(job, eventName){
                if (eventName == "complete"){
                    register(job);
                }
                if (eventName == "error"){
                    l(job.errors);
                }
            });
            main.run();
        });
        
        it("monitoring parallel executed, parallel commands with onSuccess children", function(done){
            var main = new Job({ name: "main" });
            var completeJobs = [];
            function register(job){
                // l(job.name);
                completeJobs.push(job.name);
            }
            
            main.add([
                { 
                    name: "one", 
                    parallel: true,
                    command: function(){ 
                        var self = this;
                        setTimeout(function(){
                            self.success();
                        }, 20)
                    }, 
                    children: {
                        name: "one succeeded",
                        runOn: "success",
                        parallel: true,
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.success();
                            }, 5)
                        }, 
                    }
                },
                { 
                    name: "two", 
                    parallel: true,
                    command: function(){ 
                        var self = this;
                        setTimeout(function(){
                            self.success();
                        }, 10)
                    }, 
                    children: {
                        name: "two succeeded",
                        runOn: "success",
                        parallel: true,
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.success();
                            }, 55)
                        }, 
                    }
                }
            ])
            
            main.on("monitor", function(job, eventName){
                // console.log("%s, %s", job.name, eventName);
                if (eventName == "complete"){
                    register(job);
                }
            });
            main.on("descendentsComplete", function(){
                // l("DESC");
                done();
                // assert.deepEqual(completeJobs, "")
            });
            main.run();
        });

        it("sequentially executed, parallel commands with onSuccess queues", function(done){
            var queue = new Job({ name: "main" });
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
                                self.success();
                            }, 20)
                        },
                        onSuccess: new Job({ name: "one onSuccess" }).add({
                            name: "one succeeded",
                            command: function(){ 
                                var self = this;
                                setTimeout(function(){
                                    self.success();
                                }, 5)
                            }, 
                        })
                    },
                    { 
                        name: "two", 
                        command: function(){ 
                            var self = this;
                            setTimeout(function(){
                                self.success();
                            }, 10)
                        }, 
                        onSuccess: new Job({ name: "two onSuccess" }).add({
                            name: "two succeeded",
                            command: function(){ 
                                var self = this;
                                setTimeout(function(){
                                    self.success();
                                }, 55)
                            }, 
                        })
                    }
                ])
                .on("starting", function(job){
                    register(job.name + " starting");
                })
                .on("complete", function(job){
                    register(job.name + " complete");
                })
                .on("starting", function(queue){
                    register(queue.name + " starting");
                })
                .on("complete", function(queue){
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
                .run();
        });
    });
    
    describe("parent, previous, next and return values", function(){
        it("access return value of parent job", function(){
            var queue = new Job({name: "queue"});
            var result = "";
            
            queue.add([
                { 
                    name: "job1", 
                    commandSync: function(a){ return a; }, 
                    args: "job1",
                    onSuccess: new Job({ name: "what" }).add(
                        {
                            name: "job2", 
                            commandSync: function(){ 
                                result = this.parent.parent.retVal; 
                            }
                        }
                    )
                },
            ]);
            queue.run();
            assert.strictEqual(result, "job1");
        });

        it("access return value of previous sibling job", function(){
            var queue = new Job({name: "queue"}),
                result = "";
            
            queue.add([
                { 
                    name: "job1",
                    commandSync: function(a){ return a; }, 
                    args: "job1",
                },
                { 
                    name: "job2", 
                    commandSync: function(){ result = this.previous.retVal; },
                }
            ]);
            
            queue.run();
            assert.strictEqual(result, "job1");
        });
        
    })
    
    describe("monitoring", function(){
    });
});
