$(function(){

  var GO = go.GraphObject.make;  //for conciseness in defining node templates

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
          alert('hi');
          return;
        }
        node.minLocation = new go.Point(node.location.x, -Infinity);
      });
    });

    var inspector = new Inspector('myInspectorDiv', myDiagram, {
      // uncomment this line to only inspect the named properties below instead of all properties on each object:
      includesOwnProperties: true,
      properties: {
        "name": {},
        "first_button":{},
        // key would be automatically added for nodes, but we want to declare it read-only also:
        "key": { readOnly: true, show: Inspector.showIfPresent },
        // color would be automatically added for nodes, but we want to declare it a color also:
        "color": { show: Inspector.showIfPresent, type: 'color' },
        "type": {  },
        "KEY_NAME": {  },
        "group": {  },
        "LOGIC": {  },
        "VALIDATION": {  },
        "Action": {  },
        "ICON_ATTRIBUTE": {  },
        "card_auto_populate": {  },
        "card_text": {  },
        "card_subtext": {  },
        "card_id": {  },
        "card_pattern": {  },
        "card_type": {  },
        "card_buttons": {  },
        "card_class": {  },
        "card_icon": {  },
        "card_helptext": {  },
        "goto_key": {  },
        "SubText": {  },
        "newproprties": {  },
        // Comments and LinkComments are not in any node or link data (yet), so we add them here:
        "Comments": { show: Inspector.showIfNode  },
        "flag": { show: Inspector.showIfNode, type: 'boolean', defaultValue: true  },
        "LinkComments": { show: Inspector.showIfLink }
      }
    });

    myDiagram.addDiagramListener('ObjectSingleClicked', function(e) {
      var myElement = document.querySelector("#preview");
      myElement.style.backgroundColor = "#f6f6f6";
      myElement.style.display = "";
      var part = e.subject.part;
      document.getElementsByClassName("card-title center-align")[0].textContent=part.data.name;
      document.getElementsByClassName('btn-large waves-effect waves-white')[0].textContent = part.data.rightArray[0].name;
      document.getElementsByClassName('material-icons prefix')[0].textContent = part.data.card_icon;
      document.getElementById('STUDENT_NAME').setAttribute("placeholder", part.data.card_subtext);

      var ifyy = part.data.card_icon;
      var ifxy = part.data.card_subtext;
      if (ifxy == null) {
        document.getElementById('card_subtext').textContent = "Obligatory text"
      }
      if (ifyy == null) {
        document.getElementsByClassName('material-icons prefix')[0].textContent = "face"
      }

      var xyz = part.data.rightArray;
      postdata(part.data);
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
  
});
