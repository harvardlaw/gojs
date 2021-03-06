$(function(){

  $('.js-addQuestionButton').attr("disabled", true);
  $('.js-removeQuestionButton').attr("disabled", true);

  var GO = go.GraphObject.make;  //for conciseness in defining node templates
  var currentKeyID = null;
  var currentNodeData = null;

  myDiagram =
  GO(go.Diagram, "myDiagramDiv",  //Diagram refers to its DIV HTML element by id
  {   allowCopy: false,
    initialContentAlignment: go.Spot.Left,
    layout:
    GO(go.LayeredDigraphLayout,
      {
        setsPortSpots: true,  // Links already know their fromSpot and toSpot
        columnSpacing: 5,
        isInitial: false,
        isOngoing: false
      }),
      validCycle: go.Diagram.CycleNotDirected,
      "undoManager.isEnabled": true
    });
    go.Diagram.inherit(DragLinkingTool, go.DraggingTool);
    myDiagram.toolManager.draggingTool = new DragLinkingTool();
    myDiagram.addDiagramListener("LayoutCompleted", function(e) {
      myDiagram.nodes.each(function(node) {
        if (node.category === "Recycle") {
          console.log('Node Recycled.');
          return;
        }
        node.minLocation = new go.Point(node.location.x, -Infinity);
      });
    });

    myDiagram.addDiagramListener('ObjectSingleClicked', function(e) {
      $('.js-previewNoCard').css("display", "none");
      var myElement = document.querySelector(".js-previewContainer");
      myElement.style.display = "inline-block";
      var part = e.subject.part;
      if (!(part instanceof go.Node)) return;
      $(".js-editTitleText").text(part.data.name);
      editButtons(part.data.rightArray);
      var iconText = (part.data.card_icon == null) ? "face" : part.data.card_icon;
      $("#selectedIcon").text(iconText);
      var placeholderText = (part.data.card_subtext == null) ? "Answer here" : part.data.card_subtext;
      $(".js-editAnswerType").attr("placeholder", placeholderText);
      currentKeyID = part.data.key;
      currentNodeData = myDiagram.model.findNodeDataForKey(currentKeyID);
      if (part.data.rightArray.length <= 1) $('.js-removeAnswerButton').attr("disabled", true);
      else $('.js-removeAnswerButton').attr("disabled", false);
      $('.js-addQuestionButton').attr("disabled", false);
      $('.js-removeQuestionButton').attr("disabled", false);
    });

    myDiagram.addDiagramListener('InitialLayoutCompleted', function(e) {
      layout();
    });

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", function(e) {
      var button = document.getElementById("SaveButton");
      if (button) button.disabled = !myDiagram.isModified;
      var idx = document.title.indexOf("*");
      if (myDiagram.isModified) {
        if (idx < 0) document.title += "*";
      } else {
        if (idx >= 0) document.title = document.title.substr(0, idx);
      }
    });
    // To simplify this code we define a function for creating a context menu button:
    function makeButton(text, action, visiblePredicate) {
      return GO("ContextMenuButton",
      GO(go.TextBlock, text),
      { click: action },
      // don't bother with binding GraphObject.visible if there's no predicate
      visiblePredicate ? new go.Binding("visible", "", visiblePredicate).ofObject() : {});
    }

    /*var nodeMenu =  // context menu for each Node
    GO(go.Adornment, "Vertical",
      makeButton("Delete",
        function(e, obj) {
          e.diagram.commandHandler.deleteSelection();
          layout();
      }),
      makeButton("Add Answer",
        function (e, obj) {
          addRightPort();
      })
    );*/

  var portSize = new go.Size(100, 40);
  var smallsize = new go.Size(10, 10);

  // the node template
  // includes a panel on each side with an itemArray of panels containing ports
  myDiagram.nodeTemplate =

  GO(go.Node, "Auto",
    { locationObjectName: "BODY",
    locationSpot: go.Spot.Center,
    selectionObjectName: "BODY"
    },
    GO(go.Shape, { fill: "white", stroke: "black", strokeWidth: 2 }),
    GO(go.Panel, "Table", {
      //,
      //contextMenu: nodeMenu
    },

    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

    // the body
    GO(go.Panel, "Auto",
    { row: 1,
      column: 1,
      name: "BODY",
      stretch: go.GraphObject.Fill
    },
      GO(go.Shape, "Rectangle",
      { fill: "#AC193D",
        stroke: null,
        strokeWidth: 0,
        margin: new go.Margin(1,0,1,2),
        minSize: new go.Size(56, 56)
      }),
      GO(go.TextBlock,
      { margin: 10,
        textAlign: "center",
        font: "18px  Segoe UI,sans-serif",
        stroke: "white",
        editable: false
      },
      new go.Binding("text", "name").makeTwoWay())
    ),  // end Auto Panel body
  // the Panel holding the left port elements, which are themselves Panels,
  // created for each item in the itemArray, bound to data.leftArray

    GO(go.Panel, "Vertical",
      new go.Binding("itemArray", "leftArray"),
      { row: 1, column: 0,
        itemTemplate:
        GO(go.Panel,
          { _side: "left",  // internal property to make it easier to tell which side it's on
          fromSpot: go.Spot.Left,
          toSpot: go.Spot.Left,
          fromLinkable: true,
          toLinkable: true,
          cursor: "pointer"//,
          //contextMenu: portMenu
        },
      new go.Binding("portId", "portId"),
      GO(go.Shape, "Circle",
        { stroke: 'red',
        strokeWidth: 1,
        desiredSize: smallsize,
        margin: new go.Margin(1,0,1,2) },
        new go.Binding("fill", "portColor"))
      )}  // end itemTemplate
    ),  // end Vertical Panel

    // the Panel holding the right port elements, which are themselves Panels,
    // created for each item in the itemArray, bound to data.rightArray
    GO(go.Panel, "Vertical",
    new go.Binding("itemArray", "rightArray"),
    { row: 1, column: 2,
      itemTemplate:
      GO(go.Panel,
        { _side: "right",
        fromSpot: go.Spot.Right,
        toSpot: go.Spot.Right,
        fromLinkable: true,
        toLinkable: true,
        cursor: "pointer"//,
        //contextMenu: portMenu
      },
      new go.Binding("portId", "portId"),
      GO(go.Shape, "Rectangle",
      { stroke: null,
        strokeWidth: 0,
        desiredSize: portSize,
        margin: new go.Margin(1,2,1,0) },
        new go.Binding("fill", "portColor")),
        GO(go.TextBlock,
          { margin: 10,
            textAlign: "center",
            font: "18px  Segoe UI,sans-serif",
            stroke: "white",
            editable: false },

            new go.Binding("text", "name").makeTwoWay())
    )}  // end itemTemplate
  )  // end Vertical Panel
));  // end Node

    myDiagram.toolManager.clickCreatingTool.archetypeNodeData = {
      name: "Enter question here.",
      leftArray: [ {"portColor":"black", "portId":"left0", 'name':'connect'} ],
      rightArray: [ {"portColor":"lightblue", "portId":"right0", 'name':'NEXT'} ],
      topArray: [],
      bottomArray: [],
    };

    /*myDiagram.contextMenu =
    GO(go.Adornment, "Vertical",
    makeButton("Paste",
    function(e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint); },
    function(o) { return o.diagram.commandHandler.canPasteSelection(); }),
    makeButton("Undo",
    function(e, obj) { e.diagram.commandHandler.undo(); },
    function(o) { return o.diagram.commandHandler.canUndo(); }),
    makeButton("Redo",
    function(e, obj) { e.diagram.commandHandler.redo(); },
    function(o) { return o.diagram.commandHandler.canRedo(); })
  );*/
  // load the diagram from JSON data
  load();

  // This custom-routing Link class tries to separate parallel links from each other.
  // This assumes that ports are lined up in a row/column on a side of the node.
  function CustomLink() {
    go.Link.call(this);
  };


  go.Diagram.inherit(CustomLink, go.Link);

  function addPort(side) {
    myDiagram.startTransaction("addPort");
    myDiagram.selection.each(function(node) {
      // skip any selected Links
      if (!(node instanceof go.Node)) return;
      // compute the next available index number for the side
      var i = 0;
      while (node.findPort(side + i.toString()) !== node) i++;
      // now this new port name is unique within the whole Node because of the side prefix
      var name = side + i.toString();
      // get the Array of port data to be modified
      var arr = node.data[side + "Array"];
      if (arr) {
        // create a new port data object
        var newportdata = {
          portId: name,
          //{#          portColor: go.Brush.randomColor()#}
          portColor: 'lightblue',
          name:'NEXT'

          // if you add port data properties here, you should copy them in copyPortData above
        };
        // and add it to the Array of port data
        myDiagram.model.insertArrayItem(arr, -1, newportdata);
      }
    });
    myDiagram.commitTransaction("addPort");
  }
  // Remove the clicked port from the node.
  // Links to the port will be redrawn to the node's shape.

  function DragLinkingTool() {
    go.DraggingTool.call(this);
    this.isGridSnapEnabled = true;
    this.isGridSnapRealtime = false;
    this.gridSnapCellSize = new go.Size(182, 1);
    this.gridSnapOrigin = new go.Point(5.5, 0);
  }

  // Handle dragging a link specially -- by starting the RelinkingTool on that Link
  /** @override */
  DragLinkingTool.prototype.doActivate = function() {

    var diagram = this.diagram;
    if (diagram === null) return;
    this.standardMouseSelect();
    var main = this.currentPart;  // this is set by the standardMouseSelect
    if (main instanceof go.Link) { // maybe start relinking instead of dragging
      var relinkingtool = diagram.toolManager.relinkingTool;
      // tell the RelinkingTool to work on this Link, not what is under the mouse
      relinkingtool.originalLink = main;
      // start the RelinkingTool
      diagram.currentTool = relinkingtool;
      // can activate it right now, because it already has the originalLink to reconnect
      relinkingtool.doActivate();
      relinkingtool.doMouseMove();
    } else {
      go.DraggingTool.prototype.doActivate.call(this);
    }


  };
  // end DragLinkingTool

  function layout() {
    myDiagram.layoutDiagram(true);
    myDiagram.selection.each(function(node) {
    });
  }

  // Change the color of the clicked port.
  function changeColor(port) {
    myDiagram.startTransaction("colorPort");
    var data = port.data;
    myDiagram.model.setDataProperty(data, "portColor", 'lightblue');//go.Brush.randomColor());
    myDiagram.commitTransaction("colorPort");
  }

  var textFile = null;

  function makeTextFile (text) {
    var data = new Blob([text], {type: 'application/json'});
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }
    textFile = window.URL.createObjectURL(data);
    // returns a URL you can use as a href
    return textFile;
  };

  // Save the model to / load it from JSON text shown on the page itself, not in a database.
  function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
    var create = document.getElementById('create'),
    textbox = document.getElementById('textbox');

    var link = document.createElement('a');
    link.setAttribute('download', 'Template.json');
    link.href = makeTextFile($("#mySavedModel").val());
    document.body.appendChild(link);

    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });

  }

  function load() {
    myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    // When copying a node, we need to copy the data that the node is bound to.
    // This JavaScript object includes properties for the node as a whole, and
    // four properties that are Arrays holding data for each port.
    // Those arrays and port data objects need to be copied too.
    // Thus Model.copiesArrays and Model.copiesArrayObjects both need to be true.
    // Link data includes the names of the to- and from- ports;
    // so the GraphLinksModel needs to set these property names:
    // linkFromPortIdProperty and linkToPortIdProperty.
  }

  var editTitleField = false;

  $('.js-editTitleText').on('click', function(e){
    $(this).hide();
    $(this).siblings('.js-editTitleField').show();
    var titleText = $(this).html();
    $(this).siblings('.js-editTitleField').val(titleText);
    $(this).siblings('.js-editTitleField').focus();
    editTitleField = true;
  });

  $('.js-editTitleField').focusout(function(e){
    if (editTitleField == true) {
      var editedText = ($('.js-editTitleField').val().length == 0) ? "Enter question here." : $('.js-editTitleField').val();
      $('.js-editTitleField').val("");
      $(this).hide();
      $(this).siblings('.js-editTitleText').show();
      $(this).siblings('.js-editTitleText').html(editedText);
      editTitleField = false;
      if (currentNodeData !== null) myDiagram.model.setDataProperty(currentNodeData, "name", editedText);
    }
  });

  $('.js-editTitleField').keydown(function (e){
    if(e.keyCode == 13){
        $(this).focusout();
    }
  });

  var editIconField = false;
  $('.js-editIconOptions').hover(function(e) {
    $('.js-editIconIcon').css("color", "#D16103"); //$saffron
  }, function(e) {
    if (editIconField == false) {
      $('.js-editIconIcon').css("color", "#9E9E9E"); //$grey500
    }
  });
  $('.js-editIconOptions').click(function(e) {
    if (editIconField == false) {
      var blocks = $('.iconOption').length;
      var radius = 50;
      var angle = (2*Math.PI)/blocks;
      $('.iconOption').each(function(i) {
        $(this).css("opacity", 1);
        var x = (Math.sin(angle*i)*radius);
        var y = (Math.cos(angle*i)*radius);
        var translatestr = "translate("+x+"px,"+y+"px)";
        $(this).css("transform", translatestr);
      });
      $('.js-editIconIcon').css("color", "#D16103"); //$saffron
      editIconField = true;
    }
    else {
      $('.iconOption').each(function(i) {
        $(this).css("opacity", 0);
        var translatestr = "translate(0px,0px)";
        $(this).css("transform", translatestr);
      });
      $('.js-editIconIcon').css("color", "#9E9E9E"); //$grey500
      editIconField = false;
      // Swap Icons
      var selectedIcon = e.target.innerText;
      var currentIcon = $('#selectedIcon').text();
      $('#selectedIcon').text(selectedIcon);
      e.target.innerText = currentIcon;
      if (currentNodeData !== null) myDiagram.model.setDataProperty(currentNodeData, "card_icon", selectedIcon);
    }
  });

  var editButtonField = false;

  $('.js-buttonWrapper').on("click", ".js-editButtonIcon", function(e){
    $(this).hide();
    $(this).siblings('.js-editButtonField').show();
    var buttonText = $(this).html();
    $(this).siblings('.js-editButtonField').val(buttonText);
    $(this).siblings('.js-editButtonField').focus();
    editButtonField = true;
  });

  $('.js-buttonWrapper').on("focusout", function(e){
    if (editButtonField == true) {
      var editedText = $(e.target).val();
      editedText = editedText.toUpperCase()
      $(e.target).val("");
      $(e.target).hide();
      $(e.target).siblings('.js-editButtonIcon').show();
      if (editedText != "") $(e.target).siblings('.js-editButtonIcon').html(editedText);
      else $(e.target).siblings('.js-editButtonIcon').html("NEXT");
      editButtonField = false;
      var i = $('.js-editButtonField').index($(e.target));
      if (currentNodeData !== null) myDiagram.model.setDataProperty(currentNodeData.rightArray[i], "name", editedText); //currentNodeData.rightArray[i].name = editedText;
    }
    layout();
  });

  $('.js-buttonWrapper').on("keydown", ".js-editButtonField",function (e){
    if(e.keyCode == 13){
        $(this).focusout();
    }
  });

  function addRightPort() {

  }

  $('.js-layoutButton').click(function(e) {
    layout();
  });

  $('.js-loadButton').click(function(e) {
    load();
  });

  $('.js-addAnswerButton').click(function(e) {
    addPort("right");
    layout();
    if (currentNodeData !== null) var currentRightArray =  currentNodeData.rightArray;
    editButtons(currentRightArray);
  });

  $('.js-removeAnswerButton').click(function(e) {
    myDiagram.startTransaction("removePort");
    myDiagram.selection.each(function(node) {
      if (!(node instanceof go.Node)) return;
      var arr = node.data["rightArray"];
      if (arr && (arr.length > 1)) {
        myDiagram.model.removeArrayItem(arr, arr.length-1);
      }
    });
    myDiagram.commitTransaction("removePort");
    layout();
    if (currentNodeData !== null) var currentRightArray =  currentNodeData.rightArray;
    editButtons(currentRightArray);
    if (currentRightArray.length <= 1) $('.js-removeAnswerButton').attr("disabled", true);
    else $('.js-removeAnswerButton').attr("disabled", false);
  });

  $('.js-addQuestionButton').click(function(e) {
    var currP = myDiagram.position;
    var p = new go.Point(150+currP.x,50+currP.y);
    myDiagram.toolManager.clickCreatingTool.insertPart(p);
  });

  $('.js-removeQuestionButton').click(function(e) {
    myDiagram.startTransaction("removeQuestion");
    var removeNodeArr = []
    myDiagram.selection.each(function(node) {
      if (!(node instanceof go.Node)) return;
        removeNodeArr.push(node);
    });
    for (i = 0; i < removeNodeArr.length; i++) {
      myDiagram.remove(removeNodeArr[i]);
    }
    myDiagram.commitTransaction("removeQuestion");
    layout();
  });

  $('.js-saveButton').click(function(e) {
    save();
  });

  function editButtons(rightArray) {
    var buttonStr = "";
    $(".js-buttonWrapper").empty();
    for (i = 0; i < rightArray.length; i++) {
      var currentButtonText = rightArray[i].name;
      buttonStr += '<div class="js-editButtonWrapper"><input type="text" class="btn-large js-editButtonField" id="css-buttonField" placeholder="Next" pattern=".{0,15}" />';
      buttonStr += '<button class="btn-large waves-effect waves-white js-editButtonIcon">' + currentButtonText + '</button></div>';
    }
    $(".js-buttonWrapper").html(buttonStr);
  }

});
