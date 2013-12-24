var util = require("util"),
    _Job = require("./_Job"),
    l = console.dir;

var Job = module.exports = function Job(options){
    _Job.call(this, options);
};
util.inherits(Job, _Job);

Job.prototype.run = function(done){
    this.emit(this.eEvent.start);
    this.state = this.eState.running;
    var success = function(){
        this.state = this.eState.successful;
        this.emit(this.eEvent.complete);
        if (done) done.apply(this, arguments);
    }.bind(this);
    var context = {
        done: function(){
            success.apply(null, arguments);
        }
    };
    this.command.apply(context, this.args);
};
