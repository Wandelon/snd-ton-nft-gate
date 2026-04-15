import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type FactoryConfig = {
  owner: Address;
  collection: Address;
};

export function factoryConfigToCell(config: FactoryConfig): Cell {
  return beginCell().storeAddress(config.owner).storeAddress(config.collection).endCell();
}

export class Factory implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new Factory(address);
  }

  static createFromConfig(config: FactoryConfig, code: Cell, workchain = 0) {
    const data = factoryConfigToCell(config);
    const init = { code, data };
    return new Factory(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell()
    });
  }

  async sendSetCollection(provider: ContractProvider, via: Sender, value: bigint, collection: Address) {
    const body = beginCell()
      .storeUint(0x2f4f5f6a, 32) // op (arbitrary)
      .storeAddress(collection)
      .endCell();
    await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body });
  }

  async sendForwardToCollection(provider: ContractProvider, via: Sender, value: bigint, forwardValue: bigint, forwardBody: Cell) {
    const body = beginCell()
      .storeUint(0x6a21b4d1, 32) // op (arbitrary)
      .storeCoins(forwardValue)
      .storeRef(forwardBody)
      .endCell();
    await provider.internal(via, { value, sendMode: SendMode.PAY_GAS_SEPARATELY, body });
  }
}

