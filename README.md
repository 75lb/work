***under construction***

Work
====
Got a thousand jobs to do? Get an execution plan! Work provides a means to build a hierarchy of jobs, executed in the order, and with the strategy provided. Build your own dashboard to monitor events / progress or use the one built it. Work makes use of the [Composite Pattern](http://en.wikipedia.org/wiki/Composite_pattern).

Synopsis
--------
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
        name: "wash dishes",
        command: wash,
        args: [ pots, pans, cutlery ],
        onProgress: {
            name: "change music",
            commandSync: function(){
                // half way through washing the dishes
                if (this.progress.percentComplete == 50){
                    launchPlaylist("Metal");
                }
            }
        },
        onComplete: [
            {
                name: "wipe worktops",
                command: wash,
                args: [ worktops ],
                onSuccess: {
                    name: "procrastinate",
                    command: postFacebookStatus,
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
housework.monitor(process.stdout).run();
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

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/2433e9f4ebb10607ef686be852613928 "githalytics.com")](http://githalytics.com/75lb/work)
