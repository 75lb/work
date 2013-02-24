var assert = require("assert"),
    path = require("path"),
    os = require("os"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    sinon = require("sinon"),
    fs = require("fs-extra"),
    Job = require("../lib/job"),
    config = require("../lib/config"),
    HandbrakeCLI = require("../lib/handbrake"),
    shared = require("./shared");

var _p = shared.path,
    _inputFile = path.join(_p.FIXTURE_DIR, _p.VIDEO1);

describe("Job", function(){
    describe("instantiation: ", function(){
        before(function(done){
            shared.setupSingleFileFixture(_p.VIDEO1, done);
        });
        beforeEach(function(){
            config.reset();
            config.group("veelo")
                .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", defaultVal: "m4v" })
                .option("archive", { type: "boolean" })
                .option("archiveDirectory", { type: "string", defaultVal: "veelo-originals" })
                .option("verbose", { type: "boolean" })
                .option("version", { type: "boolean" })
                .option("config", { type: "boolean" })
                .option("embed-srt", { type: "boolean" })
                .option("preserve-dates", { type: "boolean" })
                .option("recurse", { type: "boolean" })
                .option("dry-run", { type: "boolean" })
                .option("output-dir", { type: "string" })
                .option("include", { type: "regex" })
                .option("exclude", { type: "regex" })
                .option("ignoreList", { type: "array", defaultVal: [] });
        });
    
        it("should instantiate with sensible paths if no supplied config", function(){
            var job = new Job({ inputPath: "test.mov" });
            assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
            assert.strictEqual(job.path.archive, "", JSON.stringify(job));
            assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
            assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
        });
        
        it("should instantiate with default archive path", function(){
            var job = new Job({ 
                config: config.set("archive", true),
                inputPath: "test.mov"
            });
        
            assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
            assert.strictEqual(job.path.archive, path.join(config.get("archiveDirectory"), "test.mov"), JSON.stringify(job));
            assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
            assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
        });

        it("should instantiate with custom archive path", function(){
            config.set("archiveDirectory", "archive")
                  .set("archive", true);
            var job = new Job({ 
                config: config,
                inputPath: "test.mov"
            });
        
            assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
            assert.strictEqual(job.path.archive, path.join("archive", "test.mov"), JSON.stringify(job));
            assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
            assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
        });

        it("should instantiate with deep custom archive path", function(){
            config.set("archiveDirectory", path.join("sub", "archive"));
            config.set("archive", true);
            var job = new Job({ inputPath: "test.mov" });
        
            assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
            assert.strictEqual(job.path.archive, path.join("sub", "archive", "test.mov"), JSON.stringify(job));
            assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
            assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
        });

        it("should instantiate with correct nested output-dir", function(){
            config.set("output-dir", "output");
            var job = new Job({ inputPath: "test.mov" });
        
            assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
            assert.strictEqual(job.path.archive, "", JSON.stringify(job));
            assert.strictEqual(job.path.output, path.join("output", "test.m4v"), JSON.stringify(job));
            assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
        });

        it("should instantiate with correct absolute output-dir", function(){
            config.set("output-dir", "../output");            
            var job = new Job({ inputPath: "test.mov" });
        
            assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
            assert.strictEqual(job.path.archive, "", JSON.stringify(job));
            assert.strictEqual(job.path.output, path.join("..", "output", "test.m4v"), JSON.stringify(job));
            assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
        });
    });

    describe("instatiation events:", function(){
        it("should fire 'invalid' event if not a file", function(){
            var job = new Job({ inputPath: path.join(__dirname, "mock/") }),
                message;
            
            job.on("invalid", function(msg){
                message = msg; 
            });
            job.validate();
            
            assert.ok(message, message || "event not fired");
        });

        it("should fire 'invalid' event if file doesn't exist", function(){
            var job = new Job({ inputPath: "kjhlj" }),
                message;
            
            job.on("invalid", function(msg){
                message = msg; 
            });
            job.validate();
            
            assert.ok(message, message || "event not fired");
        });
        
        it("should ignore file", function(){
            config.set("ignoreList", [_inputFile]);
            var job = new Job({ inputPath: _inputFile });
            
            job.validate();
            
            assert.strictEqual(job.is.valid, false);
        })
    });
    
    describe("processing: ", function(){
        var _job,
            _mockHandbrakeCLI;

        var MockHandbrakeCLI = function(){
            _mockHandbrakeCLI = this;
        };
        MockHandbrakeCLI.prototype = new EventEmitter();
        MockHandbrakeCLI.prototype.spawn = function(){};
        MockHandbrakeCLI.prototype.exec = function(){};
        
        beforeEach(function(){
            config.reset();
            config.group("veelo")
                .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", value: "m4v" })
                .option("archive", { type: "boolean" })
                .option("archiveDirectory", { type: "string", defaultVal: "veelo-originals" })
                .option("verbose", { type: "boolean" })
                .option("version", { type: "boolean" })
                .option("config", { type: "boolean" })
                .option("embed-srt", { type: "boolean" })
                .option("preserve-dates", { type: "boolean" })
                .option("recurse", { type: "boolean" })
                .option("dry-run", { type: "boolean" })
                .option("output-dir", { type: "string" })
                .option("include", { type: "regex" })
                .option("exclude", { type: "regex" })
                .option("ignoreList", { type: "array", defaultVal: [] });
            
            _job = new Job({ inputPath: path.join(_p.FIXTURE_DIR, _p.VIDEO1) });
            _job._inject({ HandbrakeCLI: MockHandbrakeCLI });
        });
        
        it("should fire 'processing' on process()", function(){
            var eventFired = false;
        
            _job.on("processing", function(){
                eventFired = true;
            });
            _job.process();
        
            assert.ok(eventFired);
        });
        
        it("should call 'spawn' on process()", function(){
            var spy = sinon.spy(MockHandbrakeCLI.prototype, "spawn");

            _job.process();
        
            assert.ok(spy.called);
        });

        it("should fire message on embedding subs");
        
        it("should fire 'output' on handbrakeCli output", function(){
            var eventFired = false;

            _job.on("output", function(){
                eventFired = true;
            })
            _job.process();
            _mockHandbrakeCLI.emit("output");

            assert.ok(eventFired);
        });

        it("should fire 'fail' on handbrakeCli fail", function(){
            var eventFired = false;

            _job.on("fail", function(){
                eventFired = true;
            })
            _job.process();
            _mockHandbrakeCLI.emit("fail");

            assert.ok(eventFired);
        });

        //FINISH THIS - need a mock fs
        // it("should fire 'terminated' on handbrakeCli terminated", function(){
        //     var eventFired = false;
        // 
        //     _job.on("terminated", function(){
        //         eventFired = true;
        //     })
        //     _job.process();
        //     _mockHandbrakeCLI.emit("terminated");
        // 
        //     assert.ok(eventFired);
        // });
    
        it("should clean up on 'terminated'");
    });
});
