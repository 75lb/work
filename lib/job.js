var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util"),
    Queue = require("./queue"),
    cm = require("../../config-master");

/**
@class Job
@module work
@constructor
*/
function Job(options){
    var self = this;
    var config = new cm.Config()
        .define({ name: "name", type: "string", required: true })
        .define({ name: "command", type: "function" })
        .set(options);

    this.name = config.get("name");
    this.command = config.get("command");
    this.complete = false;
    this.timer = null;
    this.async = false;
    
    Object.defineProperty(this, "state", { enumerable: true, configurable: true, get: function(){
        return JSON.stringify({
            name: self.name
        });
    }});

    
    this.onSuccess = new Queue({ name: this.name + " onSuccess" });
    this.onFail = new Queue({ name: this.name + " onFail" });
}
Job.prototype = new EventEmitter();

Job.prototype.command = function(){
    throw new Error("Job has no command: " + this.name);
}
Job.prototype.undo = function(){
    throw new Error("Job has no undo command: " + this.name);
};

Job.prototype.run = function(){
    this.emitStarting();

    try{
        this.command.call(this);
    } catch(e){
        this.emitError(e);
    }
};

Job.prototype.startQueue = function(queue){
    var self = this;
    if (queue.jobs.length){
        queue
            .on("queue-starting", function(state){ self.emit("queue-starting", state); })
            .on("queue-complete", function(state){ self.emit("queue-complete", state); })
            .on("job-starting", function(state){ self.emit("job-starting", state); })
            .on("job-complete", function(state){ self.emit("job-complete", state); })
            .on("job-success", function(state){ self.emit("job-success", state); })
            .on("job-fail", function(state){ self.emit("job-fail", state); })
            .on("job-info", function(state){ self.emit("job-info", state); })
            .start();
    }
};

/**
@event starting
@param String name
@param Timer timer
*/
Job.prototype.emitStarting = function(msg){
    this.timer = new Timer().start();
    this.emit("job-starting", this.state);
};

/**
@event info
@param String message
*/
Job.prototype.emitInfo = function(msg){
    this.emit("job-info", this.state, msg);
};

/**
@event verbose
@param String message
*/
Job.prototype.emitVerbose = function(msg){
    this.emit("job-verbose", this.state, msg);
};

/**
@event complete
*/
Job.prototype.emitComplete = function(){
    this.timer && this.timer.stop();
    this.complete = true;
    this.emit("job-complete", this.state);
};
/**
@event success
*/
Job.prototype.emitSuccess = function(){
    this.emit("job-success", this.state);
    this.emitComplete();
    this.startQueue(this.onSuccess);
};
/**
@event fail
*/
Job.prototype.emitFail = function(){
    this.emit("job-fail", this.state);
    this.emitComplete();
    this.startQueue(this.onFail);
};

/**
@event warning
@param String message
*/
Job.prototype.emitWarning = function(msg){
    this.emit("job-warning", this.state, msg);
};

/**
@event error
@param String message
*/
Job.prototype.emitError = function(err){
    this.emit("job-error", this.state, err);
};

/**
@event terminated
*/
Job.prototype.emitTerminated = function(){
    this.emit("job-terminated");
    if (this.autoUndo){
        try{
            this.undo.call(this);
        } catch(e){
            this.emitError(e);
        }
    }
};

/**
@event terminated
*/
Job.prototype.emitProgress = function(progress){
    this.emit("job-progress", this.state, progress);
};

module.exports = Job;