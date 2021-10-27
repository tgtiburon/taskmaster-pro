var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);

  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);


  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// because we need to use Moment.js with adding and editing 
// tasks we made an audit function
var auditTask = function(taskEl) {
  // debugging
  //console.log(taskEl);
  
  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00 pm (12am + 17 hours)
  var time = moment(date, "L").set("hour", 17); 

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danager");

  // apply new class if task is near/over due date
  if ( moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
    // Moment reads left to right. get time, then see if it is less than 2 days out
  } else if (Math.abs(moment().diff(time, "days")) <= 2)
  {
    $(taskEl).addClass("list-group-item-warning");

  }
  

}; // end auditTask

// user clicked on the paragraph element
// make a text input box with the task name to 
// be edited.
$(".list-group").on("click", "p", function() {
    var text = $(this)
      .text()
      .trim();
    console.log(text);

    var textInput = $("<textarea>")
        .addClass("form-control")
        .val(text);

  $(this).replaceWith(textInput);
  textInput.trigger("focus");

}); // delegated <p> click close


// blur event is triggered when user clicks anywheres other than
// the particular element.
$(".list-group").on("blur", "textarea", function() {

  // lets use this to save any edits
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    // default js method to replace list- with "" to make it just
    // tasks.toDo  instead of lists-tasks-toDo  
    .replace("list-", "");
  
  // get the tasks postiion in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
// tasks is an object
// tasks[status] returns an array  e.g. toDo
// tasks[status][index] returns at specific index
// tasks[status][index].text returns the text property of index
  tasks[status][index].text = text;

  saveTasks();

  // now convert the <textarea> back into a <p> element
  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  //replace text area with p element
  $(this).replaceWith(taskP);


}); // end ".list-group" 


// add eventlistener

// due date was clicked of existing task
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this)
    .text()
    .trim();

    // create new input element
    var dateInput = $("<input>")
      .attr("type", "text")
      .addClass("form-control")
      .val(date);

    //swap out elements

    $(this).replaceWith(dateInput);

    // add the jQuery UI datepicker
    dateInput.datepicker( {
      minDate: 1,
      onClose: function() {
        // when calendar is closed, force a "change" event on the 'dateInput'
        $(this).trigger("change");
      }
    });// end dateInput

    //automatically focus on new element
    dateInput.trigger("focus");



});// end .list-group "click"

// lets convert it back once the user clicks outside
// value of date was changed
// We will "change" for the datepicker
$(".list-group").on("change", "input[type='text']", function() {
  //get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of the li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  //update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with the boostrap classes.
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  //replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass this task's <li> element to auditTask() to check new due date
  // and color it appropriately.
  auditTask($(taskSpan).closest(".list-group-item"));

});// end "list-group" blur

// convert text field into a jquery date picker
$("#modalDueDate").datepicker({
  // force user to select a future date
  minDate: 1 // 1 day in the future
});



// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    

    saveTasks();
  }

  
});

// test code
// turned every element with ".list-group" sortable
// sortable method
// helper: clone make a copy of the element to move around
// added listener to events
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    //console.log("activate", this);
    var taskList = $(this)
      .addClass(".dropover");
      //console.log(this);
    var trashBar = $(".bottom-trash")
      .addClass("bottom-trash-drag");
      
  },
  deactivate: function(event) {
   // console.log("deactivate", this);
   var taskList = $(this)
      .removeClass(".dropover");
     // console.log(this);
    var trashBar = $(".bottom-trash")
     .removeClass("bottom-trash-drag");

  },
  over: function(event) {
    //console.log("over", event.target);
    var taskList = $(this)
      .addClass(".dropover-active");
      //console.log(this);

  },
  out: function(event) {
    //console.log("out", event.target);
    var taskList = $(this)
      .removeClass(".dropover-active");
     // console.log(this);
  },
  update: function(event) {
    // regular javascript this
    //console.log("update", this);
    // jquery this
    //console.log($(this).children());
    var tempArr = [];
    // loop over current set of children in a sortable list
    $(this).children().each(function() {
     
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();
      
        // add task data to the temp arra as an object
        tempArr.push({
          text: text,
          date: date
        });
    });

    // trim down lists ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

      // update array on tasks object and save
      tasks[arrName] = tempArr;
      saveTasks();
   // console.log(tempArr);
  }
}); // end sortable method

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// trash method
$("#trash").droppable({
  
    accept: ".card .list-group-item",
    tolerance: "touch",
    drop: function(event, ui) {
      console.log("drop");
      // we do not need to call saveTasks because
      // .remove triggers an update
      ui.draggable.remove();
      var trashBar = $(".bottom-trash")
      .removeClass("bottom-trash-active");
    },
    over: function(event, ui) {
      //console.log("over");
      var trashBar = $(".bottom-trash")
      .addClass("bottom-trash-active");
    },
    out: function(event, ui) {
      //console.log("out");
      var trashBar = $(".bottom-trash")
      .removeClass("bottom-trash-active");
    }
}); // end trash method

setInterval(function() {
  // loop through every task on the page with a class
  // 'list-group-item and pass the el to the auditTask
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });  // every 30 min
}, (1000 * 60) * 30);

// load tasks for the first time
loadTasks();


