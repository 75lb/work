var AsyncJob = require("../lib/AsyncJob"),
    assert = require("assert"),
    l = console.log;

describe("async: simple fail path", function(){

    var _job;

    function command(){
        var self = this;
        setTimeout(function(){
            try{
                throw new Error("broken");
            } catch(err){
                self.done(err);
            }
        }, 10);
    }

    beforeEach(function(){
        _job = new AsyncJob({
            name: "test",
            command: command,
            args: [ 1,2,3,4 ]
        });
    });

    it("correct state", function(done){
        assert.strictEqual(_job.state, _job.eState.idle);
        _job.run(function(err, value){
            assert.strictEqual(_job.state, _job.eState.failed);
            done();
        });
        assert.strictEqual(_job.state, _job.eState.running);
    });

    it("correct return value", function(done){
        _job.run(function(err, returnValue){
            assert.strictEqual(returnValue, undefined);
            done();
        });
    });

    it("correct events", function(done){
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
            assert.ok(start);
            assert.ok(!success);
            assert.ok(fail);
            assert.ok(complete);
            done();
        });
        _job.run();
    });
});
