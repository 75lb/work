[![view on npm](http://img.shields.io/npm/v/work.svg)](https://www.npmjs.org/package/work)
[![npm module downloads per month](http://img.shields.io/npm/dm/work.svg)](https://www.npmjs.org/package/work)
[![Build Status](https://travis-ci.org/75lb/work.svg?branch=master)](https://travis-ci.org/75lb/work)
[![Dependency Status](https://david-dm.org/75lb/work.svg)](https://david-dm.org/75lb/work)

<a name="module_work"></a>
## work

* [work](#module_work)
  * [.Job](#module_work.Job)
    * [new Job(resolver, [options])](#new_module_work.Job_new)
    * [.promise](#module_work.Job#promise) : <code>external:Promise</code>
    * [.resolver](#module_work.Job#resolver) : <code>function</code> &#124; <code>Array.&lt;function()&gt;</code>
    * [.name](#module_work.Job#name) : <code>string</code>
    * [.data](#module_work.Job#data) : <code>string</code>
    * [.process()](#module_work.Job#process)
    * ["resolved"](#module_work.Job#event_resolved)
    * ["settled"](#module_work.Job#event_settled)
    * ["rejected"](#module_work.Job#event_rejected)
    * ["starting"](#module_work.Job#event_starting)
  * [.Queue](#module_work.Queue)
    * [new Queue([options])](#new_module_work.Queue_new)
    * [.name](#module_work.Queue#name) : <code>string</code>
    * [.queue](#module_work.Queue#queue) : <code>Array</code>
    * [.active](#module_work.Queue#active) : <code>Array</code>
    * [.maxConcurrent](#module_work.Queue#maxConcurrent) : <code>number</code>
    * [.length](#module_work.Queue#length) : <code>number</code>
    * [.push(task)](#module_work.Queue#push) ⇒ <code>[Job](#module_work.Job)</code>
    * [.shift()](#module_work.Queue#shift) ⇒ <code>[Job](#module_work.Job)</code>
    * [.view(parentEl)](#module_work.Queue#view) ⇒ <code>QueueView</code>
    * [.setSchedule(schedule)](#module_work.Queue#setSchedule)
    * [.clearSchedule()](#module_work.Queue#clearSchedule)
    * [.process()](#module_work.Queue#process)
    * ["occupied"](#module_work.Queue#event_occupied)
    * ["push"](#module_work.Queue#event_push)
    * ["empty"](#module_work.Queue#event_empty)
    * ["shift"](#module_work.Queue#event_shift)
    * ["complete"](#module_work.Queue#event_complete)

<a name="module_work.Job"></a>
### work.Job
A task defines a piece of work which needs doing now, or in the future. When you create a task you receive a promise for its result.
Process the task using `task.process()`.

**Kind**: static class of <code>[work](#module_work)</code>  

* [.Job](#module_work.Job)
  * [new Job(resolver, [options])](#new_module_work.Job_new)
  * [.promise](#module_work.Job#promise) : <code>external:Promise</code>
  * [.resolver](#module_work.Job#resolver) : <code>function</code> &#124; <code>Array.&lt;function()&gt;</code>
  * [.name](#module_work.Job#name) : <code>string</code>
  * [.data](#module_work.Job#data) : <code>string</code>
  * [.process()](#module_work.Job#process)
  * ["resolved"](#module_work.Job#event_resolved)
  * ["settled"](#module_work.Job#event_settled)
  * ["rejected"](#module_work.Job#event_rejected)
  * ["starting"](#module_work.Job#event_starting)

<a name="new_module_work.Job_new"></a>
#### new Job(resolver, [options])

| Param | Type | Description |
| --- | --- | --- |
| resolver | <code>function</code> &#124; <code>Array.&lt;function()&gt;</code> | the resolver function |
| [options] | <code>object</code> | an object containing optional values |
| [options.name] | <code>string</code> | a name string, useful for debugging |
| [options.data] | <code>object</code> | data used by the resolver function |

<a name="module_work.Job#promise"></a>
#### job.promise : <code>external:Promise</code>
a promise for the completion of the task

**Kind**: instance property of <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#resolver"></a>
#### job.resolver : <code>function</code> &#124; <code>Array.&lt;function()&gt;</code>
One or more functions to resolve the deferred. Each resolver function will be passed the deferred, which it must either resolve or reject.

**Kind**: instance property of <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#name"></a>
#### job.name : <code>string</code>
useful for debug output

**Kind**: instance property of <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#data"></a>
#### job.data : <code>string</code>
data for the task

**Kind**: instance property of <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#process"></a>
#### job.process()
Process the task - settled the deferred using the supplied resolver function(s)

**Kind**: instance method of <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#event_resolved"></a>
#### "resolved"
Emitted when a task resolves

**Kind**: event emitted by <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#event_settled"></a>
#### "settled"
Emitted when a task is settled

**Kind**: event emitted by <code>[Job](#module_work.Job)</code>  
<a name="module_work.Job#event_rejected"></a>
#### "rejected"
Emitted when a task is rejected

**Kind**: event emitted by <code>[Job](#module_work.Job)</code>  

| Type | Description |
| --- | --- |
| <code>Error</code> | the rejection reason |

<a name="module_work.Job#event_starting"></a>
#### "starting"
Emitted when a task starts

**Kind**: event emitted by <code>[Job](#module_work.Job)</code>  
<a name="module_work.Queue"></a>
### work.Queue
queue class for processing promises

**Kind**: static class of <code>[work](#module_work)</code>  

* [.Queue](#module_work.Queue)
  * [new Queue([options])](#new_module_work.Queue_new)
  * [.name](#module_work.Queue#name) : <code>string</code>
  * [.queue](#module_work.Queue#queue) : <code>Array</code>
  * [.active](#module_work.Queue#active) : <code>Array</code>
  * [.maxConcurrent](#module_work.Queue#maxConcurrent) : <code>number</code>
  * [.length](#module_work.Queue#length) : <code>number</code>
  * [.push(task)](#module_work.Queue#push) ⇒ <code>[Job](#module_work.Job)</code>
  * [.shift()](#module_work.Queue#shift) ⇒ <code>[Job](#module_work.Job)</code>
  * [.view(parentEl)](#module_work.Queue#view) ⇒ <code>QueueView</code>
  * [.setSchedule(schedule)](#module_work.Queue#setSchedule)
  * [.clearSchedule()](#module_work.Queue#clearSchedule)
  * [.process()](#module_work.Queue#process)
  * ["occupied"](#module_work.Queue#event_occupied)
  * ["push"](#module_work.Queue#event_push)
  * ["empty"](#module_work.Queue#event_empty)
  * ["shift"](#module_work.Queue#event_shift)
  * ["complete"](#module_work.Queue#event_complete)

<a name="new_module_work.Queue_new"></a>
#### new Queue([options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.maxConcurrent] | <code>number</code> | <code>1</code> |  |
| [options.name] | <code>string</code> |  | useful for debugging |

<a name="module_work.Queue#name"></a>
#### queue.name : <code>string</code>
useful for debugging

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#queue"></a>
#### queue.queue : <code>Array</code>
the current task queue

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#active"></a>
#### queue.active : <code>Array</code>
The in-progress tasks

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#maxConcurrent"></a>
#### queue.maxConcurrent : <code>number</code>
when emptying, specifying the max number of tasks which may run simultaneously.

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
**Default**: <code>1</code>  
<a name="module_work.Queue#length"></a>
#### queue.length : <code>number</code>
queue length

**Kind**: instance property of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#push"></a>
#### queue.push(task) ⇒ <code>[Job](#module_work.Job)</code>
add a task to the queue

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| task | <code>[Job](#module_work.Job)</code> | task instance |

<a name="module_work.Queue#shift"></a>
#### queue.shift() ⇒ <code>[Job](#module_work.Job)</code>
returns the next task in the queue and adds it to the `active` list.

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#view"></a>
#### queue.view(parentEl) ⇒ <code>QueueView</code>
place a view in the DOM under the specified parent element

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| parentEl | <code>Element</code> | the parent element under which to place the view |

<a name="module_work.Queue#setSchedule"></a>
#### queue.setSchedule(schedule)
Define a schedule for processing the queue.

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| schedule | <code>function</code> | the schedule function to execute.. called in the context of this queue instance. |

<a name="module_work.Queue#clearSchedule"></a>
#### queue.clearSchedule()
Clears the schedule set by [module:work#setSchedule](module:work#setSchedule).

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
**Todo**

- [ ] refactor

<a name="module_work.Queue#process"></a>
#### queue.process()
process the queue - attempt to resolve each task.

**Kind**: instance method of <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#event_occupied"></a>
#### "occupied"
Emitted at the moment a queue becomes occupied (has at least 1 task)

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#event_push"></a>
#### "push"
Emitted when a task is added

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

| Type | Description |
| --- | --- |
| <code>[Job](#module_work.Job)</code> | the task that was pushed |

<a name="module_work.Queue#event_empty"></a>
#### "empty"
Emitted after the final task is taken off the queue for processing

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  
<a name="module_work.Queue#event_shift"></a>
#### "shift"
Emitted when a task is shifted

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

| Type | Description |
| --- | --- |
| <code>[Job](#module_work.Job)</code> | the task that was pushed |

<a name="module_work.Queue#event_complete"></a>
#### "complete"
Emitted when the queue processing is complete

**Kind**: event emitted by <code>[Queue](#module_work.Queue)</code>  

* * * 

&copy; 2015 Lloyd Brookes \<75pound@gmail.com\>. Documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown).
