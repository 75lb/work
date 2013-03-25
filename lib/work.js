var EventEmitter = require("events").EventEmitter,
    Thing = require("nature").Thing,
    util = require("util");

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

function JobOptions(){
    Thing.call(this);
    this.define({ name: "name", type: "string", required: true })
        .define({ name: "command", type: "function" })
        .define({ name: "commandSync", type: "function" })
        .define({ name: "runOn", type: "string" })
        .define({ name: "args", type: Array })
        .define({ name: "children", type: Array })
        .define({ name: "data" })
        .define({ name: "parallel", type: "boolean", default: false });
}
util.inherits(JobOptions, Thing);

function Job(options){
    var config = new JobOptions().set(options);
    var self = this;
    this.name = config.name;
    this.running = null;
    this.progress = null;
    this.successful = null;
    this.complete = null;
    this.children = [];
    if (config.children){
        config.children.forEach(function(childJob){
            self.add.call(self, childJob);
        });
    }
    this.command = config.command;
    this.commandSync = config.commandSync;
    this.args = config.args;
    this.runOn = config.runOn;
}
util.inherits(Job, EventEmitter);
Job.prototype.add = function(job){
    this.children.push(new Job(job));
    return this;
};
Job.prototype.run = function(){
    var self = this;
    this.emit("starting");

    function runJob(job){
        if (!job.runOn){
            job.run();
        } else if (job.runOn == "success" && self.successful === true){
            job.run();
        } else if (job.runOn == "fail" && self.successful === false){
            job.run();
        } else {
            l("warning, job ignored: " + job.name);
        }
    }
    
    // run this command
    try{
        if (this.command){
            this.command.apply(this, this.args);
        } else if (this.commandSync){
            this.retVal = this.commandSync.apply(this, this.args);
            // if the supplied command did not already call success() or fail() then assume success
            if (!this.complete){
                this.success(this.retVal);
            }
        }

    } catch(e){
        this.emit("error", e);
        this.fail();
    }

    // run any children
    var i = 0;
    function runNext(){
        var childJob = self.children[i++];
        if (childJob){
            if (childJob.parallel){
                runJob(childJob);
                runNext();
            } else {
                childJob.on("complete", function(){
                    runNext();
                });
                runJob(childJob);
            }
        }
    }
    runNext();

    return this;
}
Job.prototype.success = function(returnValue){
    this.returnValue = returnValue;
    this.emit("success", returnValue);
    this.successful = true;
    this.emit("complete", this.returnValue);
    this.complete = true;
}
Job.prototype.fail = function(returnValue){
    this.returnValue = returnValue;
    this.emit("fail", returnValue);
    this.successful = false;
    this.emit("complete", returnValue);
    this.complete = true;    
}

exports.Job = Job;
