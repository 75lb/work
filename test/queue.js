var Queue = require("../lib/Queue"),
    AsyncJob = require("../lib/AsyncJob"),
    assert = require("assert"),
    l = console.log;

describe("Queue", function(){
    var _queue, counter = 1;
    beforeEach(function(){
        _queue = new Queue();
    });
    
    function createAsyncJob(){
        return new AsyncJob({
            name: "job", 
            command: function(){
                var self = this, 
                    timeout = Math.random() * 100;
                setTimeout(function(){
                    self.done();
                }, timeout);
            }
        });
    }
    
    it("all complete event", function(done){
        var one = createAsyncJob(),
            two = createAsyncJob(),
            three = createAsyncJob(),
            oneComplete, twoComplete, threeComplete;
        
        one.on("complete", function(){
            oneComplete = true;
        });
        two.on("complete", function(){
            twoComplete = true;
        });
        three.on("complete", function(){
            threeComplete = true;
        });
        _queue.on("complete", function(){
            assert.ok(oneComplete);
            assert.ok(twoComplete);
            assert.ok(threeComplete);
            done();
        });
        _queue.add(one);
        _queue.add(two);
        _queue.add(three);
        _queue.start();
    });
});
