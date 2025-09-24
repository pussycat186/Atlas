"use client";

import { getGatewayUrl } from "@atlas/config";
import { AtlasPrismSKUDemo } from "@atlas/prism-ui";

export default function Page() {
  return (
    <AtlasPrismSKUDemo
      app="messenger"
      skuDefault="basic"
      gateway={getGatewayUrl()}
      renderTimestamp={(msg) => new Date(msg.ts).toLocaleString()}
      showTenantForPro={false}
      showPqcForPro={false}
      showQtcaBadgeForPro={false}
      minimapDefault="off"
    />
  );
}

