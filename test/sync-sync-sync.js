var SyncJob = require("../lib/SyncJob"),
    assert = require("assert"),
    l = console.log;

describe("sync > sync > sync", function(){
    it("queue runs correctly", function(){
        var result = [];
        function concat(msg){
            result.push(msg)
        }
        function createJob(msg){
            return new SyncJob({
                name: "job",
                command: concat,
                args: msg
            });
        }

        var queue = createJob("queue"),
            one = createJob("one"),
            two = createJob("two"),
            one_1 = createJob("one_1"),
            one_2 = createJob("one_2"),
            two_1 = createJob("two_1"),
            two_2 = createJob("two_2");
        queue.add(one);
        queue.add(two);
        one.add(one_1);
        one.add(one_2);
        two.add(two_1);
        two.add(two_2);
        queue.run();
        assert.strictEqual(result.toString(), "queue,one,one_1,one_2,two,two_1,two_2");
    });
});
