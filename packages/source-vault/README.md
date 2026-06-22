# @build-these/source-vault

[![CI](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml/badge.svg)](https://github.com/mcarvalho21/theo-build-these/actions/workflows/ci.yml)

Prototype for “source control beyond Git”: keep one repo-shaped workspace while declaring private paths that are encrypted in the shareable manifest.

```bash
SOURCE_VAULT_SECRET='use-a-real-secret-outside-demo' source-vault ./examples/repo ./examples/vault.policy.json
```

## MVP features

- Path policy with `public`, `private`, and `default` visibility.
- Private rules can include recipient/access metadata, e.g. `{ "glob": ".env*", "recipients": ["ops"], "label": "runtime-env" }`.
- Private file contents are encrypted with AES-256-GCM and authenticated with the file path as AAD.
- Manifest entries include a content hash plus an `access` block with the policy id, matching rule, label, and recipient public-key metadata.
- Public files can still be made share-safe with redaction rules before manifest emission.

## Policy sketch

```json
{
  "id": "demo-vault-policy",
  "private": [
    { "glob": ".env*", "recipients": ["ops"], "label": "runtime-env" },
    { "glob": "secrets/**", "recipients": ["security"], "label": "secret-material" }
  ],
  "public": ["secrets/README.md"],
  "recipients": {
    "ops": { "kid": "age1ops-public-key" },
    "security": { "kid": "age1security-public-key" }
  },
  "redact": [
    {
      "glob": "docs/**",
      "patterns": [{ "pattern": "token=[A-Za-z0-9_-]+", "replacement": "token=[REDACTED]" }]
    }
  ],
  "default": "public"
}
```

This is still a prototype: the demo secret is symmetric and recipient keys are metadata only. Next steps would be Git/JJ integration, envelope encryption per recipient, and private subtree ACL enforcement.
