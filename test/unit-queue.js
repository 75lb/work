var util = require("util"),
    work = require("../lib/work"),
    Queue = work.Queue,
    Job = work.Job;

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

// var queue = new Queue("queue");
// 
// [1,2,3,4,5,6,7,8,9,10].forEach(function(index){
//     var job = new Job("job" + index, index);
// 
//     job.add(new Queue("job success", "success").add(
//         new Job("celebrate", "YAY!")
//     ));
//     job.add(new Queue("job fail", "fail").add(
//         new Job("rage", "FFS!")
//     ));
//     
//     queue.add(job);
// });
// 
// queue.run();

var main = new Job("main", function(){ l("let's go"); });

[1,2,3,4,5,6,7,8,9,10].forEach(function(index){
    var encode = new Job("encode", function(){l("encode " + index)});
    encode.add(new Job("celebrate", function(){l("YAY!")}, "success"));
    encode.add(new Job("rage", function(){l("FFS!")}, "fail"));
    main.add(encode);
});

main.run();