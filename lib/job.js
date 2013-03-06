/**
Bout dat work. 
@module work
*/

var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util"),
    Queue = require("./queue"),
    cm = require("../../config-master");

/**
@class Job
@constructor
*/
function Job(options){
    var self = this;
    var config = new cm.Config()
        .define({ name: "name", type: "string", required: true })
        .define({ name: "command", type: "function" })
        .define({ name: "async", type: "boolean" })
        .set(options);
        
    /**
    @property name
    @type string
    */
    this.name = config.get("name");

    /**
    @property command
    @type function
    */
    this.command = config.get("command");

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
    this.onSuccess = new Queue({ name: this.name + " onSuccess" });

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
Job.prototype = new EventEmitter();

Job.prototype.command = function(){
    throw new Error("Job has no command: " + this.name);
}

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
            .on("job-progress", function(state, progress){ self.emit("job-starting", state, progress); })
            .on("job-complete", function(state){ self.emit("job-complete", state); })
            .on("job-success", function(state){ self.emit("job-success", state); })
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
Job.prototype.emitStarting = function(msg){
    this.timer = new Timer().start();
    this.emit("job-starting", this.state);
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
Job.prototype.emitSuccess = function(){
    this.emit("job-success", this.state);
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

module.exports = Job;

console.log("Job bottom, Queue: " + Queue);