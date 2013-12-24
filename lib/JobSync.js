var util = require("util"),
    _Job = require("./_Job");

var JobSync = module.exports = function JobSync(options){
    _Job.call(this, options);
};
util.inherits(JobSync, _Job);

JobSync.prototype.run = function(){
    this.emit(this.eEvent.start);
    var returnValue = this.command.apply(this, this.args);
    this.success();
    return returnValue;
};
