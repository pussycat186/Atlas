import './tracing'; // MUST be first
import express from 'express';
import { emitOneSpan } from './manual-span';

const app = express();
app.get('/healthz', (_req,res)=>res.send('ok'));

const port = parseInt(process.env.PORT || '8091');
app.listen(port, async ()=>{ 
  console.log(`witness up on port ${port}`); 
  try{ 
    await emitOneSpan(); 
    console.log('manual span emitted'); 
  }catch(e){ 
    console.error(e);
  }
});