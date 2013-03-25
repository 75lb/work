var util = require("util"),
    work = require("../lib/work"),
    Job = work.Job;

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

var findNewJob = new Job({
    name: "Find a new job",
    commandSync: l,
    args: "Let's do this."
});

[1,2,3,4,5,6,7,8,9,10].forEach(function(index){
    findNewJob.add({
        name: "job application",
        command: function(){
            var self = this, 
                delay = 500-(index*20);
            l("applying for job number: %d, delay: %d", index, delay);
            setTimeout(function(){
                l(delay);
                if (parseInt(Math.random()*2)){
                    self.success();
                } else {
                    self.fail();
                }
            }, delay);
        },
        children: [
            {
                name: "celebrate",
                runOn: "success",
                commandSync: l,
                args: "How could they refuse. "
            },
            {
                name: "sulk",
                runOn: "fail",
                commandSync: l,
                args: "I'm fucked."
            }
        ]
    });
});

findNewJob.on("complete", function(){
    l("queue complete");
});

findNewJob.run();

