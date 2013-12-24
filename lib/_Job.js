var util = require("util"),
    Thing = require("nature").Thing;

var _Job = module.exports = function _Job(options){
    this.define({ name: "name", type: "string" })
        .define({ name: "command", type: "function" })
        .define({ name: "args", type: Array })
        .define({ name: "state", type: "string", valueTest: /^(idle|complete)$/, default: "idle" })
        .define({ name: "children", type: Array })
        .set(options);
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
    complete: "complete"
};
