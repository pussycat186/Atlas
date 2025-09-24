"use client";

import { getGatewayUrl } from "@atlas/config";
import { AtlasPrismSKUDemo } from "@atlas/prism-ui";

export default function Page() {
  return (
    <AtlasPrismSKUDemo
      app="dev"
      skuDefault="pro"
      gateway={getGatewayUrl()}
      renderTimestamp={(msg) => new Date(msg.ts).toLocaleString()}
      showTenantForPro={true}
      showPqcForPro={true}
      showQtcaBadgeForPro={true}
      minimapDefault="on"
    />
  );
}