import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';

const chapters=['workshop','city','tower','remembered-hour','final-hour','dawn'];
const requiredScenes=['ProductionWorkshopWakesScene.js','ProductionCityDisagreesScene.js','ProductionGearTowerScene.js','ProductionRememberedHourScene.js','ProductionFinalHourScene.js','ProductionNewClockTicksScene.js'];
const requiredMile=['00','25','50','75','100'];
const failures=[];const warnings=[];
for(const scene of requiredScenes)if(!existsSync(`stories/clockmaker/src/production/${scene}`))failures.push(`missing production scene ${scene}`);
if(!existsSync('stories/clockmaker/performance-budgets.json'))failures.push('missing performance budgets');
if(!existsSync('stories/clockmaker/QA_DESIGN_COMPLETENESS.md'))failures.push('missing completeness QA design');
for(const chapter of chapters){const dir=`stories/clockmaker/visual-baselines/${chapter}`;if(!existsSync(dir)){failures.push(`missing baseline directory ${chapter}`);continue;}const files=await readdir(dir);for(const m of requiredMile){if(!files.some(file=>file.startsWith(`${m}-`)&&file.endsWith('.png')))warnings.push(`baseline awaiting approval: ${chapter}/${m}`);}}
const report={status:failures.length?'failed':warnings.length?'blocked-awaiting-browser-approval':'ready-for-release',failures,warnings,chapters};console.log(JSON.stringify(report,null,2));
if(failures.length)process.exit(1);
if(warnings.length)process.exitCode=2;
