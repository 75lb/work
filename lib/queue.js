var EventEmitter = require("events").EventEmitter,
    Timer = require("../../general").Timer,
    util = require("util");

/**
@class Queue
@constructor
*/

function Queue(options){
    var _jobs = [];
    var self = this;
    
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
        if (job instanceof Job){
            _jobs.push(job);
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
        
        function runJob(){
            var job = _jobs.shift();
            if (job){
               job.on("queue-starting", function(state){ self.emitStarting(state); })
                   .on("queue-complete", function(state){ self.emitComplete(state); })
                   .on("job-starting", function(state){ self.emit("job-starting", state); })
                   .on("job-progress", function(state, progress){ self.emit("job-progress", state, progress); })
                   .on("job-complete", function(state){ 
                       self.emit("job-complete", state); 
                       if (!self.complete){
                           if (_jobs.every(function(job){ return job.complete; })){
                               self.emitComplete();
                           }
                       }
                   })
                   .on("job-success", function(state){ self.emit("job-success", state); })
                   .on("job-fail", function(state){ self.emit("job-fail", state); })
                   .on("job-info", function(state, msg){ self.emit("job-info", state, msg); })
                   .on("job-warning", function(state, msg){ self.emit("job-warning", state, msg); })
                   .on("job-error", function(state, err){ self.emit("job-error", state, err); })
                   .on("job-terminated", function(state){ self.emit("job-terminated", state); });

               if (job.async){
                   runJob();
               } else {
                   job.on("job-complete", function(){ runJob(); });
               }
               
               job.run();
            }
        }
        
        runJob();
    };
}
Queue.prototype = new EventEmitter();

Queue.prototype.emitStarting = function(state){
    this.timer = new Timer().start();
    this.emit("queue-starting", state || this.state); 
};
Queue.prototype.emitComplete = function(state){
    this.timer.stop();
    this.complete = true;
    this.emit("queue-complete", state || this.state); 
};

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
module.exports = Queue;

// Queue needed to be fully defined before loading Job, which depends on Queue
var Job = require("./job");
