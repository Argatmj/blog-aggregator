import { commandRegistry, handlerLogin, runCommand } from "./command.js";
import { setUser, readConfig } from "./config.js";

function main() {
    const cmdRegistry: commandRegistry ={
        "login": handlerLogin
    } 
    const [cmdName, ...args] = process.argv.slice(2);

    console.log(cmdName);
    console.log(args);
    
    if (cmdName === undefined){
        console.log("Not enough arguments were provided.")
        process.exit(0)
    }
    
    if (args.length === 0){
        console.log("Username is required.")
        process.exit(0)
    } 
    runCommand(cmdRegistry, cmdName, ...args);
    console.log(readConfig());
}

main();