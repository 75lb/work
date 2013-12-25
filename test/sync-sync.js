var JobSync = require("../lib/JobSync"),
    assert = require("assert"),
    l = console.log;

describe("sync > sync", function(){

    var _job, _child1;

    function command(){
        return arguments.length;
    }
    function brokenCommand(){
        throw new Error("broken");
        return arguments.length;
    }

    beforeEach(function(){
        _job = new JobSync({
            name: "test",
            command: command,
            args: [ 1,2,3 ]
        });
        _brokenJob = new JobSync({
            name: "test",
            command: brokenCommand,
            args: [ 1,2,3 ]
        });
        _runOnComplete = new JobSync({
            name: "child1",
            runOn: "complete",
            command: command,
            args: 1
        });
        _runOnFail = new JobSync({
            name: "child2",
            runOn: "fail",
            command: command,
            args: 1
        });
        _runOnSuccess = new JobSync({
            name: "child3",
            runOn: "success",
            command: command,
            args: 1
        });
    });

    it("add three children", function(){
        _job.add(_runOnComplete);
        assert.strictEqual(_job.children.length, 1);
        _job.add(_runOnFail);
        assert.strictEqual(_job.children.length, 2);
        _job.add(_runOnSuccess);
        assert.strictEqual(_job.children.length, 3);
    });

    it("runOn 'complete' works", function(){
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
        _job.run();
        assert.ok(runOnCompleteRan);
        assert.ok(!runOnFailRan);
        assert.ok(runOnSuccessRan);
    });

    it("runOn 'fail' works", function(){
        var runOnCompleteRan = false, runOnFailRan = false, runOnSuccessRan = false;
        _brokenJob.add(_runOnComplete);
        _brokenJob.add(_runOnFail);
        _brokenJob.add(_runOnSuccess);
        _runOnComplete.on("complete", function(){
            runOnCompleteRan = true;
        });
        _runOnFail.on("complete", function(){
            runOnFailRan = true;
        });
        _runOnSuccess.on("complete", function(){
            runOnSuccessRan = true;
        });
        _brokenJob.run();
        assert.ok(runOnCompleteRan);
        assert.ok(runOnFailRan);
        assert.ok(!runOnSuccessRan);
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
        _job.run();
        assert.ok(runOnCompleteRan);
        assert.ok(!runOnFailRan);
        assert.ok(runOnSuccessRan);
    });
});
