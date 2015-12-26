[![view on npm](http://img.shields.io/npm/v/work.svg)](https://www.npmjs.org/package/work)
[![npm module downloads](http://img.shields.io/npm/dt/work.svg)](https://www.npmjs.org/package/work)
[![Build Status](https://travis-ci.org/75lb/work.svg?branch=master)](https://travis-ci.org/75lb/work)
[![Dependency Status](https://david-dm.org/75lb/work.svg)](https://david-dm.org/75lb/work)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

<a name="module_work"></a>
## work
A first-in-first-out async task queue. Fill the queue with [Task](#module_work.Task) instances (using [module:work.TaskQueue#push](module:work.TaskQueue#push)) then (when ready) call [module:work.TaskQueue#process](module:work.TaskQueue#process) to settle each task in the order they were received. During processing, the queue will process [module:work.TaskQueue#maxConcurrent](module:work.TaskQueue#maxConcurrent) tasks at a time. Each task comprises a name, [deferred](https://github.com/kriskowal/q/wiki/API-Reference#qdefer) and list of resolvers - each of which will race to settle the deferred first.

**Example**  
```js
var tq = require("work")
var q = require("q")
var http = require("http")

var queue = new tq.TaskQueue()

// get the football results - it will take between 0 and 2000ms
// and resolve with the result
function resultResolver(deferred){
	setTimeout(function(){
		deferred.resolve("West Ham 1 - Tottenham Hotspur 3")
	}, Math.random() * 2000)
}

// but the timeout resolver will reject it after 1000ms
function timeoutResolver(deferred){
	setTimeout(function(){
		deferred.reject(Error("timeout"))
	}, 1000)
}

var task = new tq.Task({
	name: "get result",
	resolver: [ resultResolver, timeoutResolver ]
})

queue.push(task)

task.deferred.promise
	.then(function(result){
		console.log(result)
	})
	.catch(function(err){
		console.log("It failed: " + err.message)
	})

queue.process()
```

* [work](#module_work)
    * [.Queue](#module_work.Queue)
        * [new Queue([options])](#new_module_work.Queue_new)
        * [.name](#module_work.Queue.Queue+name) : <code>string</code>
        * [.queued](#module_work.Queue.Queue+queued) : <code>Array</code>
        * [.active](#module_work.Queue.Queue+active) : <code>Array</code>
        * [.maxConcurrent](#module_work.Queue.Queue+maxConcurrent) : <code>number</code>
        * [.length](#module_work.Queue+length) : <code>number</code>
        * [.freeSlotCount](#module_work.Queue+freeSlotCount) : <code>number</code>
        * [.push(task)](#module_work.Queue+push) ⇒ <code>[Task](#module_work.Task)</code>
        * [.shift()](#module_work.Queue+shift) ⇒ <code>[Task](#module_work.Task)</code>
        * [.process()](#module_work.Queue+process)
        * [.unshift(newTask)](#module_work.Queue+unshift) ⇒ <code>[Task](#module_work.Task)</code>
        * [.cancel()](#module_work.Queue+cancel) ⇒ <code>[Task](#module_work.Task)</code>
        * [.isEmpty()](#module_work.Queue+isEmpty) ⇒
        * ["occupied"](#module_work.Queue+event_occupied)
        * ["push"](#module_work.Queue+event_push)
        * ["empty"](#module_work.Queue+event_empty)
        * ["complete"](#module_work.Queue+event_complete)
        * ["shift"](#module_work.Queue+event_shift)
        * ["occupied"](#module_work.Queue+event_occupied)
        * ["unshift"](#module_work.Queue+event_unshift)
        * ["empty"](#module_work.Queue+event_empty)
        * ["cancel"](#module_work.Queue+event_cancel)
    * [.Task](#module_work.Task) ⇐ <code>module:state-machine</code>
        * [new Task(resolver, [options])](#new_module_work.Task_new)
        * _instance_
            * [.promise](#module_work.Task.Task+promise) : <code>external:Promise</code>
            * [.resolver](#module_work.Task.Task+resolver) : <code>function</code> &#124; <code>Array.&lt;function()&gt;</code>
            * [.name](#module_work.Task.Task+name) : <code>string</code>
            * [.data](#module_work.Task.Task+data) : <code>string</code>
            * [.process()](#module_work.Task+process)
            * [.cancel()](#module_work.Task+cancel)
            * ["fulfilled"](#module_work.Task+event_fulfilled)
            * ["resolved"](#module_work.Task+event_resolved)
            * ["rejected"](#module_work.Task+event_rejected)
            * ["running"](#module_work.Task+event_running)
        * _static_
            * [.eState](#module_work.Task.eState) : <code>enum</code>

<a name="module_work.Queue"></a>
### tq.Queue
queue class for processing promises

**Kind**: static class of <code>[work](#module_work)</code>  

* [.Queue](#module_work.Queue)
    * [new Queue([options])](#new_module_work.Queue_new)
    * [.name](#module_work.Queue.Queue+name) : <code>string</code>
    * [.queued](#module_work.Queue.Queue+queued) : <code>Array</code>
    * [.active](#module_work.Queue.Queue+active) : <code>Array</code>
    * [.maxConcurrent](#module_work.Queue.Queue+maxConcurrent) : <code>number</code>
    * [.length](#module_work.Queue+length) : <code>number</code>
    * [.freeSlotCount](#module_work.Queue+freeSlotCount) : <code>number</code>
    * [.push(task)](#module_work.Queue+push) ⇒ <code>[Task](#module_work.Task)</code>
    * [.shift()](#module_work.Queue+shift) ⇒ <code>[Task](#module_work.Task)</code>
    * [.process()](#module_work.Queue+process)
    * [.unshift(newTask)](#module_work.Queue+unshift) ⇒ <code>[Task](#module_work.Task)</code>
    * [.cancel()](#module_work.Queue+cancel) ⇒ <code>[Task](#module_work.Task)</code>
    * [.isEmpty()](#module_work.Queue+isEmpty) ⇒
    * ["occupied"](#module_work.Queue+event_occupied)
    * ["push"](#module_work.Queue+event_push)
    * ["empty"](#module_work.Queue+event_empty)
    * ["complete"](#module_work.Queue+event_complete)
    * ["shift"](#module_work.Queue+event_shift)
    * ["occupied"](#module_work.Queue+event_occupied)
    * ["unshift"](#module_work.Queue+event_unshift)
    * ["empty"](#module_work.Queue+event_empty)
    * ["cancel"](#module_work.Queue+event_cancel)

<a name="new_module_work.Queue_new"></a>
#### new Queue([options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.maxConcurrent] | <code>number</code> | <code>1</code> |  |
| [options.name] | <code>string</code> |  | useful for debugging |

<a name="module_work.Queue.Queue+name"></a>
#### queue.name : <code>string</code>
useful for debugging

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue.Queue+queued"></a>
#### queue.queued : <code>Array</code>
the current task queue

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue.Queue+active"></a>
#### queue.active : <code>Array</code>
The in-progress tasks

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue.Queue+maxConcurrent"></a>
#### queue.maxConcurrent : <code>number</code>
when emptying, specifying the max number of tasks which may run simultaneously.

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
**Default**: <code>1</code>  
<a name="module_work.Queue+length"></a>
#### queue.length : <code>number</code>
queue length

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+freeSlotCount"></a>
#### queue.freeSlotCount : <code>number</code>
**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+push"></a>
#### queue.push(task) ⇒ <code>[Task](#module_work.Task)</code>
add a task to the end of the queue

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| task | <code>[Task](#module_work.Task)</code> | task instance |

<a name="module_work.Queue+shift"></a>
#### queue.shift() ⇒ <code>[Task](#module_work.Task)</code>
returns the next task in the queue and adds it to the `active` list.

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+process"></a>
#### queue.process()
process the queue - attempt to resolve each task.

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+unshift"></a>
#### queue.unshift(newTask) ⇒ <code>[Task](#module_work.Task)</code>
insert a task at the front of the queue, returning the instance inserted

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| newTask | <code>[Task](#module_work.Task)</code> | the task to be inserted |

<a name="module_work.Queue+cancel"></a>
#### queue.cancel() ⇒ <code>[Task](#module_work.Task)</code>
Shifts the next task off the queue and calls `.cancel()` on it

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+isEmpty"></a>
#### queue.isEmpty() ⇒
Test whether any tasks are queued or active

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
**Returns**: boolean  
<a name="module_work.Queue+event_occupied"></a>
#### "occupied"
Emitted at the moment a queue becomes occupied (has at least 1 task)

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+event_push"></a>
#### "push"
Emitted when a task is added

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

| Type | Description |
| --- | --- |
| <code>[Task](#module_work.Task)</code> | the task that was pushed |

<a name="module_work.Queue+event_empty"></a>
#### "empty"
Emitted after the final task is taken off the queue for processing

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+event_complete"></a>
#### "complete"
Emitted when the queue processing is complete

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+event_shift"></a>
#### "shift"
Emitted when a task is shifted

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

| Type | Description |
| --- | --- |
| <code>[Task](#module_work.Task)</code> | the task that was pushed |

<a name="module_work.Queue+event_occupied"></a>
#### "occupied"
Emitted at the moment a queue becomes occupied (has at least 1 task)

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+event_unshift"></a>
#### "unshift"
Emitted when a task is unshifted to the front of the queue

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

| Type | Description |
| --- | --- |
| <code>[Task](#module_work.Task)</code> | the task that was pushed |

<a name="module_work.Queue+event_empty"></a>
#### "empty"
Emitted after the final task is taken off the queue for processing

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue+event_cancel"></a>
#### "cancel"
Emitted when a task is cancelled

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

| Type | Description |
| --- | --- |
| <code>[Task](#module_work.Task)</code> | the task that was cancelled |

<a name="module_work.Task"></a>
### tq.Task ⇐ <code>module:state-machine</code>
A task defines a piece of work which needs doing now, or in the future. When you create a task you receive a promise for its result. Process the task using `task.process()`.

**Kind**: static class of <code>[work](#module_work)</code>  
**Extends:** <code>module:state-machine</code>  

* [.Task](#module_work.Task) ⇐ <code>module:state-machine</code>
    * [new Task(resolver, [options])](#new_module_work.Task_new)
    * _instance_
        * [.promise](#module_work.Task.Task+promise) : <code>external:Promise</code>
        * [.resolver](#module_work.Task.Task+resolver) : <code>function</code> &#124; <code>Array.&lt;function()&gt;</code>
        * [.name](#module_work.Task.Task+name) : <code>string</code>
        * [.data](#module_work.Task.Task+data) : <code>string</code>
        * [.process()](#module_work.Task+process)
        * [.cancel()](#module_work.Task+cancel)
        * ["fulfilled"](#module_work.Task+event_fulfilled)
        * ["resolved"](#module_work.Task+event_resolved)
        * ["rejected"](#module_work.Task+event_rejected)
        * ["running"](#module_work.Task+event_running)
    * _static_
        * [.eState](#module_work.Task.eState) : <code>enum</code>

<a name="new_module_work.Task_new"></a>
#### new Task(resolver, [options])

| Param | Type | Description |
| --- | --- | --- |
| resolver | <code>function</code> &#124; <code>Array.&lt;function()&gt;</code> | the resolver function |
| [options] | <code>object</code> | an object containing optional values |
| [options.name] | <code>string</code> | a name string, useful for debugging |
| [options.data] | <code>object</code> | data used by the resolver function |

<a name="module_work.Task.Task+promise"></a>
#### task.promise : <code>external:Promise</code>
a promise for the completion of the task

**Kind**: instance property of <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task.Task+resolver"></a>
#### task.resolver : <code>function</code> &#124; <code>Array.&lt;function()&gt;</code>
One or more functions to resolve the deferred. Each resolver function will be passed the deferred, which it must either resolve or reject.

**Kind**: instance property of <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task.Task+name"></a>
#### task.name : <code>string</code>
useful for debug output

**Kind**: instance property of <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task.Task+data"></a>
#### task.data : <code>string</code>
data for the task

**Kind**: instance property of <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task+process"></a>
#### task.process()
Process the task - settled the deferred using the supplied resolver function(s). The resolver function is called in the context of the task and receives a `deferred`, which must be resolved.

**Kind**: instance method of <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task+cancel"></a>
#### task.cancel()
a cancelled task fulfils with the value -1

**Kind**: instance method of <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task+event_fulfilled"></a>
#### "fulfilled"
Emitted when a task fulfills

**Kind**: event emitted by <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task+event_resolved"></a>
#### "resolved"
Emitted when a task is resolved

**Kind**: event emitted by <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task+event_rejected"></a>
#### "rejected"
Emitted when a task is rejected

**Kind**: event emitted by <code>[Task](#module_work.Task)</code>  

| Type | Description |
| --- | --- |
| <code>Error</code> | the rejection reason |

<a name="module_work.Task+event_running"></a>
#### "running"
Emitted when a task starts

**Kind**: event emitted by <code>[Task](#module_work.Task)</code>  
<a name="module_work.Task.eState"></a>
#### Task.eState : <code>enum</code>
The various Task states.

**Kind**: static enum property of <code>[Task](#module_work.Task)</code>  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| PENDING | <code>string</code> | <code>&quot;pending&quot;</code> | 
| RUNNING | <code>string</code> | <code>&quot;running&quot;</code> | 
| FULFILLED | <code>string</code> | <code>&quot;fulfilled&quot;</code> | 
| REJECTED | <code>string</code> | <code>&quot;rejected&quot;</code> | 
| RESOLVED | <code>string</code> | <code>&quot;resolved&quot;</code> | 
| CANCELLED | <code>string</code> | <code>&quot;cancelled&quot;</code> | 


* * *

&copy; 2015 Lloyd Brookes \<75pound@gmail.com\>. Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).
