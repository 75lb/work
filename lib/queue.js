var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util");

// event definitions
/**
@event info
@param String message
*/
/**
@event warning
@param String message
*/
/**
@event error
@param String message
*/
/**
@event starting
@param {Timer} timer
@param {QueueStats} stats
*/
/**
@event complete
@param {Timer} timer
*/
/**
@event job-starting
@param {Timer} timer
*/
/**
@event job-progress
@param {Progress} progress
*/
/**
@event job-complete
@param {Timer} timer
*/
/**
@event terminated
*/

/**
@class Queue
@module queue-lord
@constructor
*/
function Queue(){
    var _jobs = [];
    var self = this;
    
    this.timer = null;
    
    this.add = function(job){
        _jobs.push(job);
    };
    
    this.start = function(){
        function runJob(){
            var job = _jobs.shift();
            if (job){
                job.on("starting", function(name, timer){ self.emit("job-starting", name, timer); })
                    .on("progress", function(name, prog){ self.emit("job-progress", name, prog); })
                    .on("complete", function(name, timer){
                        self.emit("job-complete", name, timer);
                        if (_jobs.every(function(job){ return job.complete; })){
                            self.timer.stop();
                            self.emit("complete", self.timer);
                        }
                    })
                   .on("info", function(msg){ self.emit("info", msg); })
                   .on("warning", function(msg){ self.emit("warning", msg); })
                   .on("error", function(err){ self.emit("error", err); })
                   .on("terminated", function(){ self.emit("terminated"); })
                   .run();

               if (job.async){
                   runJob();
               } else {
                   job.on("complete", function(){ runJob(); })
                      .on("error", function(){ runJob(); })
                      .on("terminated", function(){ runJob(); });
               }
            }
        }
        
        this.timer = new Timer().start();
        self.emit("starting", this.timer);
        runJob();
    };
}
Queue.prototype = new EventEmitter();

/**
@class QueueStats
@constructor
*/
function QueueStats(){
    /**
    @property time
    @type Object
    */
    this.time = {
        start: null, 
        end: null, 
        total: null
    };
    
    /**
    @property jobs
    @type Object
    */    
    this.jobs = {
        valid: 0, 
        invalid: 0,
        ignored: 0,    
        failed: 0, 
        successful: 0,
        fileExtensions: {}
    };
}

module.exports = Queue;