"use strict";
var util = require("util"),
    _Job = require("./_Job"),
    l = console.dir;

var AsyncJob = module.exports = function AsyncJob(options){
    _Job.call(this, options);
    this.define({ name: "parallel", type: "boolean" });
};
util.inherits(AsyncJob, _Job);

AsyncJob.prototype.run = function(done){
    var self = this;
    this.emit(this.eEvent.start);
    this.state = this.eState.running;
    var context = {
        done: function(err, returnValue){
            if (err) {
                self.fail(err);
            } else {
                self.success(returnValue);
            }
            if (done) done(err, returnValue);
        }
    };
    try {
        this.command.apply(context, this.args);
    } catch (err){
        this.fail(err);
        if (done) done(err);
    }
};
