import fs, { read } from "fs";
import os from "os";
import path from "path";

export type Config = {
    dbUrl: string;
    currentUserName: string;
}

function getConfigFilePath(): string {
    const filePath = path.join(os.homedir(),".gatorconfig.json");
    return filePath;
}

function validateConfig(rawConfig: any): Config {
    if (
        typeof rawConfig === "object" &&
        rawConfig !== null &&
        typeof rawConfig.db_url === "string" &&
        typeof rawConfig.currentUserName === "string"
    ) {
    return rawConfig;
  }
  throw new Error("Invalid config file");
}

function writeConfig(cfg: Config): void {
    const filePath = getConfigFilePath();
    const cfgJson = JSON.stringify(cfg);
    fs.writeFileSync(filePath, cfgJson);
}

export function setUser(name: string){
    const currConfig = readConfig();
    const config: Config = {
        ...currConfig,
        currentUserName: name
    };
    writeConfig(config);

}

export function readConfig(): Config{
    const filePath = getConfigFilePath();
    const rawConfigJson = fs.readFileSync(filePath, {
        encoding: "utf-8"
    });
    const rawConfig = JSON.parse(rawConfigJson);
    return validateConfig(rawConfig);

}