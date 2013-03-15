***under construction***

Work
====
Got a thousand jobs to do? Get an execution plan!

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
    
queue.viewport(process.stdout).start();
```