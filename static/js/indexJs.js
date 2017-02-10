$(function(){

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
      myElement.style.display = "block";
      var part = e.subject.part;
      $(".js-editTitleText").text(part.data.name);
      var buttonStr = "";
      $(".js-buttonWrapper").empty();
      for (i = 0; i < part.data.rightArray.length; i++) {
        var currentButtonText = part.data.rightArray[i].name;
        buttonStr += '<button class="btn-large waves-effect waves-white js-buttonEditIcon">' + currentButtonText + '</button>';
      }
      $(".js-buttonWrapper").html(buttonStr);
      var iconText = (part.data.card_icon == null) ? account_circle : part.data.card_icon;
      $("#selectedIcon").text(iconText);
      var placeholderText = (part.data.card_subtext == null) ? "Answer here" : part.data.card_subtext;
      $(".js-editAnswerType").attr("placeholder", placeholderText);
      currentKeyID = part.data.key;
      currentNodeData = myDiagram.model.findNodeDataForKey(currentKeyID);
      //postdata(part.data);
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

    var nodeMenu =  // context menu for each Node
    GO(go.Adornment, "Vertical",
      makeButton("Copy",
      function(e, obj) { e.diagram.commandHandler.copySelection(); }),
      makeButton("Delete",
      function(e, obj) { e.diagram.commandHandler.deleteSelection(); }),
      GO(go.Shape, "LineH", {  strokeWidth: 3,
        height: 1,
        stretch: go.GraphObject.Horizontal
    }),

    makeButton("Add Answer",
    function (e, obj) {
      addPort("right"); })
    );

  var portSize = new go.Size(100, 40);
  var smallsize = new go.Size(10, 10);
  var portMenu =  // context menu for each port
  GO(go.Adornment, "Vertical",
    makeButton("Remove port",
    // in the click event handler, the obj.part is the Adornment;
    // its adornedObject is the port
    function (e, obj) { removePort(obj.part.adornedObject); }),
    makeButton("Change color",
    function (e, obj) { changeColor(obj.part.adornedObject); }),
    makeButton("Remove side ports",
    function (e, obj) { removeAll(obj.part.adornedObject); })
  );

  // the node template
  // includes a panel on each side with an itemArray of panels containing ports
  myDiagram.nodeTemplate =
  GO(go.Node, "Table",
    { locationObjectName: "BODY",
    locationSpot: go.Spot.Center,
    selectionObjectName: "BODY",
    contextMenu: nodeMenu
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
  minSize: new go.Size(56, 56)
  }),
  GO(go.TextBlock,
    { margin: 10,
      textAlign: "center",
      font: "18px  Segoe UI,sans-serif",
      stroke: "white",
      editable: true
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

      cursor: "pointer",
      contextMenu: portMenu
    },
    new go.Binding("portId", "portId"),
    GO(go.Shape, "Circle",
    { stroke: 'red',
    strokeWidth: 1,
    desiredSize: smallsize,
    margin: new go.Margin(1,0) },
    new go.Binding("fill", "portColor"))

  )  // end itemTemplate
  }
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

      cursor: "pointer",
      contextMenu: portMenu },
      new go.Binding("portId", "portId"),
      GO(go.Shape, "Rectangle",
      { stroke: null,
        strokeWidth: 0,
        desiredSize: portSize,
        margin: new go.Margin(1, 0) },
        new go.Binding("fill", "portColor")),
        GO(go.TextBlock,
          { margin: 10,
            textAlign: "center",
            font: "18px  Segoe UI,sans-serif",
            stroke: "white",
            editable: true },

            new go.Binding("text", "name").makeTwoWay())
          )  // end itemTemplate
        }
      )  // end Vertical Panel

    );  // end Node

    myDiagram.toolManager.clickCreatingTool.archetypeNodeData = {
      name: "Question:",
      leftArray: [ {"portColor":"black", "portId":"left0", 'name':'connect'} ],
      rightArray: [ {"portColor":"lightblue", "portId":"right0", 'name':'Next'} ],
      topArray: [],
      bottomArray: [],
    };

    myDiagram.contextMenu =
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
  );
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
          name:'Next'

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


  function removePort(port) {
    myDiagram.startTransaction("removePort");
    var pid = port.portId;
    var arr = port.panel.itemArray;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].portId === pid) {
        myDiagram.model.removeArrayItem(arr, i);
        break;
      }
    }
    myDiagram.commitTransaction("removePort");
  }

  // Remove all ports from the same side of the node as the clicked port.
  function removeAll(port) {
    myDiagram.startTransaction("removePorts");
    var nodedata = port.part.data;
    var side = port._side;  // there are four property names, all ending in "Array"
    myDiagram.model.setDataProperty(nodedata, side + "Array", []);  // an empty Array
    myDiagram.commitTransaction("removePorts");
  }

  // Change the color of the clicked port.
  function changeColor(port) {
    myDiagram.startTransaction("colorPort");
    var data = port.data;
    myDiagram.model.setDataProperty(data, "portColor", 'lightblue');//go.Brush.randomColor());
    myDiagram.commitTransaction("colorPort");
  }

  // Save the model to / load it from JSON text shown on the page itself, not in a database.
  function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
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

  $('.js-editTitleIcon').on('click', function(e){
    $(this).hide();
    $(this).siblings('.js-editTitleText').hide();
    $(this).siblings('.js-editTitleField').show();
    $(this).siblings('.js-editTitleField').prop('readonly', false);
    var titleText = $(this).siblings('.js-editTitleText').html();
    $(this).siblings('.js-editTitleField').val(titleText);
    $(this).siblings('.js-editTitleField').focus();
    editTitleField = true;
  });

  $('.js-editTitleField').focusout(function(e){
    if (editTitleField == true) {
      var editedText = $('.js-editTitleField').val();
      $('.js-editTitleField').val("");
      $(this).hide();
      $(this).siblings('.js-editTitleIcon').show();
      $(this).siblings('.js-editTitleText').show();
      $(this).siblings('.js-editTitleText').html(editedText);
      $(this).closest('.form-group').find('.editable-field').prop('readonly', true);
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

});
