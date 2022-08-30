import { Indexer } from '@ckb-lumos/ckb-indexer';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

type HexNum = string;
type IOType = 'input' | 'output' | 'both';
type Bytes32 = string;

type SucceedJSONRPCResponse<T> = { jsonrpc: string; id: HexNum; result: T };
type FailedJSONRPCResponse = { jsonrpc: string; id: HexNum; error: { message: string; code: number } };
export type JSONRPCResponse<T> = SucceedJSONRPCResponse<T> | FailedJSONRPCResponse;

export type GetTransactionsResult = {
  blockNumber: HexNum;
  ioIndex: HexNum;
  ioType: IOType;
  txHash: Bytes32;
  txIndex: HexNum;
};

export type IndexerIterableResult<T> = {
  lastCursor: string;
  objects: T[];
};

type ScriptType = 'lock' | 'type';
type ScriptHashType = 'type' | 'data' | 'data1';
export type Script = {
  codeHash: Bytes32;
  args: string;
  hashType: ScriptHashType;
};

type Uint64 = string;
type BlockNumber = string;

export type SearchKeyFilter = {
  script?: Script;
  outputDataLenRange?: [Uint64, Uint64];
  outputCapacityRange?: [Uint64, Uint64];
  blockRange?: [BlockNumber, BlockNumber];
};

export type SearchKey = {
  script: Script;
  scriptType: ScriptType;
  filter?: SearchKeyFilter;
};

export type GetTransactionParams = {
  searchKey: SearchKey;
  order?: 'asc' | 'desc';
  limit?: string;
  cursor?: string;
};

export class CKBIndexerClient extends Indexer {
  constructor(url: string) {
    super(url, '');
  }

  async getTransactions2(params: GetTransactionParams): Promise<IndexerIterableResult<GetTransactionsResult>> {
    const result = await this.getTransactions(params.searchKey, {
      order: params.order,
      sizeLimit: Number(params.limit),
      lastCursor: params.cursor,
    });
    return result as any as IndexerIterableResult<GetTransactionsResult>;
  }
}
