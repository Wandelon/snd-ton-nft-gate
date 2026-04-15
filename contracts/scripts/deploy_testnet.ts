import 'dotenv/config';
import { Address } from '@ton/core';
import { NetworkProvider, compile } from '@ton/blueprint';

import { Factory } from '../wrappers/Factory';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export async function run(provider: NetworkProvider) {
  const owner = provider.sender().address;
  if (!owner) throw new Error('Sender address not available. Configure blueprint wallet/sender.');

  const existingCollection = process.env.EXISTING_COLLECTION
    ? Address.parse(process.env.EXISTING_COLLECTION)
    : owner; // placeholder; MUST be changed post-deploy via SetCollection

  await compile('snd_factory');

  const factory = provider.open(
    Factory.createFromConfig(
      {
        owner,
        collection: existingCollection
      },
      await provider.compile('snd_factory')
    )
  );

  await factory.sendDeploy(provider.sender(), provider.network() === 'mainnet' ? 0.2 : 0.05);
  await provider.waitForDeploy(factory.address);

  provider.ui().write(`Factory deployed at: ${factory.address.toString()}`);
  provider.ui().write(`Owner: ${owner.toString()}`);
  provider.ui().write(`Collection (initial): ${existingCollection.toString()}`);
  provider.ui().write(`Set EXISTING_COLLECTION in .env for real target.`);
}

