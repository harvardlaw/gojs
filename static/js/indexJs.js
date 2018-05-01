$(function(){

  //disable buttons because nodes are not yet visible
  $('.js-addAnswerButton').attr("disabled", true);
  $('.js-removeAnswerButton').attr("disabled", true);
  $('.js-removeQuestionButton').attr("disabled", true);
  $('.js-saveButton').attr("disabled", true);

  //build list of possible select options
  var selectOptions = ["textfield", "fileupload", "none"];

//*************************
//INITIALIZE GRAPH
//*************************
  //create GOJS window
  var GO = go.GraphObject.make;
  var currentKeyID = null;
  var currentNodeData = null;

  myDiagram =
  GO(go.Diagram, "myDiagramDiv",
  {   allowCopy: false,
    initialContentAlignment: go.Spot.Left,
    layout:
    GO(go.LayeredDigraphLayout,
      {
        setsPortSpots: true,
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
    //no card shown in preview window
    $('.js-previewNoCard').css("display", "none");
    var myElement = document.querySelector(".js-previewContainer");
    myElement.style.display = "inline-block";
    var part = e.subject.part;
    if (!(part instanceof go.Node)) return;
    //if current object clicked is a node, update preview card
    $(".js-editTitleText").text(part.data.name);
    editButtons(part.data.rightArray);
    var iconText = (part.data.card_icon == null) ? "face" : part.data.card_icon;
    $("#selectedIcon").text(iconText);
    var answerType = part.data.answerType;
    if ($.inArray(answerType, selectOptions) == -1) answerType = "none";
    $(".js-editAnswerType").val(answerType).prop('selected', true);
    currentKeyID = part.data.key;
    currentNodeData = myDiagram.model.findNodeDataForKey(currentKeyID);
    //update add/remove buttons based on current node
    $('.js-addAnswerButton').attr("disabled", false);
    if (part.data.rightArray.length <= 1) $('.js-removeAnswerButton').attr("disabled", true);
    else $('.js-removeAnswerButton').attr("disabled", false);
    $('.js-addQuestionButton').attr("disabled", false);
    $('.js-removeQuestionButton').attr("disabled", false);
  });

  myDiagram.addDiagramListener('InitialLayoutCompleted', function(e) {
    layout();
  });

  //enable save button if diagram has changed
  myDiagram.addDiagramListener("Modified", function(e) {
    if (myDiagram.isModified) {
      $('.js-saveButton').attr("disabled", false);
      myDiagram.isModified = false;
    }
    else {
      $('.js-saveButton').attr("disabled", true);
    }
  });

  function makeButton(text, action, visiblePredicate) {
    return GO("ContextMenuButton",
    GO(go.TextBlock, text),
    { click: action },
    visiblePredicate ? new go.Binding("visible", "", visiblePredicate).ofObject() : {});
  }

  var portSize = new go.Size(100, 40);
  var smallsize = new go.Size(10, 10);

  //Node template includes a panel on each side with an itemArray of panels containing ports
  myDiagram.nodeTemplate =

  GO(go.Node, "Auto",
    { locationObjectName: "BODY",
    locationSpot: go.Spot.Center,
    selectionObjectName: "BODY"
    },
    GO(go.Shape, { fill: "white", stroke: "black", strokeWidth: 2 }),
    GO(go.Panel, "Table", {
    },

    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    //Main panel
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
    ),
    //left ports
    GO(go.Panel, "Vertical",
      new go.Binding("itemArray", "leftArray"),
      { row: 1, column: 0,
        itemTemplate:
        GO(go.Panel,
          { _side: "left",
          fromSpot: go.Spot.Left,
          toSpot: go.Spot.Left,
          fromLinkable: false,
          toLinkable: true,
          cursor: "pointer"
        },
      new go.Binding("portId", "portId"),
      GO(go.Shape, "Circle",
        { stroke: 'red',
        strokeWidth: 1,
        desiredSize: smallsize,
        margin: new go.Margin(1,0,1,2) },
        new go.Binding("fill", "portColor"))
      )}
    ),
    //right ports
    GO(go.Panel, "Vertical",
    new go.Binding("itemArray", "rightArray"),
    { row: 1, column: 2,
      itemTemplate:
      GO(go.Panel,
        { _side: "right",
        alignment: go.Spot.Right,
        alignmentFocus: go.Spot.Right,
        fromSpot: go.Spot.Right,
        toSpot: go.Spot.Right,
        fromLinkable: true,
        toLinkable: false,
        fromMaxLinks: 1,
        cursor: "pointer"
      },
      new go.Binding("portId", "portId"),
      GO(go.Shape, "Rectangle",
      { alignment: go.Spot.Right,
        alignmentFocus: go.Spot.Right,
        stroke: null,
        strokeWidth: 0,
        desiredSize: portSize,
        //height: portSize.height,
        stretch: go.GraphObject.Horizontal,
        margin: new go.Margin(1,2,1,0) },
        new go.Binding("fill", "portColor")),
        GO(go.TextBlock,
          { verticalAlignment: go.Spot.MiddleLeft,
            margin: new go.Margin(1,0,0,5),
            textAlign: "left",
            overflow: go.TextBlock.OverflowEllipsis,
            font: "18px  Segoe UI,sans-serif",
            stroke: "white",
            //desiredSize: portSize,
            height: portSize.height,
            width: portSize.width-5,
            editable: false },

            new go.Binding("text", "name").makeTwoWay())
    )}
  )
));

    //new node has this default data
    myDiagram.toolManager.clickCreatingTool.archetypeNodeData = {
      name: "Enter question here.",
      leftArray: [ {"portColor":"black", "portId":"left0", 'name':'connect'} ],
      rightArray: [ {"portColor":"lightblue", "portId":"right0", 'name':'NEXT'} ],
      topArray: [],
      bottomArray: [],
    };

  // load the diagram from JSON data
  load();

  function load() {
    myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
  }

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
          portColor: 'lightblue',
          name:'NEXT'
        };
        myDiagram.model.insertArrayItem(arr, -1, newportdata);
      }
    });
    myDiagram.commitTransaction("addPort");
  }

  function DragLinkingTool() {
    go.DraggingTool.call(this);
    this.isGridSnapEnabled = true;
    this.isGridSnapRealtime = false;
    this.gridSnapCellSize = new go.Size(182, 1);
    this.gridSnapOrigin = new go.Point(5.5, 0);
  }

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
  }; // end DragLinkingTool

  function layout() {
    myDiagram.layoutDiagram(true);
    myDiagram.selection.each(function(node) {
    });
  }

  function changeColor(port) {
    myDiagram.startTransaction("colorPort");
    var data = port.data;
    myDiagram.model.setDataProperty(data, "portColor", 'lightblue');//go.Brush.randomColor());
    myDiagram.commitTransaction("colorPort");
  }

//*************************
//EDIT CARD PROPERTIES
//*************************

  //edit title field on the card
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
      myDiagram.startTransaction("editTitleField");
      var editedText = ($('.js-editTitleField').val().length == 0) ? "Enter question here." : $('.js-editTitleField').val();
      $('.js-editTitleField').val("");
      $(this).hide();
      $(this).siblings('.js-editTitleText').show();
      $(this).siblings('.js-editTitleText').html(editedText);
      editTitleField = false;
      if (currentNodeData !== null) myDiagram.model.setDataProperty(currentNodeData, "name", editedText);
      myDiagram.isModified = true;
      myDiagram.commitTransaction("editTitleField");
    }
  });

  $('.js-editTitleField').keydown(function (e){
    if(e.keyCode == 13){
        $(this).focusout();
    }
  });

  //edit icon on the card
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
      myDiagram.startTransaction("editIconOptions");
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
      myDiagram.isModified = true;
      myDiagram.commitTransaction("editIconOptions");
    }
  });

  //edit button text
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
      myDiagram.startTransaction("editButtonWrapper");
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
      myDiagram.isModified = true;
      myDiagram.commitTransaction("editButtonWrapper");
    }
    layout();
  });

  $('.js-buttonWrapper').on("keydown", ".js-editButtonField",function (e){
    if(e.keyCode == 13){
        $(this).focusout();
    }
  });

  //fix layout of graph
  $('.js-layoutButton').click(function(e) {
    layout();
  });

  //load premade template
  $('.js-loadButton').click(function(e) {
    $(".js-loadButton~.ddButton").toggleClass("show");
  });

  $(".js-loadButton~.ddButton li").click(function(e) {
    var fileNeeded = '';
    if ($(this).hasClass("js-loadContactInfo")) fileNeeded = "ContactInfo.json";
    else if ($(this).hasClass("js-loadDemographics")) fileNeeded = "Demographics.json";
    else if ($(this).hasClass("js-loadEnd")) fileNeeded = "End.json";
    myDiagram.startTransaction("loadTemplate");
    $.ajax({
       url: '/loadtemplate',
       type: 'GET',
       dataType: 'json',
       data: {
         payload: fileNeeded,
         data: 'json'
       }
    }).done(function(data) {
      origJson = JSON.parse(myDiagram.model.toJson());
      //dataJson = JSON.parse(data);
      dataJson = data;
      dataJson.nodeDataArray = dataJson.nodeDataArray.concat(origJson.nodeDataArray);
      dataJson.linkDataArray = dataJson.linkDataArray.concat(origJson.linkDataArray);
      myDiagram.model = go.Model.fromJson(dataJson);
      document.getElementById("mySavedModel").value = JSON.stringify(dataJson);
    });
    myDiagram.isModified = true;
    myDiagram.commitTransaction("loadTemplate");
    $(".js-loadButton~.ddButton").toggleClass("show");
  })

  //add rightport to current node
  $('.js-addAnswerButton').click(function(e) {
    addPort("right");
    layout();
    if (currentNodeData !== null) var currentRightArray =  currentNodeData.rightArray;
    editButtons(currentRightArray);
  });

  //remove rightport from current node
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

  //add another node to graph
  $('.js-addQuestionButton').click(function(e) {
    var currP = myDiagram.position;
    var p = new go.Point(150+currP.x,50+currP.y);
    var newPart = myDiagram.toolManager.clickCreatingTool.insertPart(p);
  });

  //remove another node from graph
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

  //show save options to user
  $('.js-saveButton').click(function(e) {
    $(".js-saveButton~.ddButton").toggleClass("show");
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
  });

  //download JSON file to local computer
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
  $('.js-saveLocalButton').click(function (e) {
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
    $(".js-saveButton~.ddButton").toggleClass("show");
  });

  //save current graph to server
  $('.js-saveRemoteButton').click(function (e) {
    myDiagram.startTransaction("save");
    $.ajax({
       url: '/savecurrmodel',
       type: 'GET',
       dataType: 'json',
       data: {
         payload: $("#mySavedModel").val(),
         data: 'json'
       }
    });
    myDiagram.isModified = false;
    $(".js-saveButton~.ddButton").toggleClass("show");
    myDiagram.commitTransaction("save");
  });

  //update buttons shown on the preview card
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

  //if answertype select box changes
  $(".js-editAnswerType").change(function (e) {
    myDiagram.startTransaction("editAnswerType");
    if (currentNodeData !== null) myDiagram.model.setDataProperty(currentNodeData, "answerType", $(".js-editAnswerType option").filter(":selected").val());
    myDiagram.isModified = true;
    myDiagram.commitTransaction("editAnswerType");
  });

});
