var AsyncJob = require("../lib/AsyncJob"),
    assert = require("assert"),
    l = console.log;

describe.only("async > async", function(){

    var _job, _child1;

    function command(){
        var self = this;
        setTimeout(function(){
            self.done(null, 10);
        });
    }
    
    function brokenCommand(){
        throw new Error("broken");
    }

    beforeEach(function(){
        _job = new AsyncJob({
            name: "test",
            command: command,
            args: [ 1,2,3 ]
        });
        _brokenJob = new AsyncJob({
            name: "test",
            command: brokenCommand,
            args: [ 1,2,3 ]
        });
        _runOnComplete = new AsyncJob({
            name: "child1",
            runOn: "complete",
            command: command,
            args: 1
        });
        _runOnFail = new AsyncJob({
            name: "child2",
            runOn: "fail",
            command: command,
            args: 1
        });
        _runOnSuccess = new AsyncJob({
            name: "child3",
            runOn: "success",
            command: command,
            args: 1
        });
    });

    it("runOn 'complete' works", function(done){
        var runOnCompleteRan = false, runOnFailRan = false, runOnSuccessRan = false;
        _job.add(_runOnComplete);
        _job.add(_runOnFail);
        _job.add(_runOnSuccess);
        _runOnComplete.on("success", function(){
            runOnCompleteRan = true;
        });
        _runOnFail.on("success", function(){
            runOnFailRan = true;
        });
        _runOnSuccess.on("success", function(){
            runOnSuccessRan = true;
        });
        _job.children.on("complete", function(){
            assert.ok(runOnCompleteRan);
            assert.ok(!runOnFailRan);
            assert.ok(runOnSuccessRan);
            done();
        })
        _job.run();
    });

    it("runOn 'fail' works", function(){
        var runOnCompleteRan = false, runOnFailRan = false, runOnSuccessRan = false;
        _brokenJob.add(_runOnComplete);
        _brokenJob.add(_runOnFail);
        _brokenJob.add(_runOnSuccess);
        _runOnComplete.on("success", function(){
            runOnCompleteRan = true;
        });
        _runOnFail.on("success", function(){
            runOnFailRan = true;
        });
        _runOnSuccess.on("success", function(){
            runOnSuccessRan = true;
        });
        _job.children.on("complete", function(){
            assert.ok(runOnCompleteRan);
            assert.ok(runOnFailRan);
            assert.ok(!runOnSuccessRan);
            done();
        })
        _brokenJob.run();
    });

    it("runOn 'success' works", function(){
        var runOnCompleteRan = false, runOnFailRan = false, runOnSuccessRan = false;
        _job.add(_runOnComplete);
        _job.add(_runOnFail);
        _job.add(_runOnSuccess);
        _runOnComplete.on("complete", function(){
            runOnCompleteRan = true;
        });
        _runOnFail.on("complete", function(){
            runOnFailRan = true;
        });
        _runOnSuccess.on("complete", function(){
            runOnSuccessRan = true;
        });
        _job.children.on("complete", function(){
            assert.ok(runOnCompleteRan);
            assert.ok(!runOnFailRan);
            assert.ok(runOnSuccessRan);
            done();
        })
        _job.run();
    });
    
    it("queue runs correctly", function(){
        var result = [];
        function concat(msg){
            result.push(msg)
        }
        function createJob(msg){
            return new AsyncJob({
                name: "job",
                command: concat,
                args: msg
            });
        }

        var queue = new AsyncJob({ name: "queue" });
        queue.add(createJob("clive"));
        queue.add(createJob("hater"));
        queue.add(createJob("nigeria"));
        queue.run();
        assert.strictEqual(result.toString(), "clive,hater,nigeria");
    });
});
