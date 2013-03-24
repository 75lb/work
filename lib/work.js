var EventEmitter = require("events").EventEmitter,
    util = require("util");

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

function Work(name){
    this.name = name;
    this.running = null;
    this.progress = null;
    this.successful = null;
    this.complete = null;
    this.children = [];
}
util.inherits(Work, EventEmitter);
Work.prototype.run = function(){ throw new Error("implement run()") }
Work.prototype.add = function(work){
    this.children.push(work);
    return this;
}

// function Queue(name, runOn){
//     Work.call(this, name);
//     this.runOn = runOn;
// }
// util.inherits(Queue, Work);
// Queue.prototype.run = function(){
//     this.children.forEach(function(child){
//         child.run();
//     });
//     this.successful = true;
//     this.emit("success");
// }


function Job(name, command, runOn){
    Work.call(this, name);
    this.command = command;
    this.runOn = runOn;
}
util.inherits(Job, Work);
Job.prototype.run = function(){
    var self = this;
    if (this.command){
        this.command();
    }
    this.successful = Boolean(parseInt(Math.random() * 2));
    this.emit(this.successful ? "success" : "fail");
    this.children.forEach(function(child){
        if (!child.runOn){
            child.run();
        } else if (child.runOn == "success" && self.successful){
            child.run();
        } else if (child.runOn == "fail" && !self.successful){
            child.run();
        }
    });
}

// exports.Queue = Queue;
exports.Job = Job;
