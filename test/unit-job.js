var Job = require("../lib/Job"),
    assert = require("assert"),
    l = console.log;

describe("Job: simple success path", function(){

    var _job;

    function command(){
        var self = this,
            argCount = arguments.length;
        setTimeout(function(){ self.done(argCount); }, 10);
    }

    beforeEach(function(){
        _job = new Job({
            name: "test",
            command: command,
            args: [ 1,2,3,4 ]
        });
    });

    it("correct name", function(){
        assert.strictEqual(_job.name, "test");
    });

    it("correct state", function(done){
        assert.strictEqual(_job.state, _job.eState.idle);
        _job.run(function(){
            assert.strictEqual(_job.state, _job.eState.successful);
            done();
        });
        assert.strictEqual(_job.state, _job.eState.running);
    });

    it("correct return value", function(done){
        _job.run(function(ret){
            assert.strictEqual(ret, 4);
            done();
        });
    });

    it("correct events", function(done){
        var start, complete;
        _job.on(_job.eEvent.start, function(){
            start = true;
        });
        _job.on(_job.eEvent.complete, function(){
            complete = true;
            assert.ok(start);
            assert.ok(complete);
            done();
        });
        _job.run();
    });
});
