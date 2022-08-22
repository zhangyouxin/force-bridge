import { Script as PWScript, HashType } from '@lay2/pw-core';

type IndexerScript = {
  codeHash: string;
  args: string;
  hashType: 'data' | 'type' | 'data1';
};

type ScriptLikeTypes = ScriptLike | CKBComponents.Script | PWScript | IndexerScript;

export class ScriptLike {
  constructor(public codeHash: string, public args: string, public hashType: 'data' | 'type' | 'data1') {}

  static isCKBComponentScript(script: ScriptLikeTypes): script is CKBComponents.Script {
    return 'codeHash' in script && 'args' in script && 'hashType' in script;
  }

  static isPWScript(script: ScriptLikeTypes): script is PWScript {
    return script instanceof PWScript;
  }

  static isIndexerScript(script: ScriptLikeTypes): script is IndexerScript {
    return 'codeHash' in script && 'args' in script && 'hashType' in script;
  }

  static from(script: ScriptLikeTypes): ScriptLike {
    return new ScriptLike(script.codeHash, script.args, script.hashType);
  }

  equals(script: ScriptLikeTypes): boolean {
    const { codeHash, args, hashType } = this;
    return codeHash === script.codeHash && args === script.args && hashType === script.hashType;
  }

  toCKBComponentScript(): CKBComponents.Script {
    return { codeHash: this.codeHash, args: this.args, hashType: this.hashType };
  }

  toPWScript(): PWScript {
    return new PWScript(this.codeHash, this.args, this.hashType === 'type' ? HashType.type : HashType.data);
  }

  toIndexerScript(): IndexerScript {
    return { codeHash: this.codeHash, args: this.args, hashType: this.hashType };
  }
}
