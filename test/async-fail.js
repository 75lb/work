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
        // _job = new AsyncJob({
        //     name: "test",
        //     command: command,
        //     args: [ 1,2,3,4 ]
        // });
    });

    it("correct state", function(done){
        var job = new AsyncJob({
            name: "test",
            command: command,
            args: [ 1,2,3,4 ]
        });
        assert.strictEqual(job.state, job.eState.idle);
        job.run(function(err, value){
            assert.strictEqual(job.state, job.eState.failed);
            done();
        });
        assert.strictEqual(job.state, job.eState.running);
    });

    it("correct return value", function(done){
        var job = new AsyncJob({
            name: "test",
            command: command,
            args: [ 1,2,3,4 ]
        });
        job.run(function(err, returnValue){
            assert.strictEqual(returnValue, undefined);
            done();
        });
    });

    it("correct events", function(done){
        var job = new AsyncJob({
            name: "test",
            command: command,
            args: [ 1,2,3,4 ]
        });
        var start, complete, fail, success;
        job.on(job.eEvent.start, function(){
            start = true;
        });
        job.on(job.eEvent.success, function(){
            success = true;
        });
        job.on(job.eEvent.fail, function(){
            fail = true;
        });
        job.on(job.eEvent.complete, function(){
            complete = true;
            assert.ok(start);
            assert.ok(!success);
            assert.ok(fail);
            assert.ok(complete);
            done();
        });
        job.run();
    });
});
