# Mini Michael Image Library — agent selection guide

Base URL: `https://minimemichael.web.app`

Use this library when an authorized Mike-owned content workflow needs a Mini Michael mascot illustration. These are transparent PNG illustrations, not product screenshots or factual proof.

## Machine-readable endpoints

- Full library envelope and facets: `/image-library.json`
- One JSON object per line: `/image-library.ndjson`
- Per-record JSON Schema: `/image-library.schema.json`
- Backward-compatible asset array: `/assets.json`
- This guide: `/IMAGE_LIBRARY_FOR_AGENTS.md`
- Short agent discovery file: `/llms.txt`
- Live archive status: `https://firestore.googleapis.com/v1/projects/minimemichael/databases/(default)/documents/assetOverrides`

Absolute example: `https://minimemichael.web.app/image-library.json`

## Selection algorithm

1. Fetch `/image-library.json` or stream `/image-library.ndjson`.
2. Fetch the live status `assetOverrides` collection. Every document whose `fields.hidden.booleanValue` is `true` is archived. Exclude its document ID and every record whose `duplicateOf` equals that ID.
3. Filter to `isCanonical === true`. The other 75 records are exact-file aliases retained for old filenames.
4. Use `collectionId=v2-designs` when the brief requests the new V2 Designs; otherwise search both collections.
5. Match the content brief against `useWhen`, `useCases`, `description`, `visibleText`, `keywords`, `subjects`, `actions`, `objects`, and `mood`.
6. Gate the choice using `audience`, `tone`, `placement`, `contentTypes`, and `avoidWhen`.
7. Prefer one semantic hero/problem/solution image. Add no more than two `accent` or `signoff` images.
8. Use `absoluteUrl` as the source and `altText` as the default accessible description.
9. If the content needs exact UI, product, customer, event, or performance proof, use a real screenshot/reference asset instead of Mini Michael.

## Live status and archive semantics

- `assetOverrides/{assetId}` is the owner-controlled live status overlay.
- `hidden: true` means the canonical asset is archived and must not be selected. Exact aliases pointing to it through `duplicateOf` are archived too.
- Archive is immediate and reversible. Source bytes and static metadata stay present until a later verified hard-prune deploy.
- If the live status request fails, do not silently select from stale static metadata. Report the status check failure or ask for approval to use the deploy-time catalog.

## Important fields

- `id`: stable library identifier.
- `isCanonical`: preferred searchable record. Default `true` filter.
- `duplicateOf`: canonical ID for an exact duplicate alias.
- `title`: human-readable visual title.
- `description`: literal visual description.
- `altText`: concise accessibility text ready for publishing.
- `useWhen`: short intent-selection sentence.
- `avoidWhen`: tone/safety mismatch warning.
- `useCases`: concrete content concepts.
- `keywords`: precise search terms; pack coordinates and numeric crop IDs are removed.
- `subjects`, `actions`, `objects`, `mood`: visual facets.
- `contentTypes`: supported surfaces such as `social-post`, `email`, or `presentation`.
- `tone`: one controlled tone value.
- `audience`: allowed `public`, `client`, and/or `internal` context.
- `placement`: `hero`, `problem`, `solution`, `accent`, `signoff`, `section-break`, or `fallback`.
- `orientation`, `width`, `height`, `dominantColors`: layout hints.
- `sha256`: exact-byte identity; use it to detect duplicates or stale downloads.
- `collectionId`, `collectionLabel`, `designVersion`: distinguish the legacy V1 library from `V2 Designs`.
- `visibleText`: exact text recognized in the image; searchable and suitable for meme/caption matching.
- `sourceFilename`, `sourceSha256`, `backgroundRemoval`: provenance for the immutable generated input and transparent processed output.

## Minimal Python selection example

```python
import requests

library = requests.get(
    "https://minimemichael.web.app/image-library.json",
    timeout=30,
).json()

status = requests.get(
    "https://firestore.googleapis.com/v1/projects/minimemichael/databases/(default)/documents/assetOverrides",
    timeout=30,
).json()
archived = {
    document["name"].rsplit("/", 1)[-1]
    for document in status.get("documents", [])
    if document.get("fields", {}).get("hidden", {}).get("booleanValue") is True
}

query_terms = {"approval", "paperwork", "blocked"}
candidates = [
    asset for asset in library["assets"]
    if asset["isCanonical"]
    and asset["id"] not in archived
    and asset.get("duplicateOf") not in archived
    and "public" in asset["audience"]
    and query_terms.intersection(asset["keywords"] + asset["useCases"])
]

# Rank semantically; then read useWhen and avoidWhen before choosing.
chosen = candidates[0]
print(chosen["absoluteUrl"], chosen["altText"])
```

## Content safety

- Rights statement lives at `library.rights` in `/image-library.json`.
- Do not imply the cartoon is a real photograph, factual screenshot, customer result, or third-party endorsement.
- Do not select only by category. Read the per-image visual metadata.
- Avoid playful/internal images for legal, HR-sensitive, serious customer-impacting, grief, health, or safety-critical content unless Mike explicitly chooses that tone.
- Public content should use `altText`; do not expose local paths, hashes, or internal filenames in visible copy.
