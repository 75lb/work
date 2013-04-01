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
        .define({ name: "commandSync", type: "function" })
        .define({ name: "parent", type: Job });
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
    this.info = [];
}
util.inherits(Job, EventEmitter);
Job.prototype.add = function(job, runOn){
    var self = this, previous;
    if (Array.isArray(job)){
        job.forEach(function(j){
            self.add(j, runOn);
        });
    } else {
        if (job instanceof Job && this.children.indexOf(job) > -1){
            throw new Error("You cannot add the same Job instance twice: " + job.name);
        }
        job = job instanceof Job ? job : new Job(job);
        job.runOn = job.runOn || runOn;
        job.parent = this;
        this.children.push(job);
        job.position = this.children.length;
        if (previous = this.children[this.children.length-2]){
            job.previous = previous
            previous.next = job;
        }
        job.on("monitor", function(job, eventName){
            this.parent.emit("monitor", job, eventName);
        });
        
    }
    return this;
};
Job.prototype.run = function(){
    var self = this;
    this.starting();
    
    if (!this.parallel) this.on("complete", runNext).on("ignored", runNext);
        
    function runNext(){
        var firstChild = self.children[0];
        if (firstChild){
            firstChild.run();
        } else if (self.next){
            self.next.run();
        } else if (self.parent.next){
            self.parent.next.run();
        }
    }

    function runCommand(){
        try{
            if (self.command){
                self.command.apply(self, self.args);
            } else if (self.commandSync){
                self.retVal = self.commandSync.apply(self, self.args);
                // if the supplied command did not already call success() or fail() then assume success
                if (!self.complete){
                    self.success(self.retVal);
                }
            } else {
                self.success();
            }

        } catch(e){
            self.error(e);
        }
    }

    if (!this.runOn){
        runCommand();
    } else if (this.runOn == "success" && this.parent.successful === true){
        runCommand();
    } else if (child.runOn == "fail" && this.parent.successful === false){
        runCommand();
    } else if (child.runOn == "terminated" && this.parent.terminated === true){
        runCommand();
    } else {
        this.ignore();
    }
    if (this.parallel) runNext();

    return this;
}
Job.prototype.starting = function(){
    this.running = true;
    this.emit("starting", this);
    this.emit("monitor", this, "starting");
}
Job.prototype.success = function(returnValue){
    this.returnValue = returnValue;
    this.running = false;
    this.successful = true;
    this.emit("monitor", this, "success");
    this.emit("success", this);
    this.setComplete();
};
Job.prototype.fail = function(returnValue){
    this.returnValue = returnValue;
    this.running = false;
    this.successful = false;
    this.emit("monitor", this, "fail");
    this.emit("fail", this);
    this.setComplete();
};
Job.prototype.terminate = function(){
    this.running = false;
    this.terminated = true;
    this.successful = false;
    this.emit("monitor", this, "terminated");
    this.emit("terminated", this);
    this.setComplete();
};
Job.prototype.ignore = function(){
    this.running = false;
    this.ignored = true;
    this.emit("monitor", this, "ignored");
    this.emit("ignored", this);
}
Job.prototype.inform = function(info){
    this.info.push(info);
    this.emit("info", info, this);
    this.emit("monitor", this, "info");
};
Job.prototype.setProgress = function(progress){
    this.progress = progress;
    this.emit("monitor", this, "progress");
    this.emit("progress", progress, this);
};
Job.prototype.setComplete = function(){
    this.complete = true;
    if (this.progress) this.progress.percentComplete = 100;
    this.emit("monitor", this, "complete");
    this.emit("complete", this);
};
Job.prototype.error = function(err){
    this.errors.push(err);
    this.fail();
    this.emit("monitor", this, "error");
    // if (this.listeners("error").length > 0){
        this.emit("error", err);
    // }
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
            print(this, 0, { max: stream.rows-2, count: 0 });
        });
    }
    return this;
}
exports.Job = Job;

function print(job, indent, rows){
    indent = indent || 0;
    rows.count++;
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
    cursor.write(" errors: " + job.errors.length);
    cursor.write(" info: " + job.info.length);
    cursor.write("\n");
        
    job.children.forEach(function(child){
        if (rows.count < rows.max) print(child, indent + 2, rows);
    });
}
function printStateful(options){
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