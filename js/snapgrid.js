﻿/**
 * snapgrid
 * https://github.com/bretttolbert/snapgrid
 */
 //snapgrid global variables
var canvas; //html5 canvas element
var ctx; //canvas drawing context
var CELL_SIZE = 16; //size of each grid cell
var mouseX, mouseY; //coordinate of most recent mouse position
var snapX, snapY; //coordinate of grid vertex which is closest to cursor position
var snapType; //string describing what we have snapped to. Possible values: 'none', 'grid', 'vertex', 'edge' 
var lineSegments = []; //the list of all existing line segments (point pairs)
var currentTool = 'draw-line';
var isGridVisible = true;
var drawVertexDots = false; //draw dots on every vertex
var snapToGrid = true;
var snapToVertices = true;
var snapToEdges = true;
var debugEnabled = true;
var selectedVertex = null; //used by move-vertex tool
var history = []; //used for Undo/Redo (Ctrl-Z/Ctrl-Y)
var ctrlDown = false;

function debug(str) {
    if (debugEnabled) {
        console.log(str);
    }
}

//draw-line variables
var pendingLineStartPoint = null; //used by the draw-line

/**
 * All tools are required to call this function before modifying the contents of the grid
 * (e.g. before adding a new line segment or before moving a vertex)
 * Saves the state of the grid into history for retrieval via Undo button or Ctrl-Z
 */
function saveGrid() {
    var snapshot = [];
    for (var i=0; i<lineSegments.length; ++i) {
        snapshot.push(lineSegments[i].clone());
    }
    history.push({'lineSegments':snapshot});
}

/** 
 * Responsible for drawing the grid and all existing line segments
 */
function drawGrid() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (isGridVisible) {
        ctx.strokeStyle = '#ddd';
        for (var x=CELL_SIZE; x<canvas.width; x+=CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x,0);
            ctx.lineTo(x,canvas.height);
            ctx.stroke();
        }
        for (var y=CELL_SIZE; y<canvas.width; y+=CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0,y);
            ctx.lineTo(canvas.width,y);
            ctx.stroke();
        }
    }
    var src = '{lineSegments:[\n';
    for (var i=0; i<lineSegments.length; ++i) {
        var ls = lineSegments[i];
        //temporarily apply vertex translations for vertex move preview
        if (currentTool == 'move-vertex' && selectedVertex != null) {
            if (ls.p1.x == selectedVertex.x && ls.p1.y == selectedVertex.y) {
                ls.p1.x = snapX;
                ls.p1.y = snapY;
            } else if (ls.p2.x == selectedVertex.x && ls.p2.y == selectedVertex.y) {
                ls.p2.x = snapX;
                ls.p2.y = snapY;
            }
        }
        src += ls.repr();
        if (i != lineSegments.length-1) {
            src += ',';
        }
        src += '\n';
        
        if (drawVertexDots) {
            //draw dot for p1
            ctx.beginPath();
            ctx.arc(ls.p1.x, ls.p1.y, 2, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fill();
            
            //draw dot for p2
            ctx.beginPath();
            ctx.arc(ls.p2.x, ls.p2.y, 2, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fill();
        }
        
        //draw line
        ctx.beginPath();
        ctx.moveTo(ls.p1.x, ls.p1.y)
        ctx.lineTo(ls.p2.x, ls.p2.y);
        if (lineSegments[i].hover && (currentTool == 'delete-line' || currentTool == 'select-line')) {
            ctx.strokeStyle = 'teal';
        } else if (lineSegments[i].selected) {
            ctx.strokeStyle = 'blue';
        } else {
            ctx.strokeStyle = 'black';
        }
        ctx.stroke();
    }
    src += ']}';
    $('#srcTxt').val(src);
}

/**
 * Detects mouse hover over any existing line segment
 */
function updateMouseHoverLine() {
    for (var i=0; i<lineSegments.length; ++i) {
        ls = lineSegments[i];
        //determine if cursor position is on or very near a line
        var TOLERANCE = CELL_SIZE/2;
        var mousePos = {x:mouseX,y:mouseY};
        var closestPoint = Geometry.getClosestPointOnLineSegment(ls.p1, ls.p2, mousePos, TOLERANCE)
        if (closestPoint != false) {
            ls.hover = true;
            if (debug && currentTool == "select-line" || currentTool == "delete-line") {
                //draw dot for p2
                ctx.beginPath();
                ctx.arc(closestPoint.x, closestPoint.y, 2, 0, Math.PI*2, true); 
                ctx.closePath();
                ctx.fillStyle = "purple";
                ctx.fill();
            }
        } else {
            ls.hover = false;
        }
    }
}

/**
 * Determines grid vertex closest to mouse position
 */
function updateSnapPos() {
    snapX = mouseX;
    snapY = mouseY;
    snapType = 'none';
    if (snapToGrid) {
        snapType = 'grid';
        //determine first vertical gridline with x greater than mouseX
        for (snapX=CELL_SIZE; snapX<=canvas.width && snapX<mouseX; snapX+=CELL_SIZE) { }
        //snap to previous vertical gridline if mouseX is less than half way there
        if ((snapX - mouseX) > CELL_SIZE / 2) {
            snapX -= CELL_SIZE;
        }

        //determine first horizontal gridline with y greater than mouseY
        for (snapY=CELL_SIZE; snapY<=canvas.height && snapY<mouseY; snapY+=CELL_SIZE) { }
        //snap to previous horizontal gridline if mouseY is less than half way there
        if ((snapY - mouseY) > CELL_SIZE / 2) {
            snapY -= CELL_SIZE;
        }
    }
    var TOLERANCE = CELL_SIZE / 2;
    var mousePos = {x:mouseX,y:mouseY};
    if (snapToVertices) {
        for (var i=0; i<lineSegments.length; ++i) {
            //if mouse position is within TOLERANCE distance of one vertex of a line exactly
            if (Geometry.distance(mousePos, lineSegments[i].p1) < TOLERANCE) {
                snapX = lineSegments[i].p1.x;
                snapY = lineSegments[i].p1.y;
                snapType = 'vertex';
                return;
            } else if (Geometry.distance(mousePos, lineSegments[i].p2) < TOLERANCE) {
                snapX = lineSegments[i].p2.x;
                snapY = lineSegments[i].p2.y;
                snapType = 'vertex';
                return;
            }
        }
    }
    //ToDo: implement snap to implicit vertices created by intersecting line segments
    if (snapToEdges) {
        for (var i=0; i<lineSegments.length; ++i) {
            var closestPoint = Geometry.getClosestPointOnLineSegment(lineSegments[i].p1, lineSegments[i].p2, mousePos, TOLERANCE)
            if (closestPoint != false) {
                snapX = closestPoint.x;
                snapY = closestPoint.y;
                snapType = 'edge';
                return;
            }
        }
    }
}

function mouseMove(e) {
    if(e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
    else if(e.layerX) {
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
    drawGrid();
    updateSnapPos();
    updateMouseHoverLine();
    
    if (currentTool == 'draw-line') {    
        //draw dot at snap position
        ctx.beginPath();
        ctx.arc(snapX, snapY, 2, 0, Math.PI*2, true); 
        ctx.closePath();
        ctx.fillStyle = 'teal';
        ctx.fill();
        
        //if there is a pending line
        if (pendingLineStartPoint != null) {
            //draw temporary line from pendingLineStartPoint to snap position
            ctx.beginPath();
            ctx.moveTo(pendingLineStartPoint.x, pendingLineStartPoint.y);
            ctx.lineTo(snapX, snapY);
            ctx.closePath();
            ctx.strokeStyle = 'teal';
            ctx.stroke();
        }
    } else if (currentTool == 'delete-line') {
        
    } else if (currentTool == 'select-line') {
        
    } else if (currentTool == 'move-vertex') {
        if (selectedVertex == null && snapType == 'vertex') {
            //draw dot at snap position (potentially selectable vertex)
            ctx.beginPath();
            ctx.arc(snapX, snapY, 2, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fillStyle = 'teal';
            ctx.fill();
        }
        if (selectedVertex != null) {
            //draw dot at snap position (potential new vertex position)
            ctx.beginPath();
            ctx.arc(snapX, snapY, 2, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fillStyle = 'teal';
            ctx.fill();
        }
    }
}

function mouseClick(e) {
    if (currentTool == 'draw-line') {
        if (pendingLineStartPoint != null) {
            //complete pending line
            saveGrid(); //save the grid first
            lineSegments.push(
                new LineSegment(pendingLineStartPoint.x, pendingLineStartPoint.y, snapX, snapY));
        }
        //start pending line
        pendingLineStartPoint = {x:snapX,y:snapY};
    } else if (currentTool == 'delete-line') {
        //delete mouse hover line
        saveGrid(); //save the grid first
        var mouseHoverLine = -1;
        for (var i=0; i<lineSegments.length; ++i) {
            if (lineSegments[i].hover) {
                mouseHoverLine = i;
                break;
            }
        }
        if (mouseHoverLine != -1) {
            lineSegments.splice(mouseHoverLine,1);     
        }
    } else if (currentTool == 'select-line') {
        for (var i=0; i<lineSegments.length; ++i) {
            if (lineSegments[i].hover) {
                lineSegments[i].selected = !lineSegments[i].selected;
                lineSegments[i].hover = false;
            }
        }
    }
    drawGrid();
}

function rightClick() {
    if (currentTool == 'draw-line') {
        //clear pending line
        pendingLineStartPoint = null;
    }
}

function mouseDown() {
    if (currentTool == 'move-vertex') {
        if (snapType == 'vertex') {
            selectedVertex = {x:snapX,y:snapY};
            debug('mousedown - vertex selected for move');
        }
    }
}

function mouseUp() {
    if (currentTool == 'move-vertex') {
        if (selectedVertex != null) {
            //permanently apply vertex move
            saveGrid(); //save the grid first
            for (var i=0; i<lineSegments.length; ++i) {
                var p1 = lineSegments[i].p1;
                var p2 = lineSegments[i].p2;
                if (p1.x == selectedVertex.x && p1.y == selectedVertex.y) {
                    p1.x = snapX;
                    p1.y = snapY;
                } else if (p2.x == selectedVertex.x && p2.y == selectedVertex.y) {
                    p2.x = snapX;
                    p2.y = snapY;
                }
            }
            selectedVertex = null;
            debug('mouseup - vertex move complete');
        }
    }
}

function clickIE() {
    if (document.all) {
        return false;
    }
} 
function clickNS(e) {
    if (document.layers || (document.getElementById && !document.all)) 
    { 
        if (e.which==2 || e.which==3) {
            rightClick();
            return false;
        }
    }
}
if (document.layers) {
    document.captureEvents(Event.MOUSEDOWN);
    document.onmousedown = clickNS;
} else {
    document.onmouseup = clickNS;
    document.oncontextmenu = clickIE;
}
document.oncontextmenu = function() {return false;};

function showHideGrid() {
    if ($(this).val() == "Hide Grid") {
        isGridVisible = false;
        $(this).val("Show Grid");
    } else {
        isGridVisible = true;
        $(this).val("Hide Grid");
    }
    drawGrid();
}

function selectAll() {
    for (var i=0; i<lineSegments.length; ++i) {
        lineSegments[i].selected = true;
    }
    drawGrid();
}

function selectNone() {
    clearSelectedLines();
    drawGrid();
}

/**
 * This will join the selected line segments if all selected line segments
 * are on the same line. The segments do not have to be contiguous. For example,
 * if the following two line segments were selected: 
 * [{p1:{x:0,y:0},p2:{x:10,y:0}},{p1:{x:20,y:0},p2:{x:30,y:0}}]
 * join would replace the selected line segments with [{p1:{x:0,y:0},p2:{x:30,y:0}}]
 */
function joinSelected() {
    var selected = [];
    var notSelected = [];
    for (var i=0; i<lineSegments.length; ++i) {
        if (lineSegments[i].selected == true) {
            selected.push(lineSegments[i]);
        } else {
            notSelected.push(lineSegments[i]);
        }
    }
    if (selected.length >= 2) {
        var selectedPoints = [];
        for (var i=0; i<selected.length; ++i) {
            if (selectedPoints.indexOf(selected[i].p1) == -1) {
                selectedPoints.push(selected[i].p1);
            }
            if (selectedPoints.indexOf(selected[i].p2) == -1) {
                selectedPoints.push(selected[i].p2);
            }
        }
        //special case: two line segments had a vertex in common
        if (selectedPoints.length >= 3) {
            if (Geometry.onSameLine(selectedPoints)) {
                debug('selectedPoints.length='+selectedPoints.length);
                var ls = new LineSegment();
                ls.p1 = Geometry.extrema(selectedPoints, 'left');
                ls.p2 = Geometry.extrema(selectedPoints, 'right');
                var isVertical = (selectedPoints[0].x == selectedPoints[1].x) && (selectedPoints[0].x == selectedPoints[2].x);
                if (isVertical) {
                    ls.p1 = Geometry.extrema(selectedPoints, 'top');
                    ls.p2 = Geometry.extrema(selectedPoints, 'bottom');
                    debug('isVertical=true');
                }
                debug('ls='+ls.repr());
                lineSegments = [];
                for (var i=0; i<notSelected.length; ++i) {
                    lineSegments.push(notSelected[i]);
                }
                lineSegments.push(ls);
                drawGrid();
            } else {
                alert('Cannot join because line segments are not on the same line.');
            }
        } else {
            debug('selectedPoints.length < 3');
        }
    } else {
        alert('No line segments selected for join.');
    }
}

function deleteSelected() {
    var survivingLines = [];
    for (var i=0; i<lineSegments.length; ++i) {
        if (!lineSegments[i].selected) {
            survivingLines.push(lineSegments[i]);
        }
    }
    lineSegments = survivingLines;
    drawGrid();
}

function clearSelectedLines() {
    for (var i=0; i<lineSegments.length; ++i) {
        lineSegments[i].selected = false;
    }    
}

function toolChanged() {
    var id = this.id;
    currentTool = id;
    pendingLineStartPoint = null;
    if (id == 'delete-line' || id == 'draw-line') {
        //clearSelectedLines(); //not sure if this is desirable
    }
    drawGrid();
}

function initSnapOptionsUI() {
    //$("#snapOptions").buttonset();
    $("#snapToGrid").prop('checked',snapToGrid);
    $("#snapToVertices").prop('checked',snapToVertices);
    $("#snapToEdges").prop('checked',snapToEdges);
    $("#snapToGrid").change(function() {
        snapToGrid = $(this).prop('checked');
    });
    $("#snapToVertices").change(function() {
        snapToVertices = $(this).prop('checked');
    });
    $("#snapToEdges").change(function() {
        snapToEdges = $(this).prop('checked');
    });
}

function srcTxtKeyPress(e) {
    if (e.keyCode == 13) {
        var data;
        try {
            data = eval('('+$(this).val()+')');
        } catch (err) {
            alert(err.message);
            return;
        }
        lineSegments = [];
        srcLineSegments = data['lineSegments'];
        for (var i in srcLineSegments) {
            var ls = srcLineSegments[i];
            lineSegments.push(new LineSegment(ls.p1.x, ls.p1.y, ls.p2.x, ls.p2.y));
        }
        drawGrid();
    }
};

function undo() {
    //cannot undo if history is empty
    if (history.length > 0) {
        lineSegments = history.pop()['lineSegments'];
    } else {
        lineSegments = [];
    }
    drawGrid();
}

function redo() {
    debug('not implemented');
}

$(function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    drawGrid();
    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('click', mouseClick, false);
    //$('input.Btn').button();
    $('#showHideGridBtn').click(showHideGrid);
    $('#selectAllBtn').click(selectAll);
    $('#selectNoneBtn').click(selectNone);
    $('#joinSelectedBtn').click(joinSelected);
    $('#deleteSelectedBtn').click(deleteSelected);
    $('#undoBtn').click(undo);
    //$("#radio").buttonset();
    $("input.ToolRadio").change(toolChanged);
    initSnapOptionsUI();
    $('#canvas').mousedown(mouseDown);
    $('#canvas').mouseup(mouseUp);
    $('#srcTxt').keypress(srcTxtKeyPress);
    $(document).keydown(function(e)
    {
        if (e.keyCode == Keys.Ctrl) {
            ctrlDown = true;
        } else if (ctrlDown && e.keyCode == Keys.Z) {
            undo();
        } else if (ctrlDown && e.keyCode == Keys.Y) {
            redo();
        } else if (e.keyCode == Keys.Delete) {
            deleteSelected();
        }
    }).keyup(function(e)
    {
        if (e.keyCode == Keys.Ctrl) ctrlDown = false;
    });
});