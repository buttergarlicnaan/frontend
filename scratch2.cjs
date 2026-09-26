const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'src/components/LoadingScreen.jsx'), 'utf8');

code = code.replace("TIFFS_RETRIEVED: 'Raster data retrieved',", "TIFFS_RETRIEVED: 'Raster data retrieved',\r\n  UPLOADING_INPUTS: 'Uploading to cloud storage...',\r\n  INPUTS_UPLOADED: 'Ready for processing',");
code = code.replace("const isFinished = job.status === 'COMPLETED' || job.status === 'TIFFS_RETRIEVED';", "const isFinished = job.status === 'COMPLETED' || job.status === 'INPUTS_UPLOADED';");

fs.writeFileSync(path.join(__dirname, 'src/components/LoadingScreen.jsx'), code);
