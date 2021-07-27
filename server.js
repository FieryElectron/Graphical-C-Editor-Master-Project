const express = require('express')
const WebSocket = require('ws')
const fs = require('fs');
const rimraf = require("rimraf");
const { exec } = require("child_process");

const app = express()
const port = 8080

app.use('/', express.static(__dirname + '/public'));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})

const wss = new WebSocket.Server({ port: 8081 })

let projectJson = {};

wss.on('connection', ws => {
    // fs.readFile("json.json", function (err, buf) {
    //     // console.log(buf.toString());

    //     let obj = new Object();
    //     obj.cmd = "loadproject";
    //     obj.data = JSON.parse(buf.toString());


    //     ws.send(JSON.stringify(obj));
    // });



    let obj = new Object();
    obj.cmd = "listProjects";
    obj.data = listProjects();
    ws.send(JSON.stringify(obj));

    obj = new Object();
    obj.cmd = "loadProjectConf";
    obj.data = loadProjectConf();
    ws.send(JSON.stringify(obj));

    ws.on('message', message => {
        let datapack = JSON.parse(message);

        // console.log(datapack);
        switch (datapack.cmd) {
            case "saveProject":
                saveProject(datapack.data);
                break;
            case "generateCode":
                generateCode(datapack.data, ws);
                break;
            case "createProject":
                createProject(datapack.data);
                break;
            case "deleteProject":
                deleteProject(datapack.data);
                break;
            case "saveProjectConf":
                saveProjectConf(datapack.data);
                break;
            case "renameProject":
                renameProject(datapack.data);
                break;
            case "loadProject":
                loadProject(datapack.data, ws);
                break;
        }
    })
})

const projectRootPath = './projects/';

function saveProject(data) {
    let name = data.name;
    let projectJson = data.data;

    fs.writeFile(projectRootPath+name+"/json.json", JSON.stringify(projectJson), function (err) {
        if (err) throw err;
    });
}

function generateCode(data, ws) {
    let name = data.name;
    let code = data.data;
    fs.writeFile(projectRootPath+name+"/code.c", code, function (err) {
        if (err) throw err;
        let path = projectRootPath+name+"/";
        exec("gcc -o "+path+"code "+path+"code.c && "+path+"code", (error, stdout, stderr) => {
            let obj = new Object();
            obj.cmd = "stdout";

            if (error) {
                console.log(`error: ${error.message}`);
                obj.data = error.message;
                ws.send(JSON.stringify(obj));
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                obj.data = stderr;
                ws.send(JSON.stringify(obj));
                return;
            }
            obj.data = stdout;
            ws.send(JSON.stringify(obj));
        });
    });
}

function createProject(data) {
    let path = projectRootPath + data;

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    fs.writeFile(path + "/json.json", '{}', function (err) {
        if (err) throw err;
    });

    fs.writeFile(path + "/code.c", '', function (err) {
        if (err) throw err;
    });
}

function deleteProject(data) {
    let path = projectRootPath + data;

    fs.unlinkSync(path + "/json.json");
    fs.unlinkSync(path + "/code.c");
    fs.rmdir(path, () => { });
}

function listProjects() {
    let dirs = fs.readdirSync(projectRootPath).filter(function (file) {
        return fs.statSync(projectRootPath + '/' + file).isDirectory();
    });
    return dirs;
}

function loadProjectConf() {
    return JSON.parse(fs.readFileSync("projectConf.json").toString());
}

function saveProjectConf(data) {
    fs.writeFileSync("projectConf.json", JSON.stringify(data));
}

function renameProject(data) {
    fs.rename(projectRootPath+data.oldname, projectRootPath+data.newname, function (err) {
        if (err) {
            console.log(err)
        }
    })
}

function loadProject(data, ws){
    fs.readFile(projectRootPath+data+"/json.json", function (err, buf) {
        let obj = new Object();
        obj.cmd = "loadProject";
        obj.data = JSON.parse(buf.toString());
        ws.send(JSON.stringify(obj));
    });
}
// fs.writeFile("test.json", "1111", function (err) {
//     if (err) throw err;
//     console.log('Saved!');
// });

// fs.readFile("test.json", function (err, buf) {
//     console.log(buf.toString());
// });