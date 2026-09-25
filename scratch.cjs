const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'src/components/LoadingScreen.jsx'), 'utf8');
code = code.replace("  COMPLETED: 'Complete',\r\n  FAILED: 'Processing failed'", "  COMPLETED: 'Complete',\r\n  TIFFS_RETRIEVED: 'Raster data retrieved',\r\n  FAILED: 'Processing failed'");
code = code.replace("setProgress(job.status === 'COMPLETED' ? 100 : fakeProgress)", "const isFinished = job.status === 'COMPLETED' || job.status === 'TIFFS_RETRIEVED';\r\n        setProgress(isFinished ? 100 : fakeProgress)");
code = code.replace("if (job.status === 'COMPLETED')", "if (isFinished)");
code = code.replace("onError('Processing failed on the server')", "onError(job.warning || 'Processing failed on the server')");

fs.writeFileSync(path.join(__dirname, 'src/components/LoadingScreen.jsx'), code);
