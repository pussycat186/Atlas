'use client';

import { AtlasPrismSKUDemo } from '@atlas/prism-ui';
import { getGatewayUrl } from '@atlas/config';

export default function HomePage() {
  return (
    <AtlasPrismSKUDemo
      app="admin"
      skuDefault="pro"
      gateway={getGatewayUrl()}
      renderTimestamp={(m) => new Date(m.ts)}
      showTenantForPro={true}
      showPqcForPro={true}
      showQtcaBadgeForPro={true}
      minimapDefault="on"
    />
  );
}