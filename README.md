# sih2026-ddos

## Dataset replay

The simulator can run on real benchmark records instead of synthetic values.
NSL-KDD and UNSW-NB15 bundles ship in `public/data/datasets/`.

To add another dataset, download its CSV and run:

```bash
node scripts/prepare-dataset.mjs --dataset cic-ids2017 --name "CIC-IDS2017" --input path/to/file.csv
```

Notes on fidelity: attack categories, protocols, services, byte counts and
error rates are real record values. Aggregate request rates are scaled onto
the dashboard's display range, because these are per-connection record
datasets rather than per-second captures. Source IP addresses are synthesized
— these datasets are feature-extracted and contain no addresses.

CAIDA DDoS 2007 is restricted-licence and is deliberately never bundled.
