var JobSync = require("../lib/JobSync"),
    assert = require("assert"),
    l = console.log;

describe("JobSync > JobSync", function(){

    var _job, _child1;

    function command(){
        return arguments.length;
    }

    beforeEach(function(){
        _job = new JobSync({
            name: "test",
            command: command,
            args: [ 1,2,3 ]
        });
        _child1 = new JobSync({
            name: "child1",
            runOn: "complete",
            command: command,
            args: 1
        });
        _child2 = new JobSync({
            name: "child2",
            runOn: "fail",
            command: command,
            args: 1
        });
    });

    it("add child", function(){
        _job.add(_child1);
        assert.strictEqual(_job.children.length, 1);
        _job.add(_child2);
        assert.strictEqual(_job.children.length, 2);
    });

    it("runOn works", function(){
        var child1Ran = false, child2Ran = false;
        _job.add(_child1);
        _job.add(_child2);
        _child1.on(_child1.eEvent.complete, function(){
            child1Ran = true;
        })
        _child2.on(_child1.eEvent.fail, function(){
            child2Ran = true;
        })
        _job.run();
        assert.ok(child1Ran);
        assert.ok(!child2Ran);
    });
});
