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
        .define({ name: "progress", default: null })
        .define({ name: "data" })
        .define({ name: "running", type: "boolean" })
        .define({ name: "successful", type: "boolean" })
        .define({ name: "terminated", type: "boolean" })
        .define({ name: "complete", type: "boolean" })
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
    this.data = config.data;
    this.parallel = config.parallel;
    this.running = config.running;
    this.progress = config.progress;
    this.successful = config.successful;
    this.terminated = config.terminated;
    this.complete = config.complete;
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
    this.running = true;
    this.emit("starting", this);
    this.emit("monitor", this);

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
            child.emit("complete");
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
Job.prototype.terminated = function(){
    this.running = false;
    this.successful = false;
    this.complete = true;    
    this.emit("terminated", this);
    this.emit("monitor", this);
    this.emit("complete", this);
};
Job.prototype.info = function(info){
    this.emit("info", info, this);
    this.emit("monitor", this);
};
Job.prototype.progress = function(progress){
    this.progress = progress;
    this.emit("progress", progress, this);
    this.emit("monitor", this);    
}

Job.prototype.print = function(indent){
    indent = indent || 0;
    var padding = "";
    for(var i=0; i<indent; i++){
        padding += " ";
    }
    l("%s%s", padding, this.name);
    this.children.forEach(function(child){
        child.print(indent + 2);
    });
};

exports.Job = Job;
