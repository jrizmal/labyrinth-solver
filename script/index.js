var Seminarska = /** @class */ (function () {
    function Seminarska(algo, astarMode) {
        var _this = this;
        this.endNodes = [];
        this.endNodesAStar = [];
        this.visitedArray = [];
        this.pathArray = [];
        this.astarSearchAll = false;
        this.clearLog();
        // nastavi cancas, context...
        this.startTime = new Date().getTime();
        this.writeLog("Začetek");
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.context = this.canvas.getContext("2d");
        this.container = document.getElementById("canvas-container");
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");
        this.astarSearchAll = false;
        // TODO: Vzem algoritm iz radio buttona
        this.algorithm = algo;
        // dobi file - pretvori v string in parsaj
        this.fileInput = document.getElementById("file-input");
        if (this.fileInput.files.length) {
            var file = this.fileInput.files[0];
            this.writeLog("Datoteka: " + file.name);
            var reader_1 = new FileReader();
            var text_1;
            var ctx_1 = this;
            reader_1.onload = function (e) {
                text_1 = reader_1.result;
                var lines = text_1.split("\n");
                var array2D = [];
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] != "") {
                        var nums = lines[i].split(",");
                        for (var j = 0; j < nums.length; j++) {
                            nums[j] = parseInt(nums[j]);
                        }
                        array2D.push(nums);
                    }
                }
                _this.labArray = array2D;
                ctx_1.writeLog("Labirint prebran. Dimenzije " + array2D[0].length + "x" + array2D.length);
                _this.buildGraph();
            };
            reader_1.readAsText(file);
        }
        else {
            this.writeLog("Ni datoteke");
        }
    }
    Seminarska.prototype.writeLog = function (msg) {
        var seconds = new Date().getTime() - this.startTime;
        var logSpan = document.getElementById("log-span");
        var item = document.createElement("li");
        item.innerHTML = seconds + "ms: " + msg;
        logSpan.appendChild(item);
    };
    Seminarska.prototype.clearLog = function () {
        var logSpan = document.getElementById("log-span");
        logSpan.innerHTML = "";
    };
    Seminarska.prototype.destroy = function () {
        this.container.innerHTML = "";
    };
    Seminarska.prototype.buildGraph = function () {
        this.writeLog("Začetek gradnje grafa");
        // TODO: grajenje grafa
        this.initNodeArray();
        var nodeCount = 0;
        for (var y = 0; y < this.labArray.length; y++) {
            for (var x = 0; x < this.labArray[0].length; x++) {
                var element = this.labArray[y][x];
                if (element == -1) {
                    continue;
                }
                var node = new Vozlisce(element, x, y);
                var levi = this.nodeArray[y][x - 1];
                var zgornji = this.nodeArray[y - 1][x];
                if (levi) {
                    levi.east = node;
                    node.west = levi;
                }
                if (zgornji) {
                    zgornji.south = node;
                    node.north = zgornji;
                }
                if (node.value == -2) {
                    this.firstNode = node;
                }
                if (node.value == -3) {
                    this.endNodes.push(node);
                }
                this.nodeArray[y][x] = node;
                nodeCount++;
            }
        }
        this.writeLog("Graf zgrajen. Število vozlišč: " + nodeCount);
        this.drawLab();
        switch (this.algorithm) {
            case 0:
                this.algoDFS(this.firstNode);
                break;
            case 1:
                this.algoBFS(this.firstNode);
                break;
            case 2:
                this.algoAStar(this.firstNode);
                break;
            default:
                break;
        }
        // console.log(this.visitedArray);
        this.drawVisited();
        this.drawPath();
        this.drawLab();
        //this.drawResultGraph()
    };
    Seminarska.prototype.initNodeArray = function () {
        this.nodeArray = [];
        for (var y = 0; y < this.labArray.length; y++) {
            this.nodeArray.push(Array(this.labArray[0].length));
        }
    };
    Seminarska.prototype.getSquareSize = function () {
        var dimY = this.labArray.length;
        var dimX = this.labArray[0].length;
        var w = this.canvas.width;
        var h = this.canvas.height;
        return (w / dimX > h / dimY ? h / dimY : w / dimX);
    };
    Seminarska.prototype.drawLab = function () {
        var squareSize = this.getSquareSize();
        for (var i = 0; i < this.labArray.length; i++) {
            for (var j = 0; j < this.labArray[0].length; j++) {
                var val = this.labArray[i][j];
                this.drawSquare(j, i, val, squareSize);
            }
        }
    };
    Seminarska.prototype.algoDFS = function (node) {
        // iterativni dfs
        var stack = [];
        stack.push(node);
        while (stack.length > 0) {
            var n = stack.pop();
            if (n.value == -3) {
                this.writeLog("DFS: pot najdena");
                var score = 0;
                var current = n;
                var count = 0;
                while (current.prejsnji) {
                    score += current.value;
                    this.pathArray.push(new PathSquare(current.x, current.y));
                    current = current.prejsnji;
                    count++;
                }
                this.writeLog("Seštevek uteži: " + score);
                this.writeLog("Dolžina poti: " + count);
                return;
            }
            if (!n.visited) {
                this.visitedArray.push(new PathSquare(n.x, n.y));
                n.visited = true;
            }
            if (n.north && !n.north.visited) {
                n.north.prejsnji = n;
                stack.push(n.north);
            }
            if (n.west && !n.west.visited) {
                n.west.prejsnji = n;
                stack.push(n.west);
            }
            if (n.south && !n.south.visited) {
                n.south.prejsnji = n;
                stack.push(n.south);
            }
            if (n.east && !n.east.visited) {
                n.east.prejsnji = n;
                stack.push(n.east);
            }
        }
    };
    Seminarska.prototype.algoBFS = function (node) {
        var queue = [];
        node.visited = true;
        queue.push(node);
        while (queue.length > 0) {
            var n = queue.shift();
            if (n.value == -3) {
                var current = n;
                var score = 0;
                var count = 0;
                while (current.prejsnji) {
                    this.pathArray.push(new PathSquare(current.x, current.y));
                    score += current.value;
                    current = current.prejsnji;
                    count++;
                }
                this.writeLog("BFS: pot najdena");
                this.writeLog("Seštevek uteži: " + score);
                this.writeLog("Dolžina poti: " + count);
                return;
            }
            if (!n.visited) {
                this.visitedArray.push(new PathSquare(n.x, n.y));
                n.visited = true;
            }
            if (n.north && !n.north.visited) {
                n.north.prejsnji = n;
                queue.push(n.north);
            }
            if (n.west && !n.west.visited) {
                n.west.prejsnji = n;
                queue.push(n.west);
            }
            if (n.south && !n.south.visited) {
                n.south.prejsnji = n;
                queue.push(n.south);
            }
            if (n.east && !n.east.visited) {
                n.east.prejsnji = n;
                queue.push(n.east);
            }
        }
    };
    Seminarska.prototype.dobiSosede = function (node) {
        var ret = [];
        if (node.east) {
            ret.push(node.east);
        }
        if (node.south) {
            ret.push(node.south);
        }
        if (node.west) {
            ret.push(node.west);
        }
        if (node.north) {
            ret.push(node.north);
        }
        return ret;
    };
    Seminarska.prototype.algoAStar = function (startNode) {
        var openList = [];
        var closedList = [];
        openList.push(startNode);
        while (openList.length > 0) {
            var currentNode = this.getLowestF(openList);
            this.visitedArray.push(new PathSquare(currentNode.x, currentNode.y));
            openList = this.removeFromList(openList, currentNode);
            closedList.push(currentNode);
            if (this.isEnd(currentNode)) {
                this.writeLog("Najdena pot.");
                return;
            }
            var children = this.getSuccessors(currentNode);
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (this.listContains(closedList, child)) {
                    continue;
                }
                child.g = currentNode.g + child.g;
                child.h = this.getDistanceToEnd(child);
                child.f = child.g + child.h;
                openList.push(child);
            }
        }
    };
    Seminarska.prototype.getDistanceToEnd = function (node) {
        var minR = Number.MAX_VALUE;
        this.endNodes.forEach(function (el) {
            var r = Math.sqrt(Math.pow((node.x - el.x), 2) + Math.pow(node.y - el.y, 2));
            if (r < minR) {
                minR = r;
            }
        });
        return minR;
    };
    Seminarska.prototype.removeFromList = function (list, node) {
        var ret = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].x != node.x && list[i].y != node.y) {
                ret.push(list[i]);
            }
        }
        return ret;
    };
    Seminarska.prototype.listContains = function (list, node) {
        for (var i = 0; i < list.length; i++) {
            var element = list[i];
            if (element.x == node.x && element.y == node.y) {
                return true;
            }
        }
        return false;
    };
    Seminarska.prototype.getSuccessors = function (node) {
        var ret = [];
        if (node.north) {
            ret.push(node.north);
        }
        if (node.west) {
            ret.push(node.west);
        }
        if (node.east) {
            ret.push(node.east);
        }
        if (node.south) {
            ret.push(node.south);
        }
        return ret;
    };
    Seminarska.prototype.isEnd = function (node) {
        var end = this.endNodes[0];
        if (end.x == node.x && end.y == node.y) {
            return true;
        }
        return false;
    };
    Seminarska.prototype.getLowestF = function (list) {
        var minF = list[0];
        for (var i = 0; i < list.length; i++) {
            if (list[i].f < minF.f) {
                minF = list[i];
            }
        }
        return minF;
    };
    Seminarska.prototype.drawSquare = function (x, y, val, width) {
        var toDraw = true;
        switch (val) {
            case -5:
                this.context.fillStyle = "gray";
                break;
            case -4:
                this.context.fillStyle = "green";
                break;
            case -3:
                this.context.fillStyle = "yellow";
                break;
            case -2:
                this.context.fillStyle = "red";
                break;
            case -1:
                this.context.fillStyle = "black";
                break;
            default:
                toDraw = false;
                break;
        }
        if (toDraw) {
            this.context.fillRect(x * width, y * width, width, width);
        }
    };
    Seminarska.prototype.drawPath = function () {
        var _this = this;
        this.pathArray.forEach(function (el) {
            _this.drawSquare(el.x, el.y, -4, _this.getSquareSize());
        });
    };
    Seminarska.prototype.drawVisited = function () {
        var _this = this;
        var visitedCount = 0;
        this.visitedArray.forEach(function (el) {
            _this.drawSquare(el.x, el.y, -5, _this.getSquareSize());
            visitedCount++;
        });
        this.writeLog("Število obiskanih vozlišč: " + visitedCount);
    };
    return Seminarska;
}());
var Vozlisce = /** @class */ (function () {
    function Vozlisce(val, x, y) {
        this.f = 0;
        this.h = 0;
        this.prejsnji = null;
        this.value = val;
        this.x = x;
        this.y = y;
        this.visited = false;
        this.g = val;
    }
    return Vozlisce;
}());
var PathSquare = /** @class */ (function () {
    function PathSquare(x, y) {
        this.x = x;
        this.y = y;
    }
    return PathSquare;
}());
window.onload = function () {
    var algo = 0;
    var astarMode = true;
    var btnStart = document.getElementById("btn-start");
    var radio1 = document.getElementById("radio-algo-1");
    var radio2 = document.getElementById("radio-algo-2");
    var radio3 = document.getElementById("radio-algo-3");
    radio1.addEventListener("change", function (e) {
        algo = 0;
    });
    radio2.addEventListener("change", function (e) {
        algo = 1;
    });
    radio3.addEventListener("change", function (e) {
        algo = 2;
    });
    var sem;
    btnStart.onclick = function (e) {
        if (sem) {
            sem.destroy();
        }
        sem = new Seminarska(algo, astarMode);
    };
};
