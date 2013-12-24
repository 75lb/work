var util = require("util"),
    Job = require("./Job");

var JobSync = module.exports = function JobSync(options){
    Job.call(this, options);
};
util.inherits(JobSync, Job);

JobSync.prototype.run = function(){
    this.emit("start");
    var success = function(){
        this.state = "complete";
        this.emit("complete");
    }.bind(this);
    var returnValue = this.command.apply(this, this.args);
    success();
    return returnValue;
}