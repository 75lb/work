"use strict";

/**
Module dependencies
*/
var EventEmitter = require("events").EventEmitter,
    Thing = require("nature").Thing,
    util = require("util"),
    _ = require("underscore"),
    cursor = require("ansi")(process.stdout);

var l = console.log;

/**
Event and state constants
*/
var S_PENDING = "pending", S_RUNNING = "running", S_SUCCESSFUL = "successful",
    S_FAILED = "failed", S_TERMINATED = "terminated", S_IGNORED = "ignored";
var E_STARTING = "starting", E_SUCCESS = "success", E_FAIL = "fail", E_TERMINATED = "terminated",
    E_IGNORED = "ignored", E_MONITOR = "monitor", E_ERROR = "error", E_COMPLETE = "complete";

function setComplete(){
    /*jshint validthis:true */
    if (this.progress) this.progress.percentComplete = 100;
    this.event(E_COMPLETE);
}

/**
Execute the `command`, else `commandSync` else just mark as successful.
If a `commandSync` doesn't call success() or fail() then it succeeded.
*/
function runCommand(){
    /*jshint validthis:true */
    try{
        if (this.command){
            this.returnValue = this.command.apply(this, this.args);
        } else if (this.commandSync){
            this.returnValue = this.commandSync.apply(this, this.args);
            if (!this.complete){
                this.success();
            }
        } else {
            this.success();
        }

    } catch(e){
        l("ERROR", e);
        this.error(e);
    }
}

function runSequential(){
    /*jshint validthis:true */
    var self = this;
    function runNext(){
        var firstChild = self.children[0];
        if (firstChild){
            firstChild.run();
        } else if (self.next){
            self.next.run();
        } else if (self.parent && self.parent.next){
            self.parent.next.run();
        }
    }

    this.on(E_COMPLETE, runNext)
        .on(E_IGNORED, runNext);

    if(!this.runOn || this.runOn === this.parent.state){
        this.starting();
        runCommand.call(this);
    } else {
        this.ignore();
    }
}

function runParallel(){
    /*jshint validthis:true */
    var self = this;

    var firstChild = this.children[0];
    if (firstChild){
        this.on(E_COMPLETE, function(){
            firstChild.run();
        });
        this.on(E_IGNORED, function(){
            firstChild.run();
        });
    }
    
    if(!this.runOn || this.runOn === this.parent.state){
        this.starting();
        runCommand.call(this);
        
        if (self.next){
            self.next.run();
        }
    } else {
        this.ignore();
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
        .set(options);
    
    Object.defineProperty(this, "complete", { enumerable: true, get: function(){
        return [S_SUCCESSFUL, S_FAILED, S_TERMINATED, S_IGNORED].indexOf(self.state) > -1;
    }});
    this.progress = null;
    this.info = [];
    this.on("tmp", function(){}); 
    this.removeAllListeners();
    Object.preventExtensions(this);
    
    /**
    Crash if instantiated with invalid data
    */
    if (!this.valid){
        throw new Error(this.errors.map(function(err){return JSON.stringify(err);}).join("\n"));
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

    this.on("childrenComplete", function(){
        self.descendentsComplete = self.children.every(function(job){ return job.childrenComplete; });
        if (self.descendentsComplete){
            self.emit("descendentsComplete");
            self.emit(E_MONITOR, self, "descendentsComplete");
        }
    });
    this.on(E_COMPLETE, function(){
        if (self.children.length === 0) self.childrenComplete = true;
        if (self.parent){
            self.parent.childrenComplete = self.parent.children.every(function(job){ return job.complete; });
            if (self.parent.childrenComplete){
                self.parent.emit("childrenComplete");
                self.parent.emit(E_MONITOR, self.parent, "childrenComplete");
            }
        }
    });
    
    /**
    State Machine.
    -> Running
    -> Successful
    -> Failed
    */
    this.on(E_STARTING, function(){
        if (self.state !== S_RUNNING){
            self.state = S_RUNNING;
        } else {
            throw new Error(
                util.format("invalid state transition (%s->%s)", self.state, S_RUNNING)
            );
        }
    });
    this.on(E_SUCCESS, function(){
        if (self.state === S_RUNNING){
            self.state = S_SUCCESSFUL;
            setComplete.call(this);
        } else {
            throw new Error(
                util.format("invalid state transition (%s->%s)", self.state, S_SUCCESSFUL)
            );
        }
    });
    this.on(E_FAIL, function(){
        if (self.state === S_RUNNING){
            self.state = S_FAILED;            
            setComplete.call(this);
        } else {
            throw new Error(
                util.format("invalid state transition (%s->%s)", self.state, S_FAILED)
            );
        }
    });
    this.on(E_TERMINATED, function(){
        if (self.state === S_RUNNING){
            self.state = S_TERMINATED;
            setComplete.call(this);
        } else {
            throw new Error(
                util.format("invalid state transition (%s->%s)", self.state, S_TERMINATED)
            );
        }
    });
    this.on(E_ERROR, function(err){
        this.errors.push(err);
        self.event(E_FAIL);
        // if (this.listeners("error").length > 0){
        //     this.emit("error", err);
        // }        
    });
    this.on(E_IGNORED, function(){
        if (self.state === S_PENDING){
            self.state = S_IGNORED;            
        } else {
            throw new Error(
                util.format("invalid state transition (%s->%s)", self.state, S_IGNORED)
            );
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


Job.prototype.event = function(event, data){
    this.emit(event, data);
    this.emit(E_MONITOR, this, event, data);
}

Job.prototype.starting = function(){
    this.event(E_STARTING);
}
Job.prototype.success = function(){
    this.event(E_SUCCESS);
};
Job.prototype.fail = function(){
    this.event(E_FAIL);
};
Job.prototype.terminate = function(){
    this.event(E_TERMINATED);
};
Job.prototype.ignore = function(){
    this.event(E_IGNORED);
}
Job.prototype.inform = function(info){
    this.info.push(info);
    this.event("info", info);
};
Job.prototype.setProgress = function(progress){
    this.progress = progress;
    this.event("progress", progress);
};
Job.prototype.error = function(err){
    this.event(E_ERROR, err);
};
Job.prototype.print = function(indent){
    indent = indent || 0;
    var padding = "";
    for(var i=0; i<indent; i++){
        padding += " ";
    }
    l(
        "%s%s [runOn: %s, state: %s, children: %s, err: %s]",
        padding, 
        this.name, 
        this.runOn || "", 
        this.state, 
        this.children.length,
        JSON.stringify(this.errors)
    );
    this.children.forEach(function(child){
        child.print(indent + 2);
    });
    return this;
};
Job.prototype.monitor = function(stream){
    if (stream.isTTY){
        cursor.eraseData(2);
        this.on(E_MONITOR, function(){
            cursor.goto(1, 1);
            print(this, 0, { max: stream.rows-2, count: 0 });
        });
    }
    return this;
}

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
    cursor.write(" state: " + job.state);
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
    for(var i=0, padding = ""; i<length; i++){
        padding += " ";
    }
    return padding;
}

Job.prototype.depth = function(count){
    count = count || 0;
    return this.parent
        ? this.parent.depth(++count)
        : count;
};

exports.Job = Job;
