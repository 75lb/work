var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util");

/**
@class Job
@module work
@constructor
*/
function Job(name, autoUndo){
    var self = this;
    
    this.name = name;
    this.autoUndo = autoUndo;
    this.complete = false;
    this.timer = null;
    this.async = false;
    
    this.run = function(){
        var commandOutput;
        self.emitStarting();

        try{
            commandOutput = this.command.call(this);
        } catch(e){
            this.emit("error", e);
        }
    };
}
Job.prototype = new EventEmitter();
Job.prototype.command = function(){
    throw new Error("Job has no command: " + this.name);
}
Job.prototype.undo = function(){
    throw new Error("Job has no undo command: " + this.name);
};

/**
@event starting
@param String name
@param Timer timer
*/
Job.prototype.emitStarting = function(msg){
    this.timer = new Timer().start();
    this.emit("starting", this.name, this.timer);
};

/**
@event info
@param String message
*/
Job.prototype.emitInfo = function(msg){
    this.emit("info", msg);
};

/**
@event verbose
@param String message
*/
Job.prototype.emitVerbose = function(msg){
    this.emit("verbose", msg);
};

/**
@event complete
@param {EncodeQueueStats} stats
*/
Job.prototype.emitComplete = function(){
    this.timer && this.timer.stop();
    this.complete = true;
    this.emit("complete", this.name, this.timer);
};

/**
@event warning
@param String message
*/
Job.prototype.emitWarning = function(msg){
    this.emit("warning", msg);
};


/**
@event error
@param String message
*/
Job.prototype.emitError = function(err){
    this.emit("error", err);
};

/**
@event terminated
*/
Job.prototype.emitTerminated = function(){
    if (this.autoUndo){
        this.undo();
    }
    this.emit("terminated");
};

/**
@event terminated
*/
Job.prototype.emitProgress = function(progress){
    this.emit("progress", this.name, progress);
};

module.exports = Job;