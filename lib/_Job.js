var util = require("util"),
    Thing = require("nature").Thing,
    l = console.log;

var _Job = module.exports = function _Job(options){
    this.define({ name: "name", type: "string" })
        .define({ name: "command", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "state", type: "string", valueTest: /^(idle|running|successful|failed)$/, default: "idle" })
        .define({ name: "children", type: Array, default: [] })
        .define({ name: "runOn", type: "string", valueTest: /^(start|complete)$/ })
        .set(options);
        
    this.on(this.eEvent.complete, function(){
        var self = this;
        var toRun = this.children.filter(function(child){
            return child.runOn === self.eEvent.complete;
        });
        toRun.forEach(function(child){ child.run(); });
    });
};
util.inherits(_Job, Thing);

_Job.prototype.eState = {
    idle: "idle",
    running: "running",
    successful: "successful",
    failed: "failed"
};

_Job.prototype.eEvent = {
    start: "start",
    success: "success", 
    fail: "fail",
    complete: "complete"
};

_Job.prototype.success = function(){
    this.state = this.eState.successful;
    this.emit(this.eEvent.success);
    this.emit(this.eEvent.complete);
};

_Job.prototype.add = function(job){
    this.children.push(job);
};
