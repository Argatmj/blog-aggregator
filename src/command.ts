import { setUser, readConfig } from "./config.js";

type commandHandle = (cmdName: string, ...args: string[]) => void;

export type commandRegistry = Record<string, commandHandle>;

function registerCommand(registry: commandRegistry, cmdName: string, handler: commandHandle){
    registry[cmdName] = handler;
}

export function runCommand(registry: commandRegistry, cmdName: string, ...args: string[]) {
    registry[cmdName](cmdName, ...args);
}


export function handlerLogin(cmdName: string, ...args: string[]): void {
    if (args.length === 0){
        throw new Error("The login expects a username");
    }
    const username = args[0];
    setUser(username);
    const config = readConfig();
    console.log(`User ${config.currentUserName} has been set!`);
}