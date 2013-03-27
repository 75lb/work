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
        name: "job application " + index,
        parallel: true,
        command: function(){
            var self = this, 
                delay = 500-(index*20);
            setTimeout(function(){
                l("application for job number: %d, delay: %d", index, delay);
                if (parseInt(Math.random()*2)){
                    self.success();
                } else {
                    self.fail();
                }
            }, delay);
        }
        ,children: [
            {
                name: "celebrate " + index,
                runOn: "success",
                commandSync: l,
                args: "How could they refuse. "
            },
            {
                name: "sulk " + index,
                runOn: "fail",
                commandSync: l,
                args: "I'm fucked."
            }
        ]
    });
});

findNewJob.on("complete", function(){
    l("find a new job complete");
});

findNewJob.run();

