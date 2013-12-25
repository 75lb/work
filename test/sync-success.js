var JobSync = require("../lib/JobSync"),
    assert = require("assert"),
    l = console.log;

describe("sync: simple success path", function(){

    var _job;

    function command(){
        return arguments.length;
    }

    beforeEach(function(){
        _job = new JobSync({
            name: "test",
            command: command,
            args: [ 1,2,3 ]
        });
    });

    it("correct name", function(){
        assert.strictEqual(_job.name, "test");
    });

    it("correct state", function(){
        assert.strictEqual(_job.state, _job.eState.idle);
        _job.run();
        assert.strictEqual(_job.state, _job.eState.successful);
    });

    it("correct return value", function(){
        var ret = _job.run();
        assert.strictEqual(ret, 3);
    });

    it("correct events", function(){
        var start, complete, fail, success;
        _job.on(_job.eEvent.start, function(){
            start = true;
        });
        _job.on(_job.eEvent.success, function(){
            success = true;
        });
        _job.on(_job.eEvent.fail, function(){
            fail = true;
        });
        _job.on(_job.eEvent.complete, function(){
            complete = true;
        });
        _job.run();
        assert.ok(start);
        assert.ok(success);
        assert.ok(!fail);
        assert.ok(complete);
    });
});
