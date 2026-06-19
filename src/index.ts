import { commandRegistry, handlerLogin, runCommand, registerCommand, handlerRegister, handlerReset, handlerUsers, handlerAgg, handlerFeed, handlerFeeds, handlerFollowing, handlerFollow, middlewareLoggedIn, handlerUnfollow, handlerBrowse} from "./command.js";
async function main() {
   
    const cmdRegistry: commandRegistry ={
        "login": handlerLogin
    } 

    registerCommand(cmdRegistry, "register", handlerRegister);
    registerCommand(cmdRegistry, "reset", handlerReset);
    registerCommand(cmdRegistry, "users", handlerUsers);
    registerCommand(cmdRegistry, "agg", handlerAgg);
    registerCommand(cmdRegistry, "feeds", handlerFeeds);
    registerCommand(cmdRegistry, "addfeed", middlewareLoggedIn(handlerFeed));
    registerCommand(cmdRegistry, "follow", middlewareLoggedIn(handlerFollow));
    registerCommand(cmdRegistry, "following", middlewareLoggedIn(handlerFollowing));
    registerCommand(cmdRegistry, "unfollow", middlewareLoggedIn(handlerUnfollow));
     registerCommand(cmdRegistry, "browse", middlewareLoggedIn(handlerBrowse));

    const [cmdName, ...args] = process.argv.slice(2);
    const singleCmd = ["reset","users","agg","feeds","following", "browse"];
    
    if (cmdName === undefined && !(singleCmd.includes(cmdName))){
        console.log("Not enough arguments were provided.")
        process.exit(0)
    }
    
    if (args.length === 0 && !(singleCmd.includes(cmdName))){
        console.log("Username is required.")
        process.exit(0)
    } 
    await runCommand(cmdRegistry, cmdName, ...args);
}

main();