/**
 * Created by wpalin on 1/12/17.
 */

    function init() {
      if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
      var $ = go.GraphObject.make;  // for conciseness in defining templates

      myDiagram =
        $(go.Diagram, "myDiagramDiv",
          {
            allowCopy: false,
            initialContentAlignment: go.Spot.Left,
            layout:
              $(go.LayeredDigraphLayout,
                {
                  setsPortSpots: false,  // Links already know their fromSpot and toSpot
                  columnSpacing: 5,
                  isInitial: false,
                  isOngoing: false
                }),
            validCycle: go.Diagram.CycleNotDirected,
            "undoManager.isEnabled": true
          });

        var inspector = new Inspector('myInspectorDiv', myDiagram,
      {
        // uncomment this line to only inspect the named properties below instead of all properties on each object:
        includesOwnProperties: true,
        properties: {
          "text": {},
          // key would be automatically added for nodes, but we want to declare it read-only also:
          "key": { readOnly: true, show: Inspector.showIfPresent },
          // color would be automatically added for nodes, but we want to declare it a color also:
          "color": { show: Inspector.showIfPresent, type: 'color' },
          "type": {  },
          "KEY_NAME": {  },
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
          "LinkComments": { show: Inspector.showIfLink },
        }
      });
    // alert(myDiagram.)

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

      var graygrad = $(go.Brush, "Linear",
                       { 0: "white", 0.1: "whitesmoke", 0.9: "whitesmoke", 1: "lightgray" });

        var shapey = 'rectangle';
      myDiagram.nodeTemplate =  // the default node template
        $(go.Node, "Spot",
          { selectionAdorned: false, textEditable: true, locationObjectName: "BODY" },
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          // the main body consists of a Rectangle surrounding the text
          $(go.Panel, "Auto",
            { name: "BODY" },
            $(go.Shape, returnshape(),
                // new go.Binding("fill", "color")),
              { fill: graygrad, stroke: "gray", minSize: new go.Size(120, 21) },
              // { fill: graygrad, stroke: "gray", minSize: new go.Size(120, 21) },
              new go.Binding("fill", "isSelected", function(s) { return s ? "dodgerblue" : graygrad; }).ofObject()),

            $(go.TextBlock,
              { stroke: "black",
                  font: "12px sans-serif",
                  editable: returntrue(),
                  margin: new go.Margin(3, 3+11, 3, 3+4),
                  alignment: go.Spot.Left },
              new go.Binding("text", "text").makeTwoWay()

            )

              // new go.Binding("input", "button").makeTwoWay())
          ),
          //   $(go.newBlock,
          //     { stroke: "black", font: "12px sans-serif", editable: true,
          //       margin: new go.Margin(30, 3+11, 3, 3+4), alignment: go.Spot.Left },
          //     new go.Binding("input", "button").makeTwoWay())
          //     // new go.Binding("input", "button").makeTwoWay())
          // ),
          // output port
          $(go.Panel, "Auto",
            { alignment: go.Spot.Right,
                portId: "from",
                fromLinkable: true,
                cursor: "pointer",
                click: addNodeAndLink },

            $(go.Shape, "Circle",
              { width: 22, height: 22, fill: "white", stroke: "dodgerblue", strokeWidth: 3 }),
            $(go.Shape, "PlusLine",
              { width: 11, height: 11, fill: null, stroke: "dodgerblue", strokeWidth: 3 })
          ),
          // input port
          $(go.Panel, "Auto",
            { alignment: go.Spot.Left, portId: "to", toLinkable: true },
            $(go.Shape, "Circle",
              { width: 8, height: 8, fill: "white", stroke: "gray" }),
            $(go.Shape, "Circle",
              { width: 4, height: 4, fill: "dodgerblue", stroke: null })
          )
        );

      myDiagram.nodeTemplate.contextMenu =
        $(go.Adornment, "Vertical",
          $("ContextMenuButton",
            $(go.TextBlock, "Rename"),
            { click: function(e, obj) { e.diagram.commandHandler.editTextBlock(); } },
            new go.Binding("visible", "", function(o) { return o.diagram.commandHandler.canEditTextBlock(); }).ofObject()),
          // add one for Editing...
          $("ContextMenuButton",
            $(go.TextBlock, "DeleteX"),
            { click: function(e, obj) { e.diagram.commandHandler.deleteSelection(); } },
            new go.Binding("visible", "", function(o) { return o.diagram.commandHandler.canDeleteSelection(); }).ofObject()),
          //  And one for testing
          $("ContextMenuButton",
            $(go.TextBlock, "Testing"),
            { click: function(e, obj) { e.diagram.commandHandler.deleteSelection(); } },
            new go.Binding("visible", "", function(o) { return o.diagram.commandHandler.addTopLevelParts(); }).ofObject()),
            $("ContextMenuButton",
            $(go.TextBlock, "NewNode"),

            { click: function(e, obj) {

                var contextmenu = obj.part;
                var x = obj.part.adornedPart;
                var nodedata = contextmenu.data;
                alert(nodedata['key']);
                // alert(x)
                // var data = model.linkDataArray[0];


                } })
        );

      myDiagram.nodeTemplateMap.add("Loading",
        $(go.Node, "Spot",
          { selectionAdorned: false, textEditable: true, locationObjectName: "BODY" },
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          // the main body consists of a Rectangle surrounding the text
          $(go.Panel, "Auto",
            { name: "BODY" },
            $(go.Shape, "Rectangle",
              { fill: graygrad, stroke: "gray", minSize: new go.Size(120, 21) },
              new go.Binding("fill", "isSelected", function(s) {

                  return s ? "dodgerblue" : graygrad; }).ofObject()),
            $(go.TextBlock,
              { stroke: "black", font: "12px sans-serif", editable: true,
                margin: new go.Margin(3, 3+11, 3, 3+4), alignment: go.Spot.Left },
              new go.Binding("text", "text"))
          ),
          // output port
          $(go.Panel, "Auto",
            { alignment: go.Spot.Right, portId: "from", fromLinkable: true, click: addNodeAndLink },
            $(go.Shape, "Square",
              { width: 22, height: 22, fill: "white", stroke: "dodgerblue", strokeWidth: 3 }),
            $(go.Shape, "PlusLine",
              { width: 11, height: 11, fill: null, stroke: "dodgerblue", strokeWidth: 3 })
          )
        ));

      myDiagram.nodeTemplateMap.add("End",
        $(go.Node, "Spot",
          { selectionAdorned: false, textEditable: true, locationObjectName: "BODY" },
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          // the main body consists of a Rectangle surrounding the text
          $(go.Panel, "Auto",
            { name: "BODY" },
            $(go.Shape, "Rectangle",
              { fill: graygrad, stroke: "gray", minSize: new go.Size(120, 21) },
              new go.Binding("fill", "isSelected", function(s) { return s ? "dodgerblue" : graygrad; }).ofObject()),
            $(go.TextBlock,
              { stroke: "black", font: "12px sans-serif", editable: true,
                margin: new go.Margin(3, 3 + 11, 3, 3 + 4), alignment: go.Spot.Left },
              new go.Binding("text", "text"))
          ),
          // input port
          $(go.Panel, "Auto",
            { alignment: go.Spot.Left, portId: "to", toLinkable: true },
            $(go.Shape, "Circle",
              { width: 8, height: 8, fill: "white", stroke: "gray" }),
            $(go.Shape, "Circle",
              { width: 4, height: 4, fill: "dodgerblue", stroke: null })
          )
        ));


      // dropping a node on this special node will cause the selection to be deleted;
      // linking or relinking to this special node will cause the link to be deleted
      myDiagram.nodeTemplateMap.add("Recycle",
        $(go.Node, "Auto",
          { portId: "to", toLinkable: true, deletable: false,
            layerName: "Background", locationSpot: go.Spot.Center },
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          { dragComputation: function(node, pt, gridpt) { return pt; } },
          { mouseDrop: function(e, obj) { myDiagram.commandHandler.deleteSelection(); } },
          $(go.Shape,
            { fill: "lightgray", stroke: "gray" }),
          $(go.TextBlock, "Drop Here\nTo Delete",
            { margin: 5, textAlign: "center" })
        ));

      // this is a click event handler that adds a node and a link to the diagram,
      // connecting with the node on which the click occurred
      function addNodeAndLink(e, obj) {
        // alert(obj)
        var fromNode = obj.part;
        var diagram = fromNode.diagram;
        diagram.startTransaction("Add State");
        // get the node data for which the user clicked the button
        var fromData = fromNode.data;
        // create a new "State" data object, positioned off to the right of the fromNode
        var p = fromNode.location.copy();
        p.x += diagram.toolManager.draggingTool.gridSnapCellSize.width;
        var toData = {
          text: "new",
          loc: go.Point.stringify(p)
        };
        // add the new node data to the model
        var model = diagram.model;
        model.addNodeData(toData);
        // create a link data from the old node data to the new node data
        var linkdata = {
          from: model.getKeyForNodeData(fromData),
          to: model.getKeyForNodeData(toData)
        };
        // and add the link data to the model
        model.addLinkData(linkdata);
        // select the new Node
        var newnode = diagram.findNodeForData(toData);
        diagram.select(newnode);
        // snap the new node to a valid location
        newnode.location = diagram.toolManager.draggingTool.computeMove(newnode, p);
        // then account for any overlap
        shiftNodesToEmptySpaces();
        diagram.commitTransaction("Add State");
      }

      // Highlight ports when they are targets for linking or relinking.
      var OldTarget = null;  // remember the last highlit port
      function highlight(port) {
        if (OldTarget !== port) {
          lowlight();  // remove highlight from any old port
          OldTarget = port;
          port.scale = 1.3;  // highlight by enlarging
        }
      }
      function lowlight() {  // remove any highlight
        if (OldTarget) {
          OldTarget.scale = 1.0;
          OldTarget = null;

        }
      }

      function returntrue(){
          // alert(nod)
          alert('hiy');
          return true;
      }
      function returnshape() {
          return "rectangle";
      }
      // Connecting a link with the Recycle node removes the link
      myDiagram.addDiagramListener("LinkDrawn", function(e) {
        var link = e.subject;
        if (link.toNode.category === "Recycle") myDiagram.remove(link);
        lowlight();
      });
      myDiagram.addDiagramListener("LinkRelinked", function(e) {
        var link = e.subject;
        if (link.toNode.category === "Recycle") myDiagram.remove(link);
        lowlight();
      });

      myDiagram.linkTemplate =
        $(go.Link,
          { selectionAdorned: false, fromPortId: "from", toPortId: "to", relinkableTo: true },
          $(go.Shape,
            { stroke: "gray", strokeWidth: 2 },
            { mouseEnter: function(e, obj) { obj.strokeWidth = 5; obj.stroke = "dodgerblue"; },
              mouseLeave: function(e, obj) { obj.strokeWidth = 2; obj.stroke = "gray"; }
             })
        );

      function commonLinkingToolInit(tool) {
        // the temporary link drawn during a link drawing operation (LinkingTool) is thick and blue
        tool.temporaryLink =
            $(go.Link, { layerName: "Tool" },
              $(go.Shape, { stroke: "dodgerblue", strokeWidth: 5 }));

        // change the standard proposed ports feedback from blue rectangles to transparent circles
        tool.temporaryFromPort.figure = "Circle";
        tool.temporaryFromPort.stroke = null;
        tool.temporaryFromPort.strokeWidth = 0;
        tool.temporaryToPort.figure = "Circle";
        tool.temporaryToPort.stroke = null;
        tool.temporaryToPort.strokeWidth = 0;


        // provide customized visual feedback as ports are targeted or not
        tool.portTargeted = function(realnode, realport, tempnode, tempport, toend) {
          if (realport === null) {  // no valid port nearby
            lowlight();
          } else if (toend) {
            highlight(realport);

          } else if (realnode) {


          }

        };
      }

      var ltool = myDiagram.toolManager.linkingTool;
      commonLinkingToolInit(ltool);
      // do not allow links to be drawn starting at the "to" port
      ltool.direction = go.LinkingTool.ForwardsOnly;

      var rtool = myDiagram.toolManager.relinkingTool;
      commonLinkingToolInit(rtool);
      // change the standard relink handle to be a shape that takes the shape of the link
      rtool.toHandleArchetype =
        $(go.Shape,
          { isPanelMain: true, fill: null, stroke: "dodgerblue", strokeWidth: 5 });

      // use a special DraggingTool to cause the dragging of a Link to start relinking it
      myDiagram.toolManager.draggingTool = new DragLinkingTool();

      // detect when dropped onto an occupied cell
      myDiagram.addDiagramListener("SelectionMoved", shiftNodesToEmptySpaces);

      // myDiagram.add


      function shiftNodesToEmptySpaces() {
        myDiagram.selection.each(function(node) {
          if (!(node instanceof go.Node)) return;
          // look for Parts overlapping the node
          while (true) {


            var exist = myDiagram.findObjectsIn(node.actualBounds,
                                                // only consider Parts
                                                function(obj) { return obj.part; },
                                                // ignore Links and the dropped node itself
                                                function(part) { return part instanceof go.Node && part !== node; },
                                                // check for any overlap, not complete containment
                                                true).first();


            if (exist === null) break;
            // try shifting down beyond the existing node to see if there's empty space
            node.position = new go.Point(node.actualBounds.x, exist.actualBounds.bottom+10);

          }
        });
      }

      // prevent nodes from being dragged to the left of where the layout placed them
      myDiagram.addDiagramListener("LayoutCompleted", function(e) {
        myDiagram.nodes.each(function(node) {
          if (node.category === "Recycle") {
              alert('hi');
              return;
          }
            // node.Shape, 'Circle',
          node.minLocation = new go.Point(node.location.x, -Infinity);
        });
      });

      load();  // load initial diagram from the mySavedModel textarea
      layout();
    }

    function save() {

      document.getElementById("mySavedModel").value = myDiagram.model.toJson();
      myDiagram.isModified = false;
    }

    function load() {
      myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    }

    function layout() {

      myDiagram.layoutDiagram(true);
        // var x = myDiagram
        myDiagram.selection.each(function(node) {
        });
    }


    // Define a custom tool that changes a drag operation on a Link to a relinking operation,
    // but that operates like a normal DraggingTool otherwise.
    function DragLinkingTool() {
      go.DraggingTool.call(this);
      this.isGridSnapEnabled = true;
      this.isGridSnapRealtime = false;
      this.gridSnapCellSize = new go.Size(182, 1);
      this.gridSnapOrigin = new go.Point(5.5, 0);
    }
    go.Diagram.inherit(DragLinkingTool, go.DraggingTool);

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






  // function init() {
  //   if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
  //   var $ = go.GraphObject.make;  // for conciseness in defining templates
  //
  //   myDiagram =
  //     $(go.Diagram, "myDiagramDiv",  // create a Diagram for the DIV HTML element
  //       {
  //       //   "animationManager.isEnabled":false,
  //       //   // position the graph in the middle of the diagram
  //       //   // initialContentAlignment: go.Spot.Center,
  //       //   // // allow double-click in background to create a new node
  //       //   // "clickCreatingTool.archetypeNodeData": { text: "Node", color: "white" },
  //       //   // // allow Ctrl-G to call groupSelection()
  //       //   // "commandHandler.archetypeGroupData": { text: "Group", isGroup: true, color: "blue" },
  //       //   // // enable undo & redo
  //       //   // "undoManager.isEnabled": true
  //       });
  //
  //   // These nodes have text surrounded by a rounded rectangle
  //   // whose fill color is bound to the node data.
  //   // The user can drag a node by dragging its TextBlock label.
  //   // Dragging from the Shape will start drawing a new link.
  //   myDiagram.nodeTemplate =
  //     $(go.Node, "Auto",
  //       { locationSpot: go.Spot.Center },
  //       new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
  //       $(go.Shape, "Rectangle",
  //         {
  //           stroke: null, strokeWidth: 0,
  //           fill: "white", // the default fill, if there is no data-binding
  //           portId: "", cursor: "pointer",  // the Shape is the port, not the whole Node
  //           // allow all kinds of links from and to this port
  //           fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
  //           toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
  //         },
  //         new go.Binding("fill", "color")),
  //       $(go.TextBlock,
  //         {
  //           font: "bold 18px sans-serif",
  //           stroke: '#111',
  //           margin: 8,  // make some extra space for the shape around the text
  //           isMultiline: false,  // don't allow newlines in text
  //           editable: true  // allow in-place editing by user
  //         },
  //         new go.Binding("text", "text").makeTwoWay())
  //     );
  //
  //   // The link shape and arrowhead have their stroke brush data bound to the "color" property
  //   // myDiagram.linkTemplate =
  //   //   $(go.Link,
  //   //     { toShortLength: 3, relinkableFrom: true, relinkableTo: true },  // allow the user to relink existing links
  //   //     $(go.Shape,
  //   //       { strokeWidth: 2 },
  //   //       new go.Binding("stroke", "color")),
  //   //     $(go.Shape,
  //   //       { toArrow: "Standard", stroke: null },
  //   //       new go.Binding("fill", "color"))
  //   //   );
  //
  //   // Groups consist of a title in the color given by the group node data
  //   // above a translucent gray rectangle surrounding the member parts
  //   // myDiagram.groupTemplate =
  //   //   $(go.Group, "Vertical",
  //   //     { selectionObjectName: "PANEL",  // selection handle goes around shape, not label
  //   //       ungroupable: true },  // enable Ctrl-Shift-G to ungroup a selected Group
  //   //     $(go.TextBlock,
  //   //       {
  //   //         font: "bold 19px sans-serif",
  //   //         isMultiline: false,  // don't allow newlines in text
  //   //         editable: true  // allow in-place editing by user
  //   //       },
  //   //       new go.Binding("text", "text").makeTwoWay(),
  //   //       new go.Binding("stroke", "color")),
  //   //     $(go.Panel, "Auto",
  //   //       { name: "PANEL" },
  //   //       $(go.Shape, "Rectangle",  // the rectangular shape around the members
  //   //         { fill: "rgba(128,128,128,0.2)", stroke: "gray", strokeWidth: 3 }),
  //   //       $(go.Placeholder, { padding: 10 })  // represents where the members are
  //   //     )
  //   //   );
  //
  //   // Create the Diagram's Model:
    // var nodeDataArray = [
    //   { key: 1, text: "Alpha", color: "#B2DFDB" },
    //   { key: 2, text: "Beta", color:  "#B2B2DB" },
    //   { key: 3, text: "Gamma", color: "#1DE9B6", group: 5 },
    //   { key: 4, text: "Delta", color: "#00BFA5", group: 5 },
    //   { key: 5, text: "Epsilon", color: "#00BFA5", isGroup: true }
    // ];
    // var linkDataArray = [
    //   { from: 1, to: 2, color: "#5E35B1" },
    //   { from: 2, to: 2, color: "#5E35B1"},
    //   { from: 3, to: 4, color: "#6200EA" },
    //   { from: 3, to: 1, color: "#6200EA" }
    // ];
    // myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  //
  //   // some shared model data
  //   // myDiagram.model.modelData = { "test": true, "hello": "world" };
  //   //
  //   // // select a Node, so that the first Inspector shows something
  //   // myDiagram.select(myDiagram.nodes.first());
  //
  //
  //   // properties declare which properties to show and how.
  //   // By default, all properties on the model data objects are shown unless the inspector option "includesOwnProperties" is set to false.
  //
  //   // Show the primary selection's data, or blanks if no Part is selected:
  //   var inspector = new Inspector('myInspectorDiv', myDiagram,
  //     {
  //       // uncomment this line to only inspect the named properties below instead of all properties on each object:
  //       // includesOwnProperties: false,
  //       properties: {
  //         "text": {},
  //         // key would be automatically added for nodes, but we want to declare it read-only also:
  //         "key": { readOnly: true, show: Inspector.showIfPresent },
  //         // color would be automatically added for nodes, but we want to declare it a color also:
  //         "color": { show: Inspector.showIfPresent, type: 'color' },
  //         // Comments and LinkComments are not in any node or link data (yet), so we add them here:
  //         "Comments": { show: Inspector.showIfNode  },
  //         "flag": { show: Inspector.showIfNode, type: 'boolean', defaultValue: true  },
  //         "LinkComments": { show: Inspector.showIfLink },
  //       }
  //     });
  //
  //   // Always show the first Node:
  //   // var inspector2 = new Inspector('myInspectorDiv2', myDiagram,
  //   //   {
  //   //     // by default the inspector works on the Diagram selection
  //   //     // this lets us inspect our own object using Inspector.inspectObject(object)
  //   //     inspectSelection: false,
  //   //     properties: {
  //   //       "text": { },
  //   //       // This property we want to declare as a color, to show a color-picker:
  //   //       "color": { type: 'color' },
  //   //       // key would be automatically added for node data, but we want to declare it read-only also:
  //   //       "key": { readOnly: true, show: Inspector.showIfPresent }
  //   //     }
  //   //   });
  //   // // If not inspecting a selection, you can programatically decide what to inspect (a Part, or a JavaScript object)
  //   // inspector2.inspectObject(myDiagram.nodes.first().data);
  //
  //   // Always show the model.modelData:
  //   var inspector3 = new Inspector('myInspectorDiv3', myDiagram,
  //     {
  //       inspectSelection: false
  //     });
  //   inspector3.inspectObject(myDiagram.model.modelData);
  // }


 myDiagram.toolManager.clickCreatingTool.archetypeNodeData = {
      name: "Question:",
      leftArray: [ {"portColor":"black", "portId":"left0", 'name':'connect'} ],
      rightArray: [ {"portColor":"lightblue", "portId":"right0", 'name':'Next'} ],
      topArray: [],
      bottomArray: []
    };
