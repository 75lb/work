var util = require("util"),
    Job = require("./Job");

var JobSync = module.exports = function JobSync(options){
    Job.call(this, options);
};
util.inherits(JobSync, Job);
