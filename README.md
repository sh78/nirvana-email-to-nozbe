# Migrate Nirvana Data to Nozbe

This project was created as a quick way to move out of
[Nirvana](https://nirvanahq.com/) and into [Nozbe](https://nozbe.com/personal).
As such, **it is not well tested and will probably destroy some data you care
about**.

If you are one of the few people on earth who need this and can work with CLI
programs, I hope this helps save you some time.

## How To

### Backup

Backup all the things - Nirvana, Nozbe, your computer, your online accounts, your
hopes for how well this will work. Everything.

### Usage

```shell
git clone https://github.com/sh78/nirvana-email-to-nozbe
cd nirvana-email-to-nozbe
npm i
node index.js path/to/nirvana_export.json
```

## What Will Happen?

Hopefully, you haven't run the above commands before reading this section. (Just
kidding).

A new text file will be saved in the program directory with the results. This
can be pasted into [an email to your Nozbe AI
robot](https://help.nozbe.com/advanced/email-tasks/#emailmore).

If the resulting text is large (more than a few hundred lines), try splitting it
up into separate emails. In my experience, Nozbe took about half an hour to
process my email and it left out a few sequential chunks of data.

## Limitations

**Deleted and Completed items are skipped**. Let's focus on the present.

**Projects, and Categories will not be created automatically.** For tasks
imported to Nozbe to be assigned the correct Project/Category, there must
already be a corresponding item in Nozbe which. If your data don't match, don't
worry - you can go into Nozbe and create what's missing, or just find/replace
the strings in the result output with new values before sending your email.

**Nozbe [Project Labels](https://help.nozbe.com/management/project-labels/)
won't be connected.** Nozbe attaches labels to the projects themselves, not to
tasks. So Nirvana "Areas" (of focus) tags can't be mapped directly. In your
export, any Area Of Focus tags for a given task will still be rendered as a
Nozbe Hashtag, but they will end up in the task title after importing to Nozbe.
The cleanest approach to this is to set up all of the Nozbe Projects and Labels
first, then remove the Area tags in Nirvana before downloading the Nirvana data.

**_Waiting_ and _Later_ tasks will only be assigned correctly if you have a
Category in Nozbe which contains the corresponding word (not case sensitive).**
In other words, if the receiving Nozbe account doesn't have a Project or
Category with "waiting" in the name, the _Waiting_ state of the original Nirvana
task is lost. See the paragraph above for a workaround.

**_Energy_ levels are treated as Nozbe Categories.** This means that in order to
bring _Energy_ data in from Nirvana, the receiving Nozbe account must already
have these categories in place: `Energy: High`, `Energy: Medium `, `Energy:
Low`.

**Tasks with due dates further than one year away will be due this year.** This
is a bug, or lack of feature, in Nozbe Hashtags as of this writing. Adding a
future task via email like "water the lawn #July 16 2031" causes the task to be
entered as due today (immediately). Adding the same thing via the [quick add
desktop shortcut](https://www.youtube.com/watch?v=FkEOZnHJPUE&t=65s) omits the
date completely.

**[Checklists](https://help.nozbe.com/advanced/email-tasks/#emailchecklist)
embedded in the _Notes_ field from Nirvana data are not translated into Nozbe
checklist comments.** It appears checklists are not supported in Nozbe
multi-item emails.

**_Scheduled_ tasks will be added to Nozbe as due on the scheduled date, unless
they already have a due date.** Nozbe doesn't have an equivalent to Nirvana's
Scheduling feature. The main takeaway here is that a scheduled Nirvana task will
get all up in your face in Nozbe on the day it was supposed to be activated.

**Repeating tasks with complex logic will be simplified, with a note.** Tasks
with more complex repetition rules with be simplified to be compatible with the
[Nozbe Hashtag
syntax](https://nozbe.com/blog/repeating_tasks/#how-to-create-one). A tidied up
version of the original Nirvana data will be added to the task note.

**Paused repeating tasks will still be entered as repeating tasks.**

**Some Task/Project states are not supported.** See the section below on
Nirvana's Data Structure and look for `???` to find out which ones are ignored.
My personal export did not make use of every state.

**Starred state of tasks and projects will not make it through.** I don't see
how stars are representing in the Nirvana export schema. ¯\_(ツ)_/¯

## Nirvana's Export Data Structure

The raw data for a single task looks like this:

```json
{
    "id": "63F5DD83-DDE6-4616-BF5F-67DDB382FFCB",
    "type": "0",
    "_type": "1",
    "ps": "0",
    "_ps": "1",
    "state": "9",
    "_state": "1546063757",
    "parentid": "",
    "_parentid": "1",
    "seq": "1546063818",
    "_seq": "1546063708",
    "seqt": "0",
    "_seqt": "1546063826",
    "seqp": "0",
    "_seqp": "1",
    "name": "Purge and archive",
    "_name": "1546063990",
    "tags": ",At Keyboard,",
    "_tags": "1594029091",
    "etime": "60",
    "_etime": "1546063765",
    "energy": "2",
    "_energy": "1546063761",
    "waitingfor": "",
    "_waitingfor": "1",
    "startdate": "20200801",
    "_startdate": "1594630986",
    "duedate": "",
    "_duedate": "1",
    "reminder": "",
    "_reminder": "0",
    "recurring": "{\"paused\":false,\"freq\":\"monthly\",\"interval\":1,\"nextdate\":\"20200801\",\"hasduedate\":1,\"on\":{\"0\":{\"day\":\"day\",\"nth\":\"1\"}},\"spawnxdaysbefore\":0}",
    "_recurring": "1594630986",
    "note": "See checklist in ~/notes",
    "_note": "1546063810",
    "completed": "0",
    "_completed": "1",
    "cancelled": "0",
    "_cancelled": "1",
    "created": "1546063818"
  }
```

Here is an annotation of the more notable fields. Most of these are considered
in the application logic.

```
  id: [[ UID string like "63F5DD83-DDE6-4616-BF5F-67DDB382FFCB"]]
  created: [[ Unix epoch datetime number ]]
  name: [[ Task Title ]]
  type: [[ 0 || 1 representing whether the item is a task or project ]]
  ps: [[ 0 || 1 representing whether the project is sequential or parallel ]]
  note: [[ note text || empty string ]]
  tags: [[ leading comma; Area/Contact/Label literal; comma]]
  parentid: [[ UID of parent project || empty string ]]
  completed: [[ 0 || Unix epoch datetime number ]]
  cancelled: [[ 0 || 1 representing ??? ]]
  state: [[ Number representing the current phase of a Task or Project ]]
    0 == "Inbox" task
    1 == "Next" task
    2 == "Waiting" task
    3 == "Scheduled" task which does not repeat
    4 == "Someday" task
    5 == "Later" task or "Inactive" project
    6 == "Trash" (Deleted) task
    7 == "Completed" task or project
    8 == ???
    9 == Repeating task
    10 == ???
    11 == "Active" Project
  energy: [[ Number representing energy needed ]]
    0 == none
    1 == "Low"
    2 == "Medium"
    3 == "High"
  startdate: [[ YYYYMMDD || empty string ]]
  duedate: [[ YYYYMMDD || empty string ]]
  recurring: [[ escaped JSON object string || empty string ]]
    paused: [[ boolean ]]
    freq: [[ frequency in English: "daily"/"weekly"/"monthly"/"yearly" ]]
    interval: [[ number of days to re-trigger repeat ]]
    nextdate: [[ next scheduled occurrence: YYYYMMDD]]
    hasduedate: [[ 0 || 1 ]]
    on: [[ time after activation of task to set due date ]]
      0: 
        day: [[ ??? string "day" if due on same day]]
        nth: [[]]
    paused: [[ 0 || 1 ]]
    spawnxdaysbefore: [[ 0 || 1 ]]
```

