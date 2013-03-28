var EventEmitter = require("events").EventEmitter,
    Thing = require("nature").Thing,
    util = require("util");

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

function JobOptions(){
    Thing.call(this);
    this.define({ name: "name", type: "string", required: true })
        .define({ name: "runOn", type: "string" })
        .define({ name: "parallel", type: "boolean", default: false })
        .define({ name: "args", type: Array })
        .define({ name: "children", type: Array })
        .define({ name: "data" })
        .define({ name: "command", type: "function" })
        .define({ name: "commandSync", type: "function" });
}
util.inherits(JobOptions, Thing);

function Job(options){
    var config = new JobOptions().set(options);
    if (!config.valid){
        throw new Error(config.errors.map(function(err){return JSON.stringify(err);}).join("\n"));
    }
    var self = this;
    this.name = config.name;
    this.data = config.data;
    this.parallel = config.parallel;
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
    this.errors = [];
    this.running = false;
    this.progress = null;
    this.successful = false;
    this.terminated = false;
    this.complete = false;
    this.ignored = false;
}
util.inherits(Job, EventEmitter);
Job.prototype.add = function(job){
    var self = this;
    if (Array.isArray(job)){
        job.forEach(function(j){
            self.add(j);
        });
    } else {
        this.children.push(job instanceof Job ? job : new Job(job));
    }
    return this;
};
Job.prototype.run = function(){
    var self = this;
    this.starting();
    
    function runChild(child){
        child.on("monitor", function(j){
            self.emit("monitor", j);
        });
        if (!child.runOn){
            child.run();
        } else if (child.runOn == "success" && self.successful === true){
            child.run();
        } else if (child.runOn == "fail" && self.successful === false){
            child.run();
        } else if (child.runOn == "terminated" && self.terminated === true){
            child.run();
        } else {
            child.ignore();
        }
    }

    // on command completion, run children
    this.on("complete", function(){
        var i = 0;
        function runNext(){
            var childJob = self.children[i++];
            if (childJob){
                if (childJob.parallel){
                    runChild(childJob);
                    runNext();
                } else {
                    childJob.on("complete", function(){
                        runNext();
                    });
                    runChild(childJob);
                }
            }
        }
        runNext();
        this.emit("monitor", this);
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
        } else {
            this.success();
        }

    } catch(e){
        this.error(e);
    }

    return this;
}
Job.prototype.starting = function(){
    this.running = true;
    this.emit("starting", this);
    this.emit("monitor", this);
}
Job.prototype.success = function(returnValue){
    this.returnValue = returnValue;
    this.running = false;
    this.successful = true;
    this.complete = true;
    this.emit("success", this);
    this.emit("monitor", this);
    this.emit("complete", this);
};
Job.prototype.fail = function(returnValue){
    this.returnValue = returnValue;
    this.running = false;
    this.successful = false;
    this.complete = true;    
    this.emit("fail", this);
    this.emit("monitor", this);
    this.emit("complete", this);
};
Job.prototype.terminate = function(){
    this.running = false;
    this.terminated = true;
    this.successful = false;
    this.complete = true;    
    this.emit("terminated", this);
    this.emit("monitor", this);
    this.emit("complete", this);
};
Job.prototype.ignore = function(){
    this.running = false;
    this.ignored = true;
    this.complete = true;
    this.emit("ignored", this);
    this.emit("monitor", this);
    this.emit("complete", this);
}
Job.prototype.inform = function(info){
    this.emit("info", info, this);
    this.emit("monitor", this);
};
Job.prototype.setProgress = function(progress){
    this.progress = progress;
    this.emit("progress", progress, this);
    this.emit("monitor", this);
};
Job.prototype.error = function(err){
    this.errors.push(err);
    this.fail();
    if (this.listeners("error").length > 0){
        this.emit("error", err);
    }
    this.emit("monitor", this);
};
Job.prototype.print = function(indent){
    indent = indent || 0;
    var padding = "";
    for(var i=0; i<indent; i++){
        padding += " ";
    }
    l("%s%s [progress: %s, running: %s, successful: %s, complete: %s, errors: %s, terminated: %s, ignored: %s]", padding, this.name, this.progress && this.progress.percentComplete, this.running, this.successful, this.complete, this.errors, this.terminated, this.ignored);
    this.children.forEach(function(child){
        child.print(indent + 2);
    });
};

exports.Job = Job;
