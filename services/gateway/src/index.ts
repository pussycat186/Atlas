import './tracing'; // MUST be first
import express from 'express';
import { emitOneSpan } from './manual-span';
const app = express();
app.get('/healthz', (_req,res)=>res.send('ok'));
app.listen(8080, async ()=>{ console.log('gateway up'); try{ await emitOneSpan(); console.log('manual span emitted'); }catch(e){ console.error(e);} });