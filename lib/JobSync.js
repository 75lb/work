var util = require("util"),
    _Job = require("./_Job");

var JobSync = module.exports = function JobSync(options){
    _Job.call(this, options);
};
util.inherits(JobSync, _Job);

JobSync.prototype.run = function(){
    this.emit(this.eEvent.start);
    var success = function(){
        this.state = this.eState.successful;
        this.emit(this.eEvent.complete);
    }.bind(this);
    var returnValue = this.command.apply(this, this.args);
    success();
    return returnValue;
};
