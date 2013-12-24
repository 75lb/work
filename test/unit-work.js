var Job = require("../lib/Job"),
    JobSync = require("../lib/JobSync"),
    assert = require("assert"),
    l = console.log;

describe("JobSync: success path", function(){

    var _job;

    function syncCommand(){
        return arguments.length;
    }

    beforeEach(function(){
        _job = new JobSync({
            name: "test",
            command: syncCommand,
            args: [ 1,2,3 ]
        });
    });

    it("correct state", function(){
        assert.strictEqual(_job.state, "idle");
        _job.run();
        assert.strictEqual(_job.state, "complete");
    });

    it("correct return value", function(){
        var ret = _job.run();
        assert.strictEqual(ret, 3);
    });

    it("correct events", function(){
        var start, complete;
        _job.on("start", function(){
            start = true;
        });
        _job.on("complete", function(){
            complete = true;
        });
        _job.run();
        assert.ok(start);
        assert.ok(complete);
    });
});
