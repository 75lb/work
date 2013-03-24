var util = require("util"),
    work = require("./tmp2"),
    Queue = work.Queue,
    Job = work.Job;

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

var queue = new Queue("queue");

[1,2,3,4,5,6,7,8,9,10].forEach(function(index){
    var job = new Job("job" + index, index);

    job.add(new Queue("job success", "success").add(
        new Job("celebrate", "YAY!")
    ));
    job.add(new Queue("job fail", "fail").add(
        new Job("rage", "FFS!")
    ));
    
    queue.add(job);
});

queue.run();