import { AtlasPrismSKUDemo } from '@atlas/prism-ui';

export default function Page() {
  return (
    <AtlasPrismSKUDemo
      app="messenger"
      skuDefault="basic"
      gateway={getGatewayUrl()}
      testids={{
        'sku-basic': 'sku-basic',
        'sku-pro': 'sku-pro',
        'theme-toggle': 'theme-toggle',
        'composer-input': 'composer-input',
        'send-btn': 'send-btn',
        'verify-btn': 'verify-btn',
        'receipt': 'receipt',
        'minimap-toggle': 'minimap-toggle',
        'copy-javascript': 'copy-javascript',
        'copy-curl': 'copy-curl',
      }}
      containerTestId="tab-messenger"
      renderTimestamp={(msg) => new Date(msg.ts)}
      showTenantForPro={true}
      showPqcForPro={true}
      showQtcaBadgeForPro={true}
      minimapDefault="off"
    />
  );
}
