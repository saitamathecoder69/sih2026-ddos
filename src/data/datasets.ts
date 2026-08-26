export type DatasetAccessType = 'free' | 'academic' | 'restricted';

export interface DatasetReplay {
  available: boolean;
  bundlePath?: string;
  note?: string;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  link: string;
  accessType: DatasetAccessType;
  accessNote: string;
  citationRequired?: boolean;
  replay: DatasetReplay;
}

export const DATASETS: DatasetInfo[] = [
  {
    id: 'cicddos2019',
    name: 'CICDDoS2019',
    description: 'Labeled reflection and exploitation DDoS attack traffic (PortMap, NetBIOS, LDAP, MSSQL, UDP, SYN floods, and more) alongside benign traffic.',
    link: 'https://www.unb.ca/cic/datasets/ddos-2019.html',
    accessType: 'free',
    accessNote: 'Free, direct download, cite the dataset + paper',
    citationRequired: true,
    replay: { available: false, note: 'Run scripts/prepare-dataset.mjs on the downloaded CSV to enable replay.' },
  },
  {
    id: 'cic-ids2017',
    name: 'CIC-IDS2017',
    description: 'Five days of labeled benign and common attack traffic (Brute Force, Heartbleed, Botnet, DoS, DDoS, Web, Infiltration) with extracted flow features.',
    link: 'https://www.unb.ca/cic/datasets/ids-2017.html',
    accessType: 'free',
    accessNote: 'Free, direct download',
    replay: { available: false, note: 'Run scripts/prepare-dataset.mjs on the downloaded CSV to enable replay.' },
  },
  {
    id: 'cse-cic-ids2018',
    name: 'CSE-CIC-IDS2018',
    description: 'Large-scale collaborative dataset (CSE + CIC) covering the same attack families as CIC-IDS2017 across a more diverse, multi-victim network topology.',
    link: 'https://www.unb.ca/cic/datasets/ids-2018.html',
    accessType: 'free',
    accessNote: 'Free, direct download',
    replay: { available: false, note: 'Run scripts/prepare-dataset.mjs on the downloaded CSV to enable replay.' },
  },
  {
    id: 'caida-ddos-2007',
    name: 'CAIDA "DDoS Attack 2007"',
    description: 'Anonymized packet traces of a ~1-hour DDoS attack that saturated a target network’s access link, widely used as a classical volumetric-attack reference.',
    link: 'https://www.caida.org/catalog/datasets/ddos-20070804_dataset/',
    accessType: 'restricted',
    accessNote: 'Restricted, request form required, 2-3 business day approval, academic/government/CAIDA-member only',
    replay: { available: false, note: 'Restricted licence — cannot be bundled.' },
  },
  {
    id: 'nsl-kdd',
    name: 'NSL-KDD',
    description: 'Refined successor to KDD Cup 1999 with duplicate records removed; 41 flow/connection features per record across normal traffic and 4 attack categories.',
    link: 'https://www.unb.ca/cic/datasets/nsl.html',
    accessType: 'free',
    accessNote: 'Free, direct download',
    replay: { available: true, bundlePath: '/data/datasets/nsl-kdd.json' },
  },
  {
    id: 'unsw-nb15',
    name: 'UNSW-NB15',
    description: 'Hybrid of real modern normal traffic and synthetically generated contemporary attack behaviors across 9 attack categories, with 49 extracted features.',
    link: 'https://research.unsw.edu.au/projects/unsw-nb15-dataset',
    accessType: 'academic',
    accessNote: 'Free for academic research, commercial use prohibited',
    replay: { available: true, bundlePath: '/data/datasets/unsw-nb15.json' },
  },
];
