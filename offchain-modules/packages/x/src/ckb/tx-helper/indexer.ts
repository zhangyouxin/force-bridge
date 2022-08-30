import { Cell, Hexadecimal, HexNumber, HexString, OutPoint, Script } from '@ckb-lumos/base';
import { Indexer } from '@ckb-lumos/ckb-indexer';

export class CkbIndexer extends Indexer {
  constructor(ckbRpcUrl: string, ckbIndexerUrl: string) {
    super(ckbIndexerUrl, ckbRpcUrl);
  }
  async getCells2(
    searchKey: SearchKey,
    terminator?: Terminator,
    { sizeLimit = 0x100, order = Order.asc }: { sizeLimit?: number; order?: Order } = {},
  ): Promise<Cell[]> {
    const result = await super.getCells(searchKey, terminator, { sizeLimit, order });
    return result.objects;
  }

  async getTransactions2(
    searchKey: SearchKey,
    { sizeLimit = 0x100, order = Order.asc }: { sizeLimit?: number; order?: Order } = {},
  ): Promise<GetTransactionsResult[]> {
    const result = await super.getTransactions(searchKey, { sizeLimit, order });
    return result.objects;
  }
}

// function toCamel(s) {
//   return s.replace(/([-_][a-z])/gi, ($1) => {
//     return $1.toUpperCase().replace('-', '').replace('_', '');
//   });
// }

// function toSnake(s) {
//   return s.replace(/([a-z][A-Z])/g, ($1) => {
//     return `${$1.charAt(0)}_${$1.charAt(1).toLowerCase()}`;
//   });
// }

// function deepCamel(data) {
//   return deepTransform(toCamel)(data);
// }

// function deepSnake(data) {
//   return deepTransform(toSnake)(data);
// }

// function deepTransform(transformFunction) {
//   return (data) => {
//     if (Object.prototype.toString.call(data) === '[object Array]') {
//       if (data.length === 0) {
//         return data;
//       } else {
//         return data.map((item) => deepTransform(transformFunction)(item));
//       }
//     }
//     const result = {};
//     if (Object.prototype.toString.call(data) === '[object Object]') {
//       for (const key in data) {
//         const value = data[key];
//         if (
//           Object.prototype.toString.call(value) === '[object Object]' ||
//           Object.prototype.toString.call(value) === '[object Array]'
//         ) {
//           result[transformFunction(key)] = deepTransform(transformFunction)(value);
//         } else {
//           result[transformFunction(key)] = value;
//         }
//       }
//       return result;
//     }
//     return data;
//   };
// }

export enum ScriptType {
  type = 'type',
  lock = 'lock',
}

export enum Order {
  asc = 'asc',
  desc = 'desc',
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];

export interface SearchKey {
  script: Script;
  scriptType: ScriptType;
  filter?: {
    script?: Script;
    outputDataLenRange?: HexadecimalRange;
    outputCapacityRange?: HexadecimalRange;
    blockRange?: HexadecimalRange;
  };
}

export interface GetLiveCellsResult {
  lastCursor: string;
  objects: IndexerCell[];
}

export interface IndexerCell {
  blockNumber: Hexadecimal;
  outPoint: OutPoint;
  output: {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
  outputData: HexString;
  txIndex: Hexadecimal;
}

export interface TerminatorResult {
  stop: boolean;
  push: boolean;
}

export declare type Terminator = (index: number, cell: Cell) => TerminatorResult;

const DefaultTerminator: Terminator = (_index, _cell) => {
  return { stop: false, push: true };
};

export type HexNum = string;
export type IOType = 'input' | 'output' | 'both';
export type Bytes32 = string;
export type GetTransactionsResult = {
  blockNumber: HexNum;
  ioIndex: HexNum;
  ioType: IOType;
  txHash: Bytes32;
  txIndex: HexNum;
};
export interface GetTransactionsResults {
  lastCursor: string;
  objects: GetTransactionsResult[];
}

// export class CkbIndexer implements Indexer {
//   uri: string;

//   constructor(public ckbRpcUrl: string, public ckbIndexerUrl: string) {
//     this.uri = ckbRpcUrl;
//   }

//   getCkbRpc(): RPC {
//     return new RPC(this.ckbRpcUrl);
//   }

//   async tip(): Promise<Tip> {
//     const res = await this.request('get_tip');
//     return deepCamel(res) as Tip;
//   }

//   async waitForSync(blockDifference = 0): Promise<void> {
//     const rpcTipNumber = parseInt((await this.getCkbRpc().getTipHeader()).number, 16);
//     logger.debug('rpcTipNumber', rpcTipNumber);
//     let index = 0;
//     while (true) {
//       const tip = await this.tip();
//       logger.debug('tip is: ', tip);
//       const indexerTipNumber = parseInt(tip.blockNumber, 16);
//       logger.debug('indexerTipNumber', indexerTipNumber);
//       if (indexerTipNumber + blockDifference >= rpcTipNumber) {
//         return;
//       }
//       logger.debug(`wait until indexer sync. index: ${index++}`);
//       await asyncSleep(1000);
//     }
//   }

//   /*
//    * Addtional note:
//    * Only accept lock and type parameters as `Script` type, along with `data` field in QueryOptions. Use it carefully!
//    * */
//   collector(queries: QueryOptions): CellCollector {
//     const { lock, type } = queries;
//     let searchKey: SearchKey;
//     if (lock !== undefined) {
//       searchKey = {
//         script: lock as Script,
//         scriptType: ScriptType.lock,
//       };
//       if (type != undefined && type !== 'empty') {
//         searchKey.filter = {
//           script: type as Script,
//         };
//       }
//     } else {
//       if (type != undefined && type != 'empty') {
//         searchKey = {
//           script: type as Script,
//           scriptType: ScriptType.type,
//         };
//       } else {
//         throw new Error(
//           `should specify either type or lock in queries, queries now: ${JSON.stringify(queries, null, 2)}`,
//         );
//       }
//     }
//     const queryData = queries.data || '0x';
//     const request = this.request;
//     const ckbIndexerUrl = this.ckbIndexerUrl;
//     return {
//       collect(): CellCollectorResults {
//         return {
//           async *[Symbol.asyncIterator]() {
//             const order = 'asc';
//             const sizeLimit = 100;
//             let cursor = null;
//             for (;;) {
//               logger.debug('searchKey', searchKey);
//               const params = [deepSnake(searchKey), order, `0x${sizeLimit.toString(16)}`, cursor];
//               logger.debug('getCells params', params);
//               const res = deepCamel(await request('get_cells', params, ckbIndexerUrl));
//               const liveCells = res.objects;
//               cursor = res.last_cursor;
//               for (const cell of liveCells) {
//                 if (queryData === 'any' || queryData === cell.output_data) {
//                   yield {
//                     cellOutput: cell.output,
//                     data: cell.output_data,
//                     outPoint: cell.outPoint,
//                     blockNumber: cell.blockNumber,
//                   };
//                 }
//               }
//               if (liveCells.length < sizeLimit) {
//                 break;
//               }
//             }
//           },
//         };
//       },
//     };
//   }

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
//   public async request(method: string, params?: any, ckbIndexerUrl: string = this.ckbIndexerUrl): Promise<any> {
//     const data = {
//       id: 0,
//       jsonrpc: '2.0',
//       method,
//       params,
//     };
//     const res = await axios.post(ckbIndexerUrl, data);
//     if (res.status !== 200) {
//       throw new Error(`indexer request failed with HTTP code ${res.status}`);
//     }
//     if (res.data.error !== undefined) {
//       throw new Error(`indexer request rpc failed with error: ${JSON.stringify(res.data.error)}`);
//     }
//     return res.data.result;
//   }

//   /* getCells example

// search_key:
//     script - Script
//     scrip_type - enum, lock | type
//     filter - filter cells by following conditions, all conditions are optional
//         script: if search script type is lock, filter cells by type script prefix, and vice versa
//         outputDataLenRange: [u64; 2], filter cells by output data len range, [inclusive, exclusive]
//         outputCapacityRange: [u64; 2], filter cells by output capacity range, [inclusive, exclusive]
//         blockRange: [u64; 2], filter cells by block number range, [inclusive, exclusive]
// order: enum, asc | desc
// limit: result size limit
// after_cursor: pagination parameter, optional

// $ echo '{
//   "id": 2,
//   "jsonrpc": "2.0",
//   "method": "getCells",
//   "params": [
//       {
//           "filter": {
//             "script": {
//               "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//               "hashType": "type",
//               "args": "0x838e79dcef9cbf819a32778c8cfcc81bb2555561"
//             }
//           },
//           "script": {
//             "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
//             "hashType": "type",
//             "args": "0x4580e3fd3a6623eb26f229239286cee63e18bcafb38bc6c5d0de5a8c587647c2"
//           },
//           "scriptType": "type"
//       },
//       "asc",
//       "0x1"
//   ]
// }' | tr -d '\n' | curl -H 'content-type: application/json' -d @- https://testnet.ckbapp.dev/indexer | jq .

//  {
//   "jsonrpc": "2.0",
//   "result": {
//     "last_cursor": "0x60c5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4014580e3fd3a6623eb26f229239286cee63e18bcafb38bc6c5d0de5a8c587647c200000000001ad3100000000200000004",
//     "objects": [
//       {
//         "blockNumber": "0x1ad310",
//         "outPoint": {
//           "index": "0x4",
//           "txHash": "0x6d24e50d5b46fca3f48283664453bc061744b34e03159571de4893b9640b14d5"
//         },
//         "output": {
//           "capacity": "0x6fc23ac00",
//           "lock": {
//             "args": "0x838e79dcef9cbf819a32778c8cfcc81bb2555561",
//             "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//             "hashType": "type"
//           },
//           "type": {
//             "args": "0x4580e3fd3a6623eb26f229239286cee63e18bcafb38bc6c5d0de5a8c587647c2",
//             "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
//             "hashType": "type"
//           }
//         },
//         "output_data": "0x01000000000000000000000000000000",
//         "tx_index": "0x2"
//       }
//     ]
//   },
//   "id": 2
// }
// */

//   public async getCells(
//     searchKey: SearchKey,
//     terminator: Terminator = DefaultTerminator,
//     { sizeLimit = 0x100, order = Order.asc }: { sizeLimit?: number; order?: Order } = {},
//   ): Promise<Cell[]> {
//     const infos: Cell[] = [];
//     let cursor: string | undefined;
//     const index = 0;
//     while (true) {
//       const params = [deepSnake(searchKey), order, `0x${sizeLimit.toString(16)}`, cursor];
//       const res: GetLiveCellsResult = deepCamel(await this.request('get_cells', params));
//       const liveCells = res.objects;
//       cursor = res.lastCursor;
//       logger.debug('liveCells', liveCells[liveCells.length - 1]);
//       for (const liveCell of liveCells) {
//         const cell: Cell = {
//           cellOutput: liveCell.output,
//           data: liveCell.outputData,
//           outPoint: liveCell.outPoint,
//           blockNumber: liveCell.blockNumber,
//         };
//         const { stop, push } = terminator(index, cell);
//         if (push) {
//           infos.push(cell);
//         }
//         if (stop) {
//           return infos;
//         }
//       }
//       if (liveCells.length < sizeLimit) {
//         break;
//       }
//     }
//     return infos;
//   }

//   public async getTransactions(
//     searchKey: SearchKey,

//     { sizeLimit = 0x100, order = Order.asc }: { sizeLimit?: number; order?: Order } = {},
//   ): Promise<GetTransactionsResult[]> {
//     let infos: GetTransactionsResult[] = [];
//     let cursor: string | undefined;
//     for (;;) {
//       const params = [deepSnake(searchKey), order, `0x${sizeLimit.toString(16)}`, cursor];
//       const res: GetTransactionsResults = deepCamel(await this.request('get_transactions', params));
//       const txs = res.objects;
//       cursor = res.lastCursor;
//       infos = infos.concat(txs);
//       if (txs.length < sizeLimit) {
//         break;
//       }
//     }
//     return infos;
//   }

//   running(): boolean {
//     return true;
//   }

//   start(): void {
//     logger.debug('ckb indexer start');
//   }

//   startForever(): void {
//     logger.debug('ckb indexer startForever');
//   }

//   stop(): void {
//     logger.debug('ckb indexer stop');
//   }

//   //  eslint-disable-next-line @typescript-eslint/no-unused-vars
//   subscribe(queries: QueryOptions): NodeJS.EventEmitter {
//     throw new Error('unimplemented');
//   }

//   subscribeMedianTime(): NodeJS.EventEmitter {
//     throw new Error('unimplemented');
//   }
// }
