var SyncJob = require("../lib/SyncJob"),
    assert = require("assert"),
    l = console.log;

describe("sync: simple fail path", function(){

    var _job;

    function command(){
        throw new Error("broken");
        return 3;
    }

    beforeEach(function(){
        _job = new SyncJob({
            name: "test",
            command: command,
            args: [ 1,2,3 ]
        });
    });

    it("correctly throws", function(){
        assert.throws(_job.run);
    });

    it("correct state", function(){
        assert.strictEqual(_job.state, _job.eState.idle);
        try {
            _job.run()
        } catch(err){
            assert.strictEqual(_job.state, _job.eState.failed);
        };
    });

    it("correct error message", function(){
        try {
            _job.run()
        } catch(err){
            assert.strictEqual(err.message, "broken");
        };
    });

    it("correct return value", function(){
        var ret = _job.run();
        assert.strictEqual(ret, undefined);
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
        assert.ok(!success);
        assert.ok(fail);
        assert.ok(complete);
    });
});
