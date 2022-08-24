import { Cell, CellProvider, Script, TransactionWithStatus } from '@ckb-lumos/base';
import { common } from '@ckb-lumos/common-scripts';
import { getConfig, Config } from '@ckb-lumos/config-manager';
import { key } from '@ckb-lumos/hd';
import { minimalCellCapacity, parseAddress, TransactionSkeletonType } from '@ckb-lumos/helpers';
import { RPC } from '@ckb-lumos/rpc';
import TransactionManager from '@ckb-lumos/transaction-manager';
import { asyncSleep, transactionSkeletonToJSON } from '../../utils';
import { logger } from '../../utils/logger';
import { IndexerCollector } from './collector';
import { CkbIndexer, ScriptType, Terminator } from './indexer';

// you have to initialize lumos config before use this generator
export class CkbTxHelper {
  ckbRpcUrl: string;
  ckbIndexerUrl: string;
  collector: IndexerCollector;
  indexer: CkbIndexer;
  ckb: RPC;
  lumosConfig: Config;
  transactionManager: TransactionManager;

  constructor(ckbRpcUrl: string, ckbIndexerUrl: string) {
    this.ckbRpcUrl = ckbRpcUrl;
    this.ckbIndexerUrl = ckbIndexerUrl;
    this.indexer = new CkbIndexer(ckbRpcUrl, ckbIndexerUrl);
    this.ckb = new RPC(ckbRpcUrl);
    this.collector = new IndexerCollector(this.indexer);
    this.lumosConfig = getConfig();
    logger.debug('lumosConfig', this.lumosConfig);
    this.transactionManager = new TransactionManager(this.indexer);
  }

  generateSecp256k1Blake160Lockscript(privateKey: string): Script {
    const publicKey = key.privateToPublic(privateKey);
    const blake160 = key.publicKeyToBlake160(publicKey);
    const script = {
      codeHash: this.lumosConfig.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
      hashType: this.lumosConfig.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
      args: blake160,
    };
    return script;
  }

  async getFromCells(lockscript: Script): Promise<Cell[]> {
    const searchKey = {
      script: lockscript,
      scriptType: ScriptType.lock,
    };
    const terminator: Terminator = (index, c) => {
      const cell = c;
      if (cell.data.length / 2 - 1 > 0 || cell.cellOutput.type) {
        return { stop: false, push: false };
      } else {
        return { stop: false, push: true };
      }
    };
    const fromCells = await this.indexer.getCells(searchKey, terminator);
    logger.debug(`fromCells: ${JSON.stringify(fromCells)}`);
    return fromCells;
  }

  async calculateCapacityDiff(txSkeleton: TransactionSkeletonType): Promise<bigint> {
    const inputCapacity = txSkeleton
      .get('inputs')
      .map((c) => BigInt(c.cellOutput.capacity))
      .reduce((a, b) => a + b, 0n);
    const outputCapacity = txSkeleton
      .get('outputs')
      .map((c) => BigInt(c.cellOutput.capacity))
      .reduce((a, b) => a + b, 0n);
    return inputCapacity - outputCapacity;
  }

  // add capacity input, change output, pay fee
  async completeTx(
    txSkeleton: TransactionSkeletonType,
    fromAddress: string,
    fromCells?: Cell[],
    feeRate = 1200n,
  ): Promise<TransactionSkeletonType> {
    logger.debug(`txSkeleton: ${transactionSkeletonToJSON(txSkeleton)}`);
    // freeze outputs
    txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
      return fixedEntries.push({
        field: 'outputs',
        index: txSkeleton.get('outputs').size - 1,
      });
    });
    // add change output
    const fromLockscript = parseAddress(fromAddress);
    const changeOutput: Cell = {
      cellOutput: {
        capacity: '0x0',
        lock: fromLockscript,
      },
      data: '0x',
    };
    const minimalChangeCellCapacity = minimalCellCapacity(changeOutput);
    changeOutput.cellOutput.capacity = `0x${minimalChangeCellCapacity.toString(16)}`;
    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push(changeOutput);
    });
    const capacityDiff = await this.calculateCapacityDiff(txSkeleton);
    logger.debug('injectCapacity params', {
      fromAddress,
      capacityDiff,
    });
    const cellProvider: CellProvider | null = txSkeleton.get('cellProvider');
    logger.debug('cellProvider is: ', cellProvider);
    if (cellProvider) {
      const collector = cellProvider.collector({
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x40dcec2ef1ffc2340ea13ff4dd9671d2f9787e95',
        },
      });
      const cells: Cell[] = [];
      for await (const cell of collector.collect()) {
        cells.push(cell);
      }
      logger.debug('cells are: ', cells);
    }
    if (capacityDiff < 0) {
      txSkeleton = await common.injectCapacity(txSkeleton, [fromAddress], -capacityDiff);
    } else {
      txSkeleton.update('outputs', (outputs) => {
        const before = BigInt(changeOutput.cellOutput.capacity);
        const after = before + capacityDiff;
        changeOutput.cellOutput.capacity = `0x${after.toString(16)}`;
        return outputs.set(outputs.size - 1, changeOutput);
      });
    }
    logger.debug(`txSkeleton: ${transactionSkeletonToJSON(txSkeleton)}`);
    logger.debug(`capacity diff: ${await this.calculateCapacityDiff(txSkeleton)}`);
    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [fromAddress], feeRate);
    logger.debug(`txSkeleton: ${transactionSkeletonToJSON(txSkeleton)}`);
    logger.debug(`final fee: ${await this.calculateCapacityDiff(txSkeleton)}`);
    await asyncSleep(1000);
    return txSkeleton;
  }

  async waitUntilCommitted(txHash: string, timeout = 120): Promise<TransactionWithStatus | null> {
    let waitTime = 0;
    for (;;) {
      const txStatus = await this.ckb.getTransaction(txHash);
      if (txStatus !== null) {
        logger.debug(`tx ${txHash}, status: ${txStatus.txStatus.status}, index: ${waitTime}`);
        if (txStatus.txStatus.status === 'committed') {
          return txStatus;
        }
      } else {
        throw new Error(`wait for ${txHash} until committed failed with null txStatus`);
      }
      waitTime += 1;
      if (waitTime > timeout) {
        logger.warn('waitUntilCommitted timeout', { txHash, timeout, txStatus });
        throw new Error(`wait for ${txHash} until committed timeout after ${timeout} seconds`);
      }
      await asyncSleep(1000);
    }
  }
}
