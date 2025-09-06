import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes as S } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter as OTLPHttpExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const svc = process.env.OTEL_SERVICE_NAME || 'atlas-gateway';
const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318') + '/v1/traces';
const traceExporter = new OTLPHttpExporter({ url: endpoint });

const sdk = new NodeSDK({
  resource: new Resource({ [S.SERVICE_NAME]: svc, [S.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'dev' }),
  traceExporter,
  instrumentations: [ getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-http': { enabled: true } }) ]
});

sdk.start().catch((e)=>console.error('OTEL SDK start error', e));
