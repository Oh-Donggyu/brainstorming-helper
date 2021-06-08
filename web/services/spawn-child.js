const { spawn } = require("child_process");

function spawnPython(cmd, path, args) {
    const pyArgs = [ path ];
    Array.prototype.push.apply(pyArgs, args);
    const pyChild = spawn(cmd, pyArgs);
    return pyChild;
}

module.exports = {
    spawnPython,
}