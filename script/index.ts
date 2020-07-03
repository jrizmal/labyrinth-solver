class Seminarska {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D | null
    algorithm: number
    fileInput: HTMLInputElement | HTMLElement | null
    startTime: number
    container: HTMLElement | null
    labArray: Array<Array<number>>
    firstNode: Vozlisce
    endNodes: Array<Vozlisce> = []
    endNodesAStar: Array<Vozlisce> = []
    nodeArray: Array<Array<Vozlisce>>
    visitedArray: Array<PathSquare> = []
    pathArray: Array<PathSquare> = []
    astarSearchAll: boolean = false

    public constructor(algo: number, astarMode: boolean) {
        this.clearLog()
        // nastavi cancas, context...
        this.startTime = new Date().getTime()
        this.writeLog("Začetek")
        this.canvas = document.createElement("canvas")
        this.canvas.width = 500
        this.canvas.height = 500
        this.context = this.canvas.getContext("2d")
        this.container = document.getElementById("canvas-container")
        this.container.appendChild(this.canvas)
        this.context = this.canvas.getContext("2d")
        this.astarSearchAll = false

        // TODO: Vzem algoritm iz radio buttona
        this.algorithm = algo

        // dobi file - pretvori v string in parsaj
        this.fileInput = document.getElementById("file-input")
        if (this.fileInput.files.length) {
            let file: File = this.fileInput.files[0]
            this.writeLog(`Datoteka: ${file.name}`)
            let reader: FileReader = new FileReader()
            let text

            const ctx = this

            reader.onload = (e) => {
                text = reader.result
                let lines = text.split("\n")
                let array2D = []
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i] != "") {
                        let nums = lines[i].split(",")
                        for (let j = 0; j < nums.length; j++) {
                            nums[j] = parseInt(nums[j])
                        }
                        array2D.push(nums)
                    }
                }
                this.labArray = array2D
                ctx.writeLog(`Labirint prebran. Dimenzije ${array2D[0].length}x${array2D.length}`)
                this.buildGraph()
            }

            reader.readAsText(file as Blob);
        }
        else {
            this.writeLog("Ni datoteke")
        }

    }

    writeLog(msg: string) {
        let seconds: number = new Date().getTime() - this.startTime
        const logSpan: HTMLSpanElement = document.getElementById("log-span")
        let item: HTMLLIElement = document.createElement("li")
        item.innerHTML = seconds + "ms: " + msg
        logSpan.appendChild(item)
    }
    clearLog() {
        const logSpan: HTMLSpanElement = document.getElementById("log-span")
        logSpan.innerHTML = ""
    }
    destroy() {
        this.container.innerHTML = ""
    }
    buildGraph() {
        this.writeLog("Začetek gradnje grafa")
        // TODO: grajenje grafa

        this.initNodeArray()
        let nodeCount: number = 0
        for (let y = 0; y < this.labArray.length; y++) {

            for (let x = 0; x < this.labArray[0].length; x++) {
                const element = this.labArray[y][x]
                if (element == -1) {
                    continue
                }
                let node = new Vozlisce(element, x, y)

                let levi = this.nodeArray[y][x - 1]
                let zgornji = this.nodeArray[y - 1][x]

                if (levi) {
                    levi.east = node
                    node.west = levi
                }
                if (zgornji) {
                    zgornji.south = node
                    node.north = zgornji
                }

                if (node.value == -2) {
                    this.firstNode = node
                }

                if (node.value == -3) {
                    this.endNodes.push(node)
                }

                this.nodeArray[y][x] = node
                nodeCount++
            }
        }

        this.writeLog("Graf zgrajen. Število vozlišč: " + nodeCount)
        this.drawLab()

        switch (this.algorithm) {
            case 0:
                this.algoDFS(this.firstNode)
                break
            case 1:
                this.algoBFS(this.firstNode)
                break
            case 2:
                this.algoAStar(this.firstNode)
                break
            default:
                break
        }

        // console.log(this.visitedArray);

        this.drawVisited()
        this.drawPath()
        this.drawLab()
        //this.drawResultGraph()
    }
    initNodeArray() {
        this.nodeArray = []
        for (let y = 0; y < this.labArray.length; y++) {
            this.nodeArray.push(Array(this.labArray[0].length))
        }
    }
    getSquareSize() {
        const dimY = this.labArray.length
        const dimX = this.labArray[0].length
        const w: number = this.canvas.width
        const h: number = this.canvas.height
        return (w / dimX > h / dimY ? h / dimY : w / dimX)
    }
    drawLab() {
        let squareSize: number = this.getSquareSize()

        for (let i = 0; i < this.labArray.length; i++) {
            for (let j = 0; j < this.labArray[0].length; j++) {
                const val: number = this.labArray[i][j]
                this.drawSquare(j, i, val, squareSize)
            }
        }
    }
    algoDFS(node: Vozlisce) {
        // iterativni dfs
        let stack: Array<Vozlisce> = []
        stack.push(node)
        while (stack.length > 0) {
            let n: Vozlisce = stack.pop()
            if (n.value == -3) {
                this.writeLog("DFS: pot najdena")
                let score: number = 0
                let current: Vozlisce = n
                let count:number = 0
                while (current.prejsnji) {
                    score += current.value
                    this.pathArray.push(new PathSquare(current.x, current.y))
                    current = current.prejsnji
                    count++
                }
                this.writeLog("Seštevek uteži: " + score)
                this.writeLog("Dolžina poti: " + count)
                return
            }
            if (!n.visited) {
                this.visitedArray.push(new PathSquare(n.x, n.y))
                n.visited = true
            }
            if (n.north && !n.north.visited) {
                n.north.prejsnji = n
                stack.push(n.north)
            }
            if (n.west && !n.west.visited) {
                n.west.prejsnji = n
                stack.push(n.west)
            }
            if (n.south && !n.south.visited) {
                n.south.prejsnji = n
                stack.push(n.south)
            }
            if (n.east && !n.east.visited) {
                n.east.prejsnji = n
                stack.push(n.east)
            }
        }
    }

    algoBFS(node: Vozlisce) {
        let queue: Array<Vozlisce> = []
        node.visited = true
        queue.push(node)

        while (queue.length > 0) {
            let n: Vozlisce = queue.shift()
            if (n.value == -3) {
                let current: Vozlisce = n
                let score: number = 0
                let count:number = 0
                while (current.prejsnji) {
                    this.pathArray.push(new PathSquare(current.x, current.y))
                    score += current.value
                    current = current.prejsnji
                    count++
                }
                this.writeLog("BFS: pot najdena")
                this.writeLog("Seštevek uteži: " + score)
                this.writeLog("Dolžina poti: " + count)
                return
            }
            if (!n.visited) {
                this.visitedArray.push(new PathSquare(n.x, n.y))
                n.visited = true
            }
            if (n.north && !n.north.visited) {
                n.north.prejsnji = n
                queue.push(n.north)
            }
            if (n.west && !n.west.visited) {
                n.west.prejsnji = n
                queue.push(n.west)
            }
            if (n.south && !n.south.visited) {
                n.south.prejsnji = n
                queue.push(n.south)
            }
            if (n.east && !n.east.visited) {
                n.east.prejsnji = n
                queue.push(n.east)
            }
        }

    }

    dobiSosede(node: Vozlisce): Array<Vozlisce> {
        let ret: Array<Vozlisce> = []
        if (node.east) { ret.push(node.east) }
        if (node.south) { ret.push(node.south) }
        if (node.west) { ret.push(node.west) }
        if (node.north) { ret.push(node.north) }
        return ret
    }

    algoAStar(startNode:Vozlisce){
        let openList:Array<Vozlisce> = []
        let closedList:Array<Vozlisce> = []
        openList.push(startNode)

        while(openList.length>0){
            let currentNode:Vozlisce = this.getLowestF(openList)
            this.visitedArray.push(new PathSquare(currentNode.x,currentNode.y))

            openList = this.removeFromList(openList,currentNode)
            closedList.push(currentNode)

            if(this.isEnd(currentNode)){
                this.writeLog("Najdena pot.")
                return
            }

            let children:Array<Vozlisce>=this.getSuccessors(currentNode)

            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if(this.listContains(closedList,child)){
                    continue
                }
                child.g = currentNode.g+child.g
                child.h = this.getDistanceToEnd(child)
                child.f = child.g+child.h

                openList.push(child)
            }
        }
    }

    getDistanceToEnd(node:Vozlisce){
        let minR:number = Number.MAX_VALUE
        this.endNodes.forEach(el=>{
            let r:number = Math.sqrt(Math.pow((node.x-el.x),2)+Math.pow(node.y-el.y,2))
            if(r<minR){
                minR=r
            }
        })
        return minR
    }

    removeFromList(list:Array<Vozlisce>,node:Vozlisce){
        let ret:Array<Vozlisce> = []
        for (let i = 0; i < list.length; i++) {
            if(list[i].x!=node.x && list[i].y!=node.y){
                ret.push(list[i])
            }
        }
        return ret
    }

    listContains(list:Array<Vozlisce>,node:Vozlisce){
        for (let i = 0; i < list.length; i++) {
            let element = list[i];
            if(element.x==node.x && element.y==node.y){
                return true
            }
        }
        return false
    }

    getSuccessors(node:Vozlisce):Array<Vozlisce>{
        let ret:Array<Vozlisce> = []
        if(node.north){
            ret.push(node.north)
        }
        if(node.west){
            ret.push(node.west)
        }
        if(node.east){
            ret.push(node.east)
        }
        if(node.south){
            ret.push(node.south)
        }
        return ret
    }

    isEnd(node:Vozlisce){
        const end = this.endNodes[0]
        if(end.x==node.x && end.y==node.y){
            return true
        }
        return false
    }

    getLowestF(list:Array<Vozlisce>){
        let minF:Vozlisce=list[0]
        for (let i = 0; i < list.length; i++) {
            if(list[i].f<minF.f){
                minF=list[i]
            }
        }
        return minF
    }

    drawSquare(x: number, y: number, val: number, width: number) {
        let toDraw: boolean = true
        switch (val) {
            case -5:
                this.context.fillStyle = "gray"
                break
            case -4:
                this.context.fillStyle = "green"
                break
            case -3:
                this.context.fillStyle = "yellow"
                break
            case -2:
                this.context.fillStyle = "red"
                break
            case -1:
                this.context.fillStyle = "black"
                break
            default:
                toDraw = false
                break
        }
        if (toDraw) {
            this.context.fillRect(x * width, y * width, width, width);
        }
    }
    drawPath() {
        this.pathArray.forEach(el => {
            this.drawSquare(el.x, el.y, -4, this.getSquareSize())
        });
    }
    drawVisited() {
        let visitedCount: number = 0
        this.visitedArray.forEach(el => {
            this.drawSquare(el.x, el.y, -5, this.getSquareSize())
            visitedCount++
        });
        this.writeLog("Število obiskanih vozlišč: " + visitedCount)
    }
}

class Vozlisce {
    value: number

    north: Vozlisce
    east: Vozlisce
    south: Vozlisce
    west: Vozlisce

    x: number
    y: number

    visited: boolean

    f: number = 0
    g: number 
    h: number = 0

    prejsnji: Vozlisce = null

    constructor(val: number, x: number, y: number) {
        this.value = val
        this.x = x
        this.y = y
        this.visited = false

        this.g=val
    }
}

class PathSquare {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

window.onload = function () {
    let algo: number = 0
    let astarMode: boolean = true
    const btnStart: HTMLButtonElement | HTMLElement = document.getElementById("btn-start")
    const radio1 = document.getElementById("radio-algo-1")
    const radio2 = document.getElementById("radio-algo-2")
    const radio3 = document.getElementById("radio-algo-3")

    radio1.addEventListener("change", (e) => {
        algo = 0

    })
    radio2.addEventListener("change", (e) => {
        algo = 1

    })
    radio3.addEventListener("change", (e) => {
        algo = 2

    })

    let sem: Seminarska
    btnStart.onclick = (e) => {
        if (sem) {
            sem.destroy()
        }
        sem = new Seminarska(algo, astarMode)
    }
}