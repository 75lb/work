var util = require("util"),
    Job = require("..").Job;

function delay(time){
    var self = this;
    setTimeout(function(){
        self.success();
    }, time * 10);
}

var main = new Job({ name: "main" }).add([
    {
        name: "1", 
        parallel: true,
        command: delay,
        args: 100,
        children: [
            {
                name: "1.1", 
                parallel: true,
                command: delay,
                args: 400,
            },
            {
                name: "1.2",
                parallel: true,
                command: delay,
                args: 50,
                children: [
                    {
                        name: "1.2.1", 
                        parallel: true,
                        command: delay,
                        args: 600
                    },
                    {
                        name: "1.2.2", 
                        parallel: true,
                        command: delay,
                        args: 150
                    }
                ]
            },
            {
                name: "1.3",
                parallel: true,
                runOn: "fail",
                command: delay,
                args: 10,
            }
        ]
    },
    {
        name: "2", 
        parallel: true,
        command: delay,
        args: 200
    },
    {
        name: "3", 
        parallel: true,
        command: delay,
        args: 300
    }
]);

main.on("monitor", function(job, eventName){
    console.log("%s, %s, %s, %s", job.name, eventName, job.args || "", job.parallel);
}).run();

// main.monitor(process.stdout).run();

main.on("descendentsComplete", function(){
    console.log("DONE");
})