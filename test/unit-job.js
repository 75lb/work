var work = require("../lib/work"),
    assert = require("assert"),
    Queue = work.Queue,
    Job = work.Job;

function l(msg){console.log(msg)}

describe("Job", function(){
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
    
    it("`data` property can be accessed from `command`", function(){
        var job = new Job({ name: "job", data: { dat: "data" }, command: function(){
            assert.strictEqual(this.data.dat, "data");
        }});
        job.run();
    });
    
    it("instantiate job with an onComplete queue", function(){
        var job = new Job({ 
            name: "one", 
            command: console.log, 
            args: "testing",
            onSuccess: new Queue({ name: "onSuccess" }).add([
                { name: "success", command: console.log, args: "job success" }
            ])
        });
        
        assert.strictEqual(job.onSuccess.jobs[0].name, "success");
    });
    
    it("commandSync() should call emitSuccess automatically if not explicitly called", function(){
        var job = new Job({ name: "one", commandSync: console.log, args: "testing" });
        var successFired = false; 
        job.on("job-success", function(){
            successFired = true;
        });
        job.run();
        assert.strictEqual(successFired, true);
    })
});