var Queue = require("../lib/queue");

// describe("Queue", function(){
//     it("queue synopsis", function(){
        var queue = new Queue();

        ["file", "another file", "third file"].forEach(function(file){
            var job = queue.add("process: " + file);
            job.command = function(){
               console.log("processing: " + file);
               this.emitComplete();
            };
            job.on("terminated", function(){
               console.log("undoing");
            });
            job.on("complete", function(){
                console.log("complete: " + file);
                setTimeout(function(){
                    console.log("easy dred");
                }, 100);
            });
        });
        
        var job = new Job()
        var onCompleteSubQueue = new Queue();
        onCompleteSubQueue.add(subJob);
        onCompleteSubQueue.add(subJob);
        sub.on
        
        queue.add(job, onCompleteSubQueue)

        queue.start();
        queue.print() // prints tree hierachy of all jobs with in-place updating of progress
//    });
// });

/**
list of jobs
execution plan
execute jobs 
 in sequence or 
 a group of jobs in parallel
 
*/
[
    { name: "job 1", command: func }, 
    { name: "job 2", command: func },
    { 
        name: "job 3", 
        onComplete: [
            { name: "job 4", command: func, async: true }
            { name: "job 5", command: func, async: true }
            { name: "job 6", command: func, async: true }
        ]
    },
    { name: "job 7", command: func, async: true },
    { name: "job 8", command: func, async: true },
    { name: "job 8", command: func },
    { name: "job 8", command: func, async: true }
]