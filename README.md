***under construction***

Work
====
Got a thousand jobs to do? Get an execution plan!

Create one of more instances of `Job`, specifying the name, command, arguments and whether the job may run in parallel to others. Add each `Job` to a `Queue` for execution in the order provided. Each `Job` can have a sub-Queue to be executed on success or failure, each Queue containing its own list of Jobs - and so the hierarchy grows! 

var work = require("work");
```javascript    
var queue = new work.Queue({ name: "housework" }).add([
    {
        name: "play music", 
        parallel: true,
        command: launchPlaylist,
        args: "Al Green"
    },
    { 
        name: "dishes", 
        command: wash, 
        args: [ pots, pans, cuttlery ],
        onProgress: changeMusic,
        onSuccess: {
            name: "wipe worktops",
            command: wash,
            args: [ worktops ],
            onSuccess: {
                name: "procrastinate",
                command: "postFacebookStatus",
                args: "I'm a model parent and my kids are clever. "
            }
        }
    },
    {
        name: "mop floor",
        command: wash,
        args: [ kitchenFloor, hallFloor ],
        onProgress: changeMusic
    }
]);

// use stdout as the real-time dashboard displaying queue progress
queue.viewport(process.stdout).start();
```