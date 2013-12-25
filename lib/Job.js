"use strict";
var util = require("util"),
    _Job = require("./_Job"),
    l = console.dir;

var Job = module.exports = function Job(options){
    _Job.call(this, options);
};
util.inherits(Job, _Job);

Job.prototype.run = function(done){
    var self = this;
    this.emit(this.eEvent.start);
    this.state = this.eState.running;
    var context = {
        done: function(){
            self.success();
            if (done) done.apply(null, arguments);
        }
    };
    this.command.apply(context, this.args);
};
