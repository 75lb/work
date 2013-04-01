var util = require("util"),
    work = require(".."),
    Job = work.Job;

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

function JobApplication(index){
    Job.call(this, {
        name: "job application " + index,
        parallel: true,
        command: function(){
            var self = this;
            setTimeout(function(){
                if (parseInt(Math.random()*2)){
                    self.success();
                } else {
                    self.fail();
                }
            }, 6000 * Math.random());
        }        
    })
}
util.inherits(JobApplication, Job);

var findNewJob = new Job({
    name: "Find a new job"
});

[1,2,3,4,5,6,7,8,9,10].forEach(function(index){
    findNewJob.add(new JobApplication(index).add([
        {
            name: "celebrate " + index,
            runOn: "success"
        },
        {
            name: "sulk " + index,
            runOn: "fail"
        }
    ]));
});

findNewJob.monitor(process.stdout).run();