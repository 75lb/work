var EventEmitter = require("events").EventEmitter,
    Thing = require("nature").Thing,
    util = require("util"),
    cursor = require("ansi")(process.stdout);

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
    this.running = null;
    this.progress = null;
    this.successful = null;
    this.terminated = null;
    this.complete = null;
    this.ignored = null;
}
util.inherits(Job, EventEmitter);
Job.prototype.add = function(job, runOn){
    var self = this;
    if (Array.isArray(job)){
        job.forEach(function(j){
            self.add(j, runOn);
        });
    } else {
        if (job instanceof Job && this.children.indexOf(job) > -1){
            throw new Error("You cannot add the same Job instance twice: " + job.name);
        }
        job.runOn = job.runOn || runOn;
        this.children.push(job instanceof Job ? job : new Job(job));
    }
    return this;
};
Job.prototype.run = function(){
    var self = this;
    this.starting();
    
    this.on("complete", runChildren)
        .on("ignored", runChildren);
    function runChildren(){
        function runChild(child){
            child.on("monitor", function(job){
                self.emit("monitor", job);
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

        var i = 0;
        function runNext(){
            var childJob = self.children[i++];
            if (childJob){
                if (childJob.parallel){
                    runChild(childJob);
                    runNext();
                } else {
                    childJob.on("complete", runNext);
                    childJob.on("ignored", runNext);
                    runChild(childJob);
                }
            }
        }
        runNext();
    }

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
    this.emit("success", this);
    this.emit("monitor", this);
    this.setComplete();
};
Job.prototype.fail = function(returnValue){
    this.returnValue = returnValue;
    this.running = false;
    this.successful = false;
    this.emit("fail", this);
    this.emit("monitor", this);
    this.setComplete();
};
Job.prototype.terminate = function(){
    this.running = false;
    this.terminated = true;
    this.successful = false;
    this.emit("terminated", this);
    this.emit("monitor", this);
    this.setComplete();
};
Job.prototype.ignore = function(){
    this.running = false;
    this.ignored = true;
    this.emit("ignored", this);
    this.emit("monitor", this);
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
Job.prototype.setComplete = function(){
    this.complete = true;
    if (this.progress) this.progress.percentComplete = 100;
    this.emit("complete", this);
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
    l("%s%s [rO: %s, p: %s, r: %s, s: %s, c: %s, e: %s, t: %s, i: %s]", padding, this.name, this.runOn || "", this.progress ? this.progress.percentComplete : "", this.running, this.successful, this.complete, this.errors, this.terminated, this.ignored);
    this.children.forEach(function(child){
        child.print(indent + 2);
    });
};
Job.prototype.monitor = function(stream){
    if (stream.isTTY){
        this.on("monitor", function(job){
            cursor.eraseData(2);
            cursor.goto(1, 1);
            print(this);
        });
    }
    return this;
}
exports.Job = Job;

function print(job, indent){
    indent = indent || 0;
    var padding = whiteSpace(indent);
    
    printStateful({
        state: job.successful,
        "null": "□ ",
        "true": "■ ",
        "false": "■ "
    });

    cursor.write(padding)
        .bold().write(job.name).reset();
    
    if (job.runOn) cursor.write(" [on-" + job.runOn + "]");
    if (job.progress) cursor.write(" " + job.progress.percentComplete + "%");

    cursor.horizontalAbsolute(40);
    printStateful({ state: job.running, any: " running"});
    printStateful({ state: job.successful, any: " successful"});
    printStateful({ state: job.complete, any: " complete"});
    printStateful({ state: job.terminated, any: " terminated"});
    printStateful({ state: job.ignored, any: " ignored"});
    cursor.write(" " + job.errors)
    cursor.write("\n");
        
    job.children.forEach(function(child){
        print(child, indent + 2);
    });
}
function printStateful(options){
    // {
    //     any: "", true: "", false: "", null: "",
    //     state: bool
    // }
    switch(options.state){
        case null: 
            cursor
                .fg.white()
                .write(options.null || options.any)
                .fg.reset();
            break;
        case true: 
            cursor
                .fg.green()
                .write(options.true || options.any)
                .fg.reset();
            break;
        case false: 
            cursor
                .fg.red()
                .write(options.false || options.any)
                .fg.reset();
            break;
    }
}

function whiteSpace(length){
    var padding = "";
    for(var i=0; i<length; i++){
        padding += " ";
    }
    return padding;
}