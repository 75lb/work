var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util");

/**
@class Job
@module queue-lord
@constructor
*/
function Job(name){
    var self = this;
    
    this.name = name;
    this.complete = false;
    this.timer = null;
    this.async = false;
    
    this.run = function(){
        var commandOutput;
        
        this.timer = new Timer().start();
        self.emit("starting", this.name, this.timer);

        try{
            commandOutput = this.command();
        } catch(e){
            self.emit("error", e);
        }
        
        if (commandOutput instanceof EventEmitter){
            commandOutput
                .on("progress", function(progress){
                    self.emit("progress", self.name, progress);
                })
                .on("complete", function(){
                    self.timer.stop();
                    self.complete = true;
                    self.emit("complete", self.name, self.timer);
                })
                .on("info", function(msg){ self.emit("info", msg); })
                .on("warning", function(msg){ self.emit("warning", msg); })
                .on("error", function(err){ self.emit("error", err); })
                .on("terminated", function(){ self.emit("terminated"); });
                
        } else {
            self.emit("complete", self.name, self.timer);
            this.complete = true;
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
@class CommandHandle
@constructor
*/
function CommandHandle(){}
CommandHandle.prototype = new EventEmitter();

// event definitions
var e = {
    /**
    @event info
    @param String message
    */
    info: "info",
    
    /**
    @event warning
    @param String message
    */
    warning: "warning",
    
    /**
    @event error
    @param String message
    */
    error: "error",
    
    /**
    @event starting
    @param {EncodeQueueStats} stats
    */
    starting: "starting",

    /**
    @event progress
    @param {Progress} progress
    */
    progress: "progress",
    
    /**
    @event complete
    @param {EncodeQueueStats} stats
    */
    complete: "complete",

    /**
    @event terminated
    */
    terminated: "terminated"
};

module.exports = Job;