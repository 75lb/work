var util = require("util"),
    Job = require("..").Job;

function delay(time){
    var self = this;
    setTimeout(function(){
        self.success();
    }, time);
}

var main = new Job({ name: "main" }).add([
    {
        name: "3", 
        parallel: true,
        command: delay,
        args: 300,
        children: [
            {
                name: "4", 
                // runOn: "success",
                parallel: true,
                command: delay,
                args: 300,
            },
            {
                name: "5", 
                // runOn: "fail",
                parallel: true,
                command: delay,
                args: 400,
            }
        ]
    },
    {
        name: "2", 
        parallel: true,
        command: delay,
        args: 200,
        children: [
            {
                name: "6", 
                parallel: true,
                // runOn: "success",
                command: delay,
                args: 600,
            },
            {
                name: "7", 
                parallel: true,
                // runOn: "success",
                command: delay,
                args: 1000,
            }
        ]
    },
    {
        name: "1", 
        parallel: true,
        command: delay,
        args: 10
    }
]);

main.on("monitor", function(job, eventName){
    console.log("%s, %s", job.name, eventName);
}).run();

// main.monitor(process.stdout).run();

main.on("descendentsComplete", function(){
    console.log("DONE");
})