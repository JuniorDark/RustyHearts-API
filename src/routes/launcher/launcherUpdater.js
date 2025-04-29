import { Router } from "express";
import { readFile, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { logger } from "../../utils/logger.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Endpoint to get the launcher version from the launcher_info.ini file
router.get("/getLauncherVersion", (req, res) => {
  try {
    const launcherInfoPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "public",
      "launcher",
      "launcher_update",
      "launcher_info.ini"
    );
    
    readFile(launcherInfoPath, "utf8", (err, data) => {
      try {
        if (err) {
          logger.error(err);
          return res.status(400).json({
            result: "FileReadError",
            message: "Error reading launcher_info.ini file",
          });
        }
        
        const versionRegex = /version=(.*)/i;
        const match = data.match(versionRegex);
        if (match) {
          const launcherVersion = match[1];
          return res.status(200).json({
            version: launcherVersion,
          });
        }
        
        return res.status(400).json({
          result: "VersionNotFound",
          message: "Version not found in launcher_info.ini file",
        });
      } catch (error) {
        logger.error(`[getLauncherVersion] Processing error: ${error}`);
        return res.status(500).json({
          result: "InternalError",
          message: "An error occurred while processing the file",
        });
      }
    });
  } catch (error) {
    logger.error(`[getLauncherVersion] Initialization error: ${error}`);
    return res.status(500).json({
      result: "InternalError",
      message: "An error occurred while initializing the version check",
    });
  }
});

// Endpoint to download the new launcher version from the launcher_update folder
router.post("/updateLauncherVersion", (req, res) => {
  try {
    const launcherUpdatePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "public",
      "launcher",
      "launcher_update"
    );
    
    const version = req.body.version;
    if (!version) {
      return res.status(400).json({
        result: "MissingVersion",
        message: "Missing version parameter",
      });
    }
    
    const fileName = `launcher_${version}.zip`;
    const file = path.join(launcherUpdatePath, fileName);
    
    if (!existsSync(file)) {
      logger.error(`[Launcher Updater] File ${fileName} not found`);
      return res.status(404).json({
        result: "FileNotFound",
        message: `File ${fileName} not found on the server`,
      });
    }
    
    res.download(file, (err) => {
      if (err) {
        logger.error(`[updateLauncherVersion] Download error: ${err}`);
        if (!res.headersSent) {
          return res.status(500).json({
            result: "DownloadError",
            message: "Error occurred while downloading the file",
          });
        }
      }
    });
  } catch (error) {
    logger.error(`[updateLauncherVersion] Error: ${error}`);
    if (!res.headersSent) {
      return res.status(500).json({
        result: "InternalError",
        message: "An unexpected error occurred",
      });
    }
  }
});

export default router;