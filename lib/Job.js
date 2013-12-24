var util = require("util"),
    Thing = require("nature").Thing;

var Job = module.exports = function Job(options){
    this.define({ name: "name", type: "string" })
        .define({ name: "command", type: "function" })
        .define({ name: "args", type: Array })
        .set(options);
};

Job.prototype.run = function(){
    
};

util.inherits(Job, Thing);
