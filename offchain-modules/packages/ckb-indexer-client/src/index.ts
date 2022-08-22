import axios, { AxiosInstance, AxiosResponse } from 'axios';

type HexNum = string;
type IOType = 'input' | 'output';
type Bytes32 = string;

type SucceedJSONRPCResponse<T> = { jsonrpc: string; id: HexNum; result: T };
type FailedJSONRPCResponse = { jsonrpc: string; id: HexNum; error: { message: string; code: number } };
export type JSONRPCResponse<T> = SucceedJSONRPCResponse<T> | FailedJSONRPCResponse;

export type GetTransactionsResult = {
  blockNumber: HexNum;
  io_index: HexNum;
  io_type: IOType;
  txHash: Bytes32;
  tx_index: HexNum;
};

export type IndexerIterableResult<T> = {
  last_cursor: string;
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

export class CKBIndexerClient {
  readonly agent: AxiosInstance;

  constructor(url: string) {
    this.agent = axios.create({ baseURL: url });
  }

  async request<Res, Param = unknown>({
    id = '0',
    method,
    params,
  }: {
    id?: string;
    method: string;
    params: Param;
  }): Promise<Res> {
    const data = { jsonrpc: '2.0', id, method, params };
    const config = { headers: { 'content-type': 'application/json' } };

    const res: AxiosResponse<JSONRPCResponse<Res>> = await this.agent.post('', data, config);

    if ('error' in res.data) {
      throw new Error('[indexer-rpc]:' + res.data.error.message);
    }

    return res.data.result;
  }

  getTransactions(params: GetTransactionParams): Promise<IndexerIterableResult<GetTransactionsResult>> {
    return this.request({
      method: 'getTransactions',
      params: [params.searchKey, params.order || 'asc', params.limit || '0x64', params.cursor || null],
    });
  }
}
