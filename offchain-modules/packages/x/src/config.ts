import { DepType, HashType, Script } from '@ckb-lumos/base';

export type forceBridgeRole = 'watcher' | 'collector' | 'verifier';

export interface ConfigItem {
  cellDep: {
    depType: DepType;
    outPoint: {
      txHash: string;
      index: string;
    };
  };
  script: {
    codeHash: string;
    hashType: HashType;
    args?: string;
  };
}

export interface MultisigItem {
  R: number;
  M: number;
  publicKeyHashes: string[];
}

export class MultiSignHost {
  address: string;
  host: string;
}

export interface CkbDeps {
  bridgeLock: ConfigItem;
  recipientType: ConfigItem;
  sudtType: ConfigItem;
  pwLock?: ConfigItem;
  omniLock?: ConfigItem;
}

export interface CkbConfig {
  ckbRpcUrl: string;
  ckbIndexerUrl: string;
  privateKey: string;
  multiSignHosts: MultiSignHost[];
  multisigScript: MultisigItem;
  ownerCellTypescript: Script;
  deps: CkbDeps;
  startBlockHeight: number;
  confirmNumber: number;
  sudtSize: number;
}

export interface EthConfig {
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
  multiSignAddresses: string[];
  multiSignHosts: MultiSignHost[];
  multiSignThreshold: number;
  confirmNumber: number;
  startBlockHeight: number;
  assetWhiteList: WhiteListEthAsset[];
}

export interface EosConfig {
  rpcUrl: string;
  chainId: string;
  bridgerAccount: string;
  bridgerAccountPermission: string;
  publicKeys: string[];
  /**
   * @deprecated migrate to {@link KeyStore}
   */
  privateKeys: string[];
  latestGlobalActionSeq: number;
  onlyWatchIrreversibleBlock: boolean;
}

export interface TronConfig {
  tronGridUrl: string;
  committee: {
    address: string;
    permissionId: string;
    keys: string[];
  };
  feeLimit: number;
}

export interface BtcConfig {
  clientParams: {
    url: string;
    user: string;
    pass: string;
    port: number;
    timeout?: number;
  };
  /**
   * @deprecated migrate to {@link KeyStore}
   */
  privateKeys: string[];
  lockAddress: string;
  startBlockHeight: number;
  confirmNumber: number;
}

export interface logConfig {
  level: string;
  logFile?: string;
  identity?: string;
}

export type ormDBType = 'mysql';

export interface ormConfig {
  type: ormDBType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  timezone: string;
  synchronize: boolean;
  logging: boolean;
}

export interface commonConfig {
  role: forceBridgeRole;
  log: logConfig;
  network: 'mainnet' | 'testnet';
  lumosConfigType: 'LINA' | 'AGGRON4' | 'DEV';
  port?: number;
  orm?: ormConfig;
  // if readonly is true, the server will not listen to chain events and update the database.
  // used for readonly watcher mode.
  readonly?: boolean;
  openMetric: boolean;
  keystorePath?: string;
  collectorPubKeyHash: string[];
}

export interface promConfig {
  metricPort: number;
}

export interface WhiteListEthAsset {
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  decimal: number;
  minimalBridgeAmount: string;
  bridgeFee: { in: string; out: string };
}

export interface collectorConfig {
  gasLimit: number;
  batchGasLimit: number;
  disableEIP1559Style?: boolean; // disable EIP1559 gas price style, default to be false
  gasPriceGweiLimit: number;
  gasPriceGweiAuto?: boolean;
  gasPriceGweiAutoSwitchKey?: string;
  maxPriorityFeePerGasGwei?: string;
  multiCellXchainType: string; // insulate multi cell when generate mint tx, Ethereum='0x01', Bsc='0x02'
  longTimePendingSeconds?: number;
  longTimePendingDiscordWebHook?: string;
}

export interface verifierEndpoint {
  name: string;
  url: string;
}

export interface feeAccounts {
  ethAddr: string;
  ckbAddr: string;
  ethThreshold: string;
  ckbThreshold: string;
}

export interface monitorConfig {
  expiredTime: number;
  expiredCheckInterval: number;
  overmintCheckInterval: number;
  discordWebHook: string;
  discordWebHookError?: string;
  scanStep: number;
  env: string;
  feeAccounts?: feeAccounts;
  verifierEndpoints?: verifierEndpoint[];
  gasPrice?: GasPriceConfig;
}

export interface AuditConfig {
  discordToken: string;
  channelId: string;
  auditThreshold: string;
  sendStatusInterval: number;
  valueAccumulateInterval: number;
}

export interface GasPriceConfig {
  averageSeconds: number;
  fetchIntervalSeconds: number;
  riseRate: number;
  continueSeconds: number;
  ethgasAPI: string;
}

export interface Config {
  common: commonConfig;
  ckb: CkbConfig;
  eth: EthConfig;
  eos: EosConfig;
  tron: TronConfig;
  btc: BtcConfig;
  collector?: collectorConfig;
  monitor?: monitorConfig;
  audit?: AuditConfig;
}
