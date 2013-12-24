var util = require("util"),
    work = require(".."),
    Job = work.Job,
    l = console.log;

function createJobApplication(index){
    return new Job({
        name: "job application " + index,
        parallel: true,
        command: function(){
            var self = this;
            setTimeout(function(){
                if (parseInt(Math.random()*2, 10)){
                    self.success();
                } else {
                    self.fail();
                }
            }, 6000 * Math.random());
        }
    });
}

var findNewJob = new Job({
    name: "Find a new job"
});

[1,2,3,4,5,6,7,8,9,10].forEach(function(index){
    findNewJob.add(createJobApplication(index).add([
        {
            name: "celebrate " + index,
            runOn: "successful",
            commandSync: function(){
                this.inform("congrats");
            }
        },
        {
            name: "sulk " + index,
            runOn: "failed",
            commandSync: function(){
                this.inform("no luck");
            }
        }
    ]));
});

findNewJob.monitor(process.stdout).run();
// findNewJob.on("monitor", function(job, evt, data){
//     console.log(job.name, evt);
// }).run();