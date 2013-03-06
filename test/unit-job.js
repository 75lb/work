var work = require("../lib/work"),
    assert = require("assert"),
    Queue = work.Queue,
    Job = work.Job;

function l(msg){console.log(msg)}

describe("Job", function(){
    it("`args` property must be an array");
    
    it("should pass `args` array to `command`", function(){
        var total = 0;
        function add(){
            var args = Array.prototype.slice.call(arguments);
            args.forEach(function(number){
                total += number;
            });
        }
        
        var job = new Job({ name: "job", command: add, args: [1, 10, 24] });
        job.run();
        
        assert.strictEqual(total, 35);
    });
});