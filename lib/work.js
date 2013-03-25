var EventEmitter = require("events").EventEmitter,
    Thing = require("nature").Thing,
    util = require("util");

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

function JobOptions(){
    Thing.call(this);
    this.define({ name: "name", type: "string", required: true })
        .define({ name: "command", type: "function" })
        .define({ name: "commandSync", type: "function" })
        .define({ name: "runOn", type: "string" })
        .define({ name: "args", type: Array })
        .define({ name: "children", type: Array })
        .define({ name: "data" })
        .define({ name: "parallel", type: "boolean", default: false });
}
util.inherits(JobOptions, Thing);

function Job(options){
    var config = new JobOptions().set(options);
    var self = this;
    this.name = config.name;
    this.running = null;
    this.progress = null;
    this.successful = null;
    this.complete = null;
    this.children = [];
    if (config.children){
        config.children.forEach(function(childJob){
            self.add.call(self, childJob);
        });
    }
    this.command = config.command;
    this.commandSync = config.commandSync;
    this.args = config.args;
    this.runOn = config.runOn;
}
util.inherits(Job, EventEmitter);
Job.prototype.add = function(job){
    this.children.push(new Job(job));
    return this;
};
Job.prototype.run = function(){
    var self = this;
    if (this.commandSync){
        this.commandSync.apply(this, this.args);
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
    return this;
}

exports.Job = Job;
