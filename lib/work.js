/**
Bout dat work. 
@module work
*/

function l(msg){console.log(msg)}

var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util"),
    cm = require("../../config-master");

function Queue(options){
    var _jobs = [];
    var self = this;
    options = options || {};
    
    /**
    @property timer
    @type Timer
    */
    this.timer = null;
    
    /**
    @property name
    @type string
    */
    this.name = options.name;
    
    /**
    @property complete
    @type boolean
    */
    this.complete = false;
    
    /**
    @property state
    @type Object
    */
    Object.defineProperty(this, "state", { enumerable: true, configurable: true, get: function(){
        return JSON.stringify({
            name: this.name,
            jobs: {
                total: _jobs.length
            }
        });
    }});

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
            _jobs.push(job);
        } else if (Array.isArray(job)){
            var jobs = job;
            jobs.forEach(function(job){
                self.add(job);
            });

        } else {
            _jobs.push(new Job(job));
        }
        return this;
    };

    /**
    @method start
    */
    this.start = function(){
        self.emitStarting();
        var jobIndex = 0;
        
        function runJob(){
            var job = _jobs[jobIndex++];
            if (job){
               job.on("queue-starting", function(queue){ self.emit("queue-starting", queue); })
                   .on("queue-complete", function(queue){ self.emit("queue-complete", queue); })
                   .on("job-starting", function(job){ self.emit("job-starting", job); })
                   .on("job-progress", function(state, progress){ self.emit("job-progress", state, progress); })
                   .on("job-complete", function(state){
                       self.emit("job-complete", state);
                       if (!self.complete && _jobs.every(function(job){ return job.complete })){
                           self.emitComplete();
                       }
                   })
                   .on("job-success", function(job){ 
                       self.emit("job-success", job); 
                   })
                   .on("job-fail", function(state){ self.emit("job-fail", state); })
                   .on("job-info", function(state, msg){ self.emit("job-info", state, msg); })
                   .on("job-warning", function(state, msg){ self.emit("job-warning", state, msg); })
                   .on("job-error", function(state, err){ self.emit("job-error", state, err); })
                   .on("job-terminated", function(state){ self.emit("job-terminated", state); });
                   
               if (job.async){
                   job.run();
                   runJob();
               } else {
                   job.on("job-complete", function(){
                       runJob(); 
                   })
                   job.run();
               }
            }
        }
        
        runJob();
        return this;
    };
}
util.inherits(Queue, EventEmitter);

/**
@event queue-starting
@param state
*/
Queue.prototype.emitStarting = function(queue){
    this.timer = new Timer().start();
    this.emit("queue-starting", queue || this);
};
/**
@event queue-complete
@param state
*/
Queue.prototype.emitComplete = function(queue){
    this.timer.stop();
    this.complete = true;
    this.emit("queue-complete", queue || this); 
};

Queue.prototype.emitInfo = function(msg){
    this.emit("queue-info", this.state, msg); 
};

/**
@method print
*/
Queue.prototype.print = function(){
    this.jobs.forEach(function(job){
        console.log(job.name);
        job.onSuccess.jobs.forEach(function(job){
            console.log("   " + job.name);
        });
        job.onFail.jobs.forEach(function(job){
            console.log("   " + job.name);
        });
    });
}

/**
@class Job
@constructor
*/
function Job(options){
    var self = this;
    var config = new cm.Config()
        .define({ name: "name", type: "string", required: true })
        .define({ name: "command", type: "function" })
        .define({ name: "commandSync", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "data" })
        .define({ name: "async", type: "boolean", default: false })
        .define({ name: "onSuccess", type: Queue })
        .set(options);
        
    if (!config.isValid){
        throw new Error(config.errors);
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
    @property async
    @type boolean
    */
    this.async = config.get("async");
    
    /**
    @property state
    @type Object
    */
    Object.defineProperty(this, "state", { enumerable: true, get: function(){
        return JSON.stringify({
            name: self.name
        });
    }});

    /**
    @property onSuccess
    @type Queue
    */
    this.onSuccess = config.hasValue("onSuccess") ? config.get("onSuccess") : new Queue({ name: this.name + " onSuccess" });

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
            this.commandSync.apply(this, this.args);
            // if the above command called `emitSuccess/Fail` then `complete` will be set, 
            // if not set, assume success
            if (!this.complete){
                this.emitSuccess();
            }
        }

    } catch(e){
        this.emitError(e);
    }
};

Job.prototype.startQueue = function(queue){
    var self = this;
    if (queue.jobs.length){
        queue
            .on("queue-starting", function(queue){ self.emit("queue-starting", queue); })
            .on("queue-complete", function(queue){ self.emit("queue-complete", queue); })
            .on("job-starting", function(job){ self.emit("job-starting", job); })
            .on("job-progress", function(state, progress){ self.emit("job-starting", state, progress); })
            .on("job-complete", function(state){ self.emit("job-complete", state); })
            .on("job-success", function(job){ self.emit("job-success", job); })
            .on("job-fail", function(state){ self.emit("job-fail", state); })
            .on("job-terminated", function(state){ self.emit("job-terminated", state); })
            .on("job-info", function(state, msg){ self.emit("job-info", state, msg); })
            .on("job-warning", function(state, msg){ self.emit("job-warning", state, msg); })
            .on("job-verbose", function(state, msg){ self.emit("job-verbose", state, msg); })
            .on("job-error", function(state, error){ self.emit("job-error", state, error); })
            .start();
    }
};

/**
@event job-starting
@param Object state
*/
Job.prototype.emitStarting = function(job){
    this.timer = new Timer().start();
    this.emit("job-starting", job || this);
};

/**
@event job-info
@param Object state
@param String message
*/
Job.prototype.emitInfo = function(msg){
    this.emit("job-info", this.state, msg);
};

/**
@event job-verbose
@param Object state
@param String message
*/
Job.prototype.emitVerbose = function(msg){
    this.emit("job-verbose", this.state, msg);
};

/**
@event job-complete
@param Object state
*/
Job.prototype.emitComplete = function(){
    this.timer && this.timer.stop();
    this.complete = true;
    this.emit("job-complete", this.state);
};

/**
@event job-success
@param Object state
*/
Job.prototype.emitSuccess = function(job){
    this.emit("job-success", job || this);
    this.emitComplete();
    this.startQueue(this.onSuccess);
};

/**
@event job-fail
@param Object state
*/
Job.prototype.emitFail = function(){
    this.emit("job-fail", this.state);
    this.emitComplete();
    this.startQueue(this.onFail);
};

/**
@event job-warning
@param Object state
*/
Job.prototype.emitWarning = function(msg){
    this.emit("job-warning", this.state, msg);
};

/**
@event job-error
@param Object state
@param Error error
*/
Job.prototype.emitError = function(err){
    this.emit("job-error", this.state, err);
    this.emitFail();
};

/**
@event job-terminated
@param Object state
*/
Job.prototype.emitTerminated = function(){
    this.emit("job-terminated", this.state);
    this.startQueue(this.onTerminate);
    this.emitComplete();
};

/**
@event job-progress
@param Object state
@param Object progress
*/
Job.prototype.emitProgress = function(progress){
    this.emit("job-progress", this.state, progress);
};

exports.Job = Job;
exports.Queue = Queue;