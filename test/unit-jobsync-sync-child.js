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
    });

    it("add child", function(){
        _job.add(_child1);
        assert.strictEqual(_job.children.length, 1);
    });

    it("runOn 'complete'", function(){
        var childRan = false;
        _job.add(_child1);
        _child1.on(_child1.eEvent.complete, function(){
            childRan = true;
        })
        _job.run();
        assert.ok(childRan);
    });
});
