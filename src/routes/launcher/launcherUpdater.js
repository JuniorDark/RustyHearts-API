const express = require('express');
const fs = require('fs');
const path = require('path');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Endpoint to get the launcher version from the launcher_info.ini file
router.get('/getLauncherVersion', (req, res) => {
  const launcherInfoPath = path.join(__dirname, '..', '..', '..', 'public', 'launcher', 'launcher_update', 'launcher_info.ini');
  fs.readFile(launcherInfoPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading launcher_info.ini');
    }
    const versionRegex = /version=(.*)/i;
    const match = data.match(versionRegex);
    if (match) {
      const launcherVersion = match[1];
      return res.json({ version: launcherVersion });
    }
    return res.status(500).send('Invalid launcher_info.ini format');
  });
});

// Endpoint to download the new launcher version from the launcher_update folder
router.post('/updateLauncherVersion', (req, res) => {
  const launcherUpdatePath = path.join(__dirname, '..', '..', '..', 'public', 'launcher', 'launcher_update');
  const version = req.body.version;
  if (!req.body.version) {
  return res.status(400).send('Missing version parameter');
}
  const file = path.join(launcherUpdatePath, `launcher_${version}.zip`);
  if (!fs.existsSync(file)) {
    return res.status(404).send(`File ${file} not found`);
	logger.error(`[Launcher Updater] File ${file} not found`);
  }
  res.download(file);
});

module.exports = router;
