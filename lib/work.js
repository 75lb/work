"use strict"; 
/**
Module dependencies
*/
var EventEmitter = require("events").EventEmitter,
    Thing = require("nature").Thing,
    util = require("util"),
    _ = require("underscore"),
    cursor = require("ansi")(process.stdout),
    sprintf = require("sprintf-js").sprintf;
    
var l = console.log;

/**
Event and state constants
*/
var S_PENDING = "pending", S_RUNNING = "running", S_SUCCESSFUL = "successful",
    S_FAILED = "failed", S_TERMINATED = "terminated", S_IGNORED = "ignored";
var E_STARTING = "starting", E_SUCCESS = "success", E_FAIL = "fail", E_TERMINATED = "terminated",
    E_IGNORED = "ignored", E_MONITOR = "monitor", E_ERROR = "job-error", E_COMPLETE = "complete",
    E_CHILDRENCOMPLETE = "childrenComplete", E_INFO = "info";

/**
Run when job reaches its final state. 
* Mark the progress as complete
* test whether this completes the parent's child jobs
* run the next job
*/
function jobFinished(){
    if (this.state !== E_IGNORED) this.event(E_COMPLETE);
    if (this.progress) this.progress.percentComplete = 100;
    
    if (this.children.length === 0) this.childrenComplete = true;
    if (this.parent){
        this.parent.childrenComplete = this.parent.children.every(function(job){ return job.complete; });
        if (this.parent.childrenComplete){
            this.parent.event(E_CHILDRENCOMPLETE);
        }
    }
    
    var firstChild = this.children[0];
    if (this.parallel){
        if (firstChild) firstChild.run();
    } else {
        if (firstChild){
            firstChild.run();
        } else if (this.next){
            this.next.run();
        } else if (this.parent && !this.parent.parallel && this.parent.next){
            this.parent.next.run();
        }
    }
    
}

/**
Job needs to be both a Thing and EE.. possibly move to nature.
*/
_.extend(Thing.prototype, EventEmitter.prototype);

/**
The Job class
*/
function Job(options){
    var self = this;
    Thing.call(this);
    
    /**
    Job properties
    */
    this.define({ name: "name", type: "string", required: true, default: "unnamed" })
        .define({ name: "runOn", type: "string" })
        .define({ name: "parallel", type: "boolean", default: false })
        .define({ name: "command", type: "function" })
        .define({ name: "commandSync", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "state", type: "string", default: "pending" })
        .define({ name: "children", type: Array, default: [] })
        .define({ name: "data" })
        .define({ name: "parent", type: Job })
        .define({ name: "previous", type: Job })
        .define({ name: "next", type: Job })
        .define({ name: "position", type: "number" })
        .define({ name: "returnValue" })
        .define({ name: "childrenComplete", type: "boolean" })
        .define({ name: "descendentsComplete", type: "boolean" })
        .define({ name: "info", type: Array, default: [] })
        .define({ name: "errors", type: Array, default: [] })
        .set(options);
    
    Object.defineProperty(this, "complete", { enumerable: true, get: function(){
        return [S_SUCCESSFUL, S_FAILED, S_TERMINATED, S_IGNORED].indexOf(self.state) > -1;
    }});
    this.progress = null;
    this.on("tmp", function(){}); 
    this.removeAllListeners();
    Object.preventExtensions(this);
    
    /**
    Crash if instantiated with invalid data
    */
    if (!this.valid){
        throw new Error(this.validationMessages.map(function(err){
            return JSON.stringify(err);
        }).join("\n"));
    }

    /**
    Initialiase child jobs
    */
    var children = this.children;
    this.children = [];
    children.forEach(function(childJob){
        self.add.call(self, childJob);
    });
    
    /**
    Propagate monitoring events up the tree
    */
    this.on(E_MONITOR, function(job, eventName, data){
        if (self.parent){
            self.parent.emit(E_MONITOR, job, eventName, data);
        }
        
        if (eventName == "descendentsComplete" && job !== self){
            self.descendentsComplete = self.children.every(function(job){ return job.childrenComplete; });
            if (self.descendentsComplete){
                self.emit("descendentsComplete");
                self.emit(E_MONITOR, self, "descendentsComplete");
            }
        }
    });

    this.on(E_CHILDRENCOMPLETE, function(){
        self.descendentsComplete = self.children.every(function(job){ return job.childrenComplete; });
        if (self.descendentsComplete){
            self.emit("descendentsComplete");
            self.emit(E_MONITOR, self, "descendentsComplete");
        }
    });
}
util.inherits(Job, Thing);

/**
add and initialise one or more jobs, adding traversal properties
*/
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
        job = job instanceof Job ? job : new Job(job);
        job.runOn = job.runOn || runOn;
        this.children.push(job);

        job.parent = this;
        job.position = this.children.length;
        job.previous = this.children[this.children.length-2]
        if (job.previous){
            job.previous.next = job;
        }
    }
    return this;
};

Job.prototype.run = function(){
    if(this.parallel){
        runParallel.call(this);
    } else {
        runSequential.call(this);
    }
    return this;
};

/**
Execute the `command`, else `commandSync` else just mark as successful.
If a `commandSync` doesn't call success() or fail() then it succeeded.
*/
function runCommand(){
    try{
        if (this.command){
            enterStarting.call(this);
            this.returnValue = this.command.apply(this, this.args);
        } else if (this.commandSync){
            enterStarting.call(this);
            this.returnValue = this.commandSync.apply(this, this.args);
            if (!this.complete){
                this.success();
            }
        } else {
            this.ignore();
        }

    } catch(e){
        this.error(e);
    }
}

function runSequential(){
    if(!this.runOn || (this.parent && this.runOn === this.parent.state)){
        runCommand.call(this);
    } else {
        this.ignore();
    }
}

function runParallel(){
    if(!this.runOn || (this.parent && this.runOn === this.parent.state)){
        runCommand.call(this);
        
        if (this.next){
            this.next.run();
        }
    } else {
        this.ignore();
    }
}

Job.prototype.getDepth = function(count){
    count = count || 0;
    return this.parent
        ? this.parent.getDepth(++count)
        : count;
};

Job.prototype.event = function(evt, data){
    this.emit(evt, data);
    this.emit(E_MONITOR, this, evt, data);
}

function enterStarting(){
    if (this.state !== S_RUNNING){
        this.state = S_RUNNING;
    } else {
        throw new Error(
            util.format("invalid state transition (%s->%s)", this.state, S_RUNNING, this.name)
        );
    }
    this.event(E_STARTING);
}
Job.prototype.success = function(){
    if (this.state === S_RUNNING){
        this.state = S_SUCCESSFUL;
    } else {
        throw new Error(
            util.format("invalid state transition (%s->%s)", this.state, S_SUCCESSFUL, this.name)
        );
    }
    this.event(E_SUCCESS);
    jobFinished.call(this);
};
Job.prototype.fail = function(){
    if (this.state === S_RUNNING){
        this.state = S_FAILED;            
    } else {
        throw new Error(
            util.format("invalid state transition (%s->%s)", this.state, S_FAILED, this.name)
        );
    }
    this.event(E_FAIL);
    jobFinished.call(this);
};
Job.prototype.terminate = function(){
    if (this.state === S_RUNNING){
        this.state = S_TERMINATED;
    } else {
        throw new Error(
            util.format("invalid state transition (%s->%s)", this.state, S_TERMINATED, this.name)
        );
    }
    this.event(E_TERMINATED);
    jobFinished.call(this);
};
Job.prototype.ignore = function(){
    if (this.state === S_PENDING){
        this.state = S_IGNORED;            
    } else {
        throw new Error(
            util.format("invalid state transition (%s->%s)", this.state, S_IGNORED, this.name)
        );
    }
    this.event(E_IGNORED);
    jobFinished.call(this);
}
Job.prototype.inform = function(info){
    this.info.push(info);
    this.event(E_INFO, info);
};
Job.prototype.setProgress = function(progress){
    this.progress = progress;
    this.event("progress", progress);
};
Job.prototype.error = function(err){
    this.errors.push(err);
    this.fail();
    this.event(E_ERROR, err);
};
Job.prototype.print = function(indent){
    indent = indent || 0;
    var padding = whiteSpace(indent);
    l(
        "%s%s [ %s%s ]",
        padding, 
        this.name, 
        this.runOn ? "runOn: " + this.runOn + ", " : "",
        this.parallel ? "parallel" : "sequential"
    );
    this.children.forEach(function(child){
        child.print(indent + 2);
    });
    return this;
};
Job.prototype.dashboard = function(){
    cursor.eraseData(2);
    this.on(E_MONITOR, function(){
        cursor.goto(1, 1);
        print(this, 0, { max: stream.rows-2, count: 0 });
    });
    return this;
};
Job.prototype.monitor = function(){
    var prevJob;
    this.on(E_MONITOR, function(job, evt, data){
        if (job === prevJob){
            cursor.previousLine();
        }
        printStateful(job.state);
        cursor.write(sprintf(
            "%-20.20s ✤ %-10s ✤ errors: %d ✤ info: %d ✤ %-10s\n",
            job.name, job.state, job.errors.length, job.info.length, evt
        ));
        if (evt === E_INFO || evt === E_ERROR){
            l(data);
            prevJob = null;
        } else {
            prevJob = job;
        }
    });
    return this;
};
Job.e = {
    STARTING: "starting",
    SUCCESS: "success",
    FAIL: "fail",
    TERMINATED: "terminated",
    IGNORED: "ignored",
    MONITOR: "monitor",
    ERROR: "error",
    COMPLETE: "complete",
    CHILDRENCOMPLETE: "childrenComplete",
    INFO: "info"
};

function print(job, indent, rows){
    indent = indent || 0;
    rows.count++;
    var padding = whiteSpace(indent);
    
    cursor.eraseLine(2);
    printStateful(job.state);

    cursor.write(padding)
        .bold().write(job.name).reset();
    
    if (job.runOn) cursor.write(" [on-" + job.runOn + "]");
    if (job.progress) cursor.write(" " + job.progress.percentComplete + "%");

    cursor.horizontalAbsolute(40);
    cursor.write(job.parallel ? "p " : "s ");
    cursor.write(" data: " + (job.data ? Object.keys(job.data) : ""));
    cursor.write(" errors: " + job.errors.length);
    cursor.write(" info: " + job.info.length);
    if (job.errors.length) cursor.write(" " + job.errors[0]);
    cursor.write("\n");

    job.children.forEach(function(child){
        if (rows.count < rows.max) print(child, indent + 2, rows);
    });
}
function printStateful(state){
    switch(state){
        case S_PENDING:
            cursor
                .fg.white()
                .write("□ ")
                .fg.reset();
            break;
        case S_RUNNING:
            cursor
                .fg.blue()
                .write("□ ")
                .fg.reset();
            break;
        case S_IGNORED:
            cursor
                .fg.red()
                .write("□ ")
                .fg.reset();
            break;
        case S_SUCCESSFUL: 
            cursor
                .fg.green()
                .write("■ ")
                .fg.reset();
            break;
        case S_FAILED: 
            cursor
                .fg.red()
                .write("■ ")
                .fg.reset();
            break;
        case S_TERMINATED: 
            cursor
                .fg.grey()
                .write("■ ")
                .fg.reset();
            break;
    }
}

function whiteSpace(length){
    for(var i=0, padding = ""; i<length; i++){
        padding += " ";
    }
    return padding;
}

exports.Job = Job;
