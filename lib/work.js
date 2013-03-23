/**
Bout dat work. 
@module work
*/

function l(msg){
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(this, args);
}

var EventEmitter = require("events").EventEmitter,
    Timer = require("timepiece").Stopwatch,
    util = require("util"),
    nature = require("nature");

function Queue(options){
    var config = new nature.Thing()
        .define({ name: "name", type: "string", required: true })
        .define({ name: "onComplete", type: Queue })
        .define({ name: "parent", type: Job })
        .set(options);
        
    if (!config.valid) {
        this.emitError(new Error(JSON.stringify(config.errors)));
    }
    
    var _jobs = [];
    var self = this;
    
    this.parent = config.get("parent");
    
    /**
    @property timer
    @type Timer
    */
    this.timer = null;
    
    /**
    @property name
    @type string
    */
    this.name = config.get("name");
    
    /**
    @property complete
    @type boolean
    */
    this.complete = false;
    
    /**
    @property jobs
    @type Array
    */    
    Object.defineProperty(this, "jobs", { enumerable: true, get: getJobs });
    function getJobs(){
        return _jobs.map(function(job){ return job; });
    }
    
    /**
    @method add
    @param Job job
    */
    this.add = function(job){
        var self = this;
        if (job instanceof Job){
            job.parent = this;
            job.queuePosition = _jobs.length + 1;
            _jobs.push(job);
        } else if (Array.isArray(job)){
            var jobs = job;
            jobs.forEach(function(job){
                self.add(job);
            });

        } else {
            job.parent = this;
            job.queuePosition = _jobs.length + 1;
            _jobs.push(new Job(job));
        }
        return this;
    };

    /**
    @method start
    */
    this.start = function(){
        self.emitStarting();
        var i = 0;
        var waitingFor = [];
        
        // need to reduce `start` and `startQueue` to just `start`.. one execution queue. 
        function runNext(){
            var job = _jobs[i++];
            if (job){
               job .on("queue-starting", function(queue){ 
                       self.emit("queue-starting", queue); 
                       waitingFor.push[queue];
                   })
                   .on("queue-complete", function(queue){ 
                       self.emit("queue-complete", queue); 
                       var index = waitingFor.indexOf(queue);
                       if (index > -1){
                           waitingFor.splice(index, 1);
                           runNext();
                       }
                   })
                   .on("job-starting", function(job){ self.emit("job-starting", job); })
                   .on("job-progress", function(job, progress){ self.emit("job-progress", job, progress); })
                   .on("job-complete", function(job){
                       self.emit("job-complete", job);
                       if (!self.complete && _jobs.every(function(job){ return job.complete })){
                           self.emitComplete();
                       }
                   })
                   .on("job-success", function(job){ 
                       self.emit("job-success", job); 
                   })
                   .on("job-fail", function(job){ self.emit("job-fail", job); })
                   .on("job-info", function(job, msg){ self.emit("job-info", job, msg); })
                   .on("job-warning", function(job, msg){ self.emit("job-warning", job, msg); })
                   .on("job-error", function(job, err){ self.emit("job-error", job, err); })
                   .on("job-terminated", function(job){ self.emit("job-terminated", job); });
                   
               if (job.parallel){
                   job.run();
                   if (waitingFor.length == 0) runNext();
               } else {
                   job.on("job-complete", function(j){
                       if (j === job && waitingFor.length == 0) runNext();
                   })
                   job.run();
               }
            }
        }
        
        runNext();
        return this;
    };
}
util.inherits(Queue, EventEmitter);

/**
@event queue-starting
@param queue
*/
Queue.prototype.emitStarting = function(queue){
    this.timer = new Timer().start();
    this.emit("queue-starting", queue || this);
};
/**
@event queue-complete
@param queue
*/
Queue.prototype.emitComplete = function(queue){
    this.timer.stop();
    this.complete = true;
    this.emit("queue-complete", queue || this); 
};
/**
@event queue-info
@param queue
@param msg
*/
Queue.prototype.emitInfo = function(msg){
    this.emit("queue-info", this, msg); 
};
/**
@event error
@param queue
@param error
*/
Queue.prototype.emitError = function(error){
    this.emit("error", error); 
};
Queue.prototype.toString = function(){
    return this.name;
};

/**
@method print
*/
Queue.prototype.print = function(){
    this.jobs.forEach(function(job){
        console.log("job: %s, parallel: %s", job.name, job.parallel);
        if (job.onSuccess.jobs.length){
            console.log("onSuccess Queue:");
        }
        job.onSuccess.jobs.forEach(function(job){
            console.log("    job: %s, parallel: %s", job.name, job.parallel);
        });
        if (job.onFail.jobs.length){
            console.log("onFail Queue:");
        }
        job.onFail.jobs.forEach(function(job){
            console.log("    job: %s, parallel: %s", job.name, job.parallel);
        });
    });
}

/**
@class Job
@constructor
*/
function Job(options){
    var self = this;
    var config = new nature.Thing()
        .define({ name: "name", type: "string", required: true })
        .define({ name: "command", type: "function" })
        .define({ name: "commandSync", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "data" })
        .define({ name: "parallel", type: "boolean", default: false })
        .define({ name: "onSuccess", type: Queue })
        .define({ name: "parent", type: Queue })
        .define({ name: "retVal" })
        .define({ name: "queuePosition", type: "number" })
        .define({ name: "previous", type: Job })
        .define({ name: "next", type: Job })
        .set(options);
        
    if (!config.valid) {
        this.emitError(new Error(JSON.stringify(config.errors)));
    }

    /**
    @property name
    @type string
    */
    this.name = config.get("name");

    /**
    @property data
    @type Any
    */
    this.data = config.get("data");

    /**
    @property command
    @type function
    */
    this.command = config.get("command");

    /**
    @property commandSync
    @type function
    */
    this.commandSync = config.get("commandSync");

    /**
    @property args
    @type Array
    */
    this.args = config.get("args");

    /**
    @property complete
    @type boolean
    */
    this.complete = false;
    
    /**
    @property timer
    @type Timer
    */
    this.timer = null;
    
    /**
    @property parallel
    @type boolean
    */
    this.parallel = config.get("parallel");
    
    /**
    @property onSuccess
    @type Queue
    */
    if (config.hasValue("onSuccess")){
        this.onSuccess = config.get("onSuccess");
        this.onSuccess.parent = this;
    } else {
        this.onSuccess = new Queue({ 
            name: this.name + " onSuccess",
            parent: this
        });
    }

    /**
    @property onFail
    @type Queue
    */
    this.onFail = new Queue({ name: this.name + " onFail" });

    /**
    @property onTerminate
    @type Queue
    */
    this.onTerminate = new Queue({ name: this.name + " onTerminate" });
    
    /**
    @property parent
    @type Queue
    */
    this.parent = config.get("parent");

    /**
    @property queuePosition
    @type Number
    */
    this.queuePosition = config.get("queuePosition");
    
    /**
    @property previous
    @type Job
    */
    Object.defineProperty(this, "previous", { enumberable: true, get: getPrevious });
    function getPrevious(){
        return this.parent.jobs[this.queuePosition-2];
    }
}
util.inherits(Job, EventEmitter);

Job.prototype.command = function(){
    throw new Error("Job has no command: " + this.name);
}

Job.prototype.run = function(){
    this.emitStarting();
    try{
        if (this.command){
            this.command.apply(this, this.args);
        } else if (this.commandSync){
            var retVal = this.commandSync.apply(this, this.args);
            // if the above command called `emitSuccess/Fail` then `complete` will already be set, 
            // if not set, assume success
            if (!this.complete){
                this.emitSuccess(retVal);
            }
        }

    } catch(e){
        this.emitError(e);
    }
};

Job.prototype.startQueue = function(queue, done){
    var self = this;
    if (queue.jobs.length){
        queue
            .on("queue-starting", function(queue){ self.emit("queue-starting", queue); })
            .on("queue-complete", function(queue){ 
                self.emit("queue-complete", queue); 
                done();
            })
            .on("job-starting", function(job){ self.emit("job-starting", job); })
            .on("job-progress", function(job, progress){ self.emit("job-starting", job, progress); })
            .on("job-complete", function(job){ self.emit("job-complete", job); })
            .on("job-success", function(job){ self.emit("job-success", job); })
            .on("job-fail", function(job){ self.emit("job-fail", job); })
            .on("job-terminated", function(job){ self.emit("job-terminated", job); })
            .on("job-info", function(job, msg){ self.emit("job-info", job, msg); })
            .on("job-warning", function(job, msg){ self.emit("job-warning", job, msg); })
            .on("job-verbose", function(job, msg){ self.emit("job-verbose", job, msg); })
            .on("job-error", function(job, error){ self.emit("job-error", job, error); })
            .start();
    } else {
        done();
    }
};

/**
@event job-starting
@param Object job
*/
Job.prototype.emitStarting = function(){
    this.timer = new Timer().start();
    this.emit("job-starting", this);
};

/**
@event job-info
@param Object job
@param String message
*/
Job.prototype.emitInfo = function(msg){
    this.emit("job-info", this, msg);
};

/**
@event job-verbose
@param Object job
@param String message
*/
Job.prototype.emitVerbose = function(msg){
    this.emit("job-verbose", this, msg);
};

/**
@event job-complete
@param Object job
*/
Job.prototype.emitComplete = function(){
    this.timer && this.timer.stop();
    this.complete = true;
    this.emit("job-complete", this);
};

/**
@event job-success
@param Object job
*/
Job.prototype.emitSuccess = function(retVal){
    var self = this;
    this.retVal = retVal;
    this.emit("job-success", this);
    this.startQueue(this.onSuccess, function(){
        self.emitComplete();
    });
};

/**
@event job-fail
@param Object job
*/
Job.prototype.emitFail = function(){
    var self = this;
    this.emit("job-fail", this);
    this.startQueue(this.onFail, function(){
        self.emitComplete();
    });
};

/**
@event job-warning
@param Object job
*/
Job.prototype.emitWarning = function(msg){
    this.emit("job-warning", this, msg);
};

/**
@event job-error
@param Object job
@param Error error
*/
Job.prototype.emitError = function(err){
    this.emit("job-error", this, err);
    this.emitFail();
};

/**
@event job-terminated
@param Object job
*/
Job.prototype.emitTerminated = function(){
    var self = this;
    this.emit("job-terminated", this);
    this.startQueue(this.onTerminate, function(){
        self.emitComplete();
    });
};

/**
@event job-progress
@param Object job
@param Object progress
*/
Job.prototype.emitProgress = function(progress){
    this.emit("job-progress", this, progress);
};

exports.Job = Job;
exports.Queue = Queue;