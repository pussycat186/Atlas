# Atlas Trust Portal

## Mô tả

Static website công bố thông tin minh bạch về Atlas Messenger:
- JWKS công khai
- SBOM (Software Bill of Materials)
- SLSA Provenance
- Cosign verification logs
- CI/CD gate results
- SLO metrics
- Sample receipts

## Deployment

Deploy lên Cloud Storage + Cloud CDN:

```bash
gsutil -m cp -r * gs://atlas-trust-portal/
gsutil web set -m index.html -e 404.html gs://atlas-trust-portal/
```

Hoặc GitHub Pages:

```bash
# Push to gh-pages branch
git subtree push --prefix trust-portal origin gh-pages
```

## Update frequency

- JWKS: Realtime (API-backed)
- SBOM: Mỗi release
- Provenance: Mỗi deploy
- Gates: Mỗi CI run
- SLO: Mỗi giờ (automated)

---

**URL**: https://trust.atlas.example  
**Trạng thái**: Stub - skeleton only
