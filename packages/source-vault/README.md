# @build-these/source-vault

Prototype for “source control beyond Git”: keep one repo-shaped workspace while declaring private paths that are encrypted in the shareable manifest.

```bash
source-vault ./example ./vault.policy.json
```

This MVP proves the primitive: policy-based path visibility + authenticated encryption records. Next steps would be Git/JJ integration, recipient keys, and private subtree ACLs.
