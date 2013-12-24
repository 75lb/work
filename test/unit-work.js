var Job = require("../lib/Job"),
    JobSync = require("../lib/JobSync"),
    assert = require("assert"),
    l = console.log;

describe("JobSync: simple success path", function(){

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

    it("correct name", function(){
        assert.strictEqual(_job.name, "test");
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

describe("JobSync: simple success path", function(){

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

    it("correct state", function(){
        assert.strictEqual(_job.state, "idle");
        _job.run();
        assert.strictEqual(_job.state, "running");
    });

    it("correct return value", function(done){
        _job.run(function(ret){
            assert.strictEqual(ret, 4);
            done();
        });
    });

    it("correct events", function(done){
        var start, complete;
        _job.on("start", function(){
            start = true;
        });
        _job.on("complete", function(){
            complete = true;
            assert.ok(start);
            assert.ok(complete);
            done();
        });
        _job.run();
    });
});
