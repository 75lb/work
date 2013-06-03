/**
process 100 files in 3 different ways
*/

var util = require("util"),
    Job = require("..").Job;

var files = [],
    batch1 = new Job({ name: "batch 1" }),
    batch2 = new Job({ name: "batch 2" }),
    batch3 = new Job({ name: "batch 3" });
    
for (var i = 0; i < 100; i++){
    batch1.add({
        name: "task A on file " + i,
        command: function(){
            var self = this;
            setTimeout(function(){
                if (parseInt(Math.random()*2)){
                    if (parseInt(Math.random()*2)) self.inform("task A was a big success");
                    self.success();
                } else {
                    self.fail("task A ERRORED IT UP");
                }
            }, 2000 * Math.random());
        }
    });
//     batch2.add({
//         name: "task b on file " + i,
//         parallel: true,
//         command: function(){
//             var self = this;
//             setTimeout(function(){
//                 if (parseInt(Math.random()*2)){
//                     self.success();
//                 } else {
//                     self.fail();
//                 }
//             }, 100 * Math.random());
//         }
//     });
//     batch3.add({
//         name: "task C on file " + i,
//         commandSync: String
//     });
}

batch1.print().monitor().run();
// batch2.print();
// batch3.print();