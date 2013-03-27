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
    if (!config.valid){
        throw new Error(config.errors.map(function(err){return JSON.stringify(err);}).join("\n"));
    }
    var self = this;
    this.name = config.name;
    this.parallel = config.parallel;
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
    // l("STARTING: %s", this.name);

    function runChild(child){
        // l("child name: %s, runOn: %s", child.name, child.runOn);
        if (!child.runOn){
            child.run();
        } else if (child.runOn == "success" && self.successful === true){
            child.run();
        } else if (child.runOn == "fail" && self.successful === false){
            child.run();
        } else {
            // l("warning, child job ignored: " + child.name);
            child.emit("complete");
        }
    }

    // on command completion, run children
    this.on("complete", function(){
        // l("COMPLETE: %s", this.name);
        // l("job: %s, successful: %s", self.name, self.successful);
        var i = 0;
        function runNext(){
            var childJob = self.children[i++];
            if (childJob){
                // l("running child %d of %s.. parallel: ", i-1, self.name, childJob.parallel);
                if (childJob.parallel){
                    runChild(childJob);
                    runNext();
                } else {
                    childJob.on("complete", function(){
                        // l(childJob.name);
                        runNext();
                    });
                    runChild(childJob);
                }
            }
        }
        runNext();        
    });

    // run the command
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

    return this;
}
Job.prototype.success = function(returnValue){
    // l("SUCCESS: %s", this.name);
    this.returnValue = returnValue;
    this.emit("success", returnValue);
    this.successful = true;
    this.emit("complete", this.returnValue);
    this.complete = true;
}
Job.prototype.fail = function(returnValue){
    // l("FAIL: %s", this.name);
    this.returnValue = returnValue;
    this.emit("fail", returnValue);
    this.successful = false;
    this.emit("complete", returnValue);
    this.complete = true;    
}

exports.Job = Job;
