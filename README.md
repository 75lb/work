***under construction***

Work
====
Synopsis
--------
Got a thousand jobs to do? Get an execution plan!

Create one of more instances of `Job`, specifying the `name`, `command`, `arguments` and whether the job may run in `parallel` to others. Add each `Job` to a `Queue` for execution in the order provided. Each `Job` can have sub-queues to be executed `onSuccess`, `onProgress` or `onFailure`, each of which contains its own list of Jobs. And so the hierarchy grows! Work can also project a dashboard, providing real-time progress information on any standard Node.js <a href="http://nodejs.org/api/stream.html">Stream</a>. 

```javascript
var work = require("work");
var housework = new work.Job({ name: "housework" }).add([
    {
        name: "play music", 
        parallel: true,
        command: launchPlaylist,
        args: "Al Green"
    },
    { 
        name: "dishes",
        command: wash,
        args: [ pots, pans, cutlery ],
        children: [
            {
                name: "change music",
                runOn: "progress"
                commandSync: function(){
                    // half way through washing the dishes
                    if (this.parent.progress.percentComplete == 50){
                        launchPlaylist("Metal");
                    }
                }
            },
            {
                name: "wipe worktops",
                runOn: "complete",
                command: wash,
                args: [ worktops ],
                onSuccess: {
                    name: "procrastinate",
                    command: "postFacebookStatus",
                    args: "I'm a model parent and my kids are clever. "
                }
            }
        ]
    },
    {
        name: "mop floor",
        command: wash,
        args: [ kitchenFloor, hallFloor ]
    }
]);

// get to work, monitoring progress on stdout
queue.monitor(process.stdout).start();
```

Install
-------
```sh
$ npm install work
```
Test
----
```sh
$ git clone https://github.com/75lb/work.git
$ cd work
$ npm test
```
