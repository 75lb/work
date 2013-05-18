function getEncodeFileJob(filename){
    return new SequentialJob({
        name: "encoding: " + filename,
        command: function(){
            doWork(function(){
                self.complete();
            })
        }
    })
}
var moveFile = new ParallelJob();

var queue = new Job();

queue.add([encodeFile, encodeFile, encodeFile, ]);

files.forEach(function(file){
    
    encodeFile
        .then(saveFile(destination)
        .then(isAchiveMode, archiveOriginal(file))
        .then(preserveDates())
    
})