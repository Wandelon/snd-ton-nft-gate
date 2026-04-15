import "@stdlib/deploy";

// Factory that forwards mint requests to an existing NFT collection.
//
// IMPORTANT:
// - Different NFT collections use different mint message formats.
// - This contract intentionally forwards an arbitrary body (provided by UI/off-chain builder)
//   to the configured collection address.
// - Access-gate enforcement is done in the frontend (wallet holdings check).

// Internal opcodes (must match wrappers/Factory.ts)
const OP_SET_OWNER: Int = 0x5c7d9a11;
const OP_SET_COLLECTION: Int = 0x2f4f5f6a;
const OP_FORWARD: Int = 0x6a21b4d1;

message(OP_SET_OWNER) SetOwner {
  owner: Address;
}

message(OP_SET_COLLECTION) SetCollection {
  collection: Address;
}

message(OP_FORWARD) ForwardToCollection {
  value: Int as coins;
  body: Cell;
}

contract Factory with Deployable {
  owner: Address;
  collection: Address;

  init(owner: Address, collection: Address) {
    self.owner = owner;
    self.collection = collection;
  }

  receive(msg: SetOwner) {
    require(sender() == self.owner, "only owner");
    self.owner = msg.owner;
  }

  receive(msg: SetCollection) {
    require(sender() == self.owner, "only owner");
    self.collection = msg.collection;
  }

  receive(msg: ForwardToCollection) {
    // Anyone can call; the UI acts as access gate.
    // You can restrict to owner if needed:
    // require(sender() == self.owner, "only owner");
    send(SendParameters{
      to: self.collection,
      value: msg.value,
      bounce: true,
      mode: 0,
      body: msg.body
    });
  }

  get fun getOwner(): Address { return self.owner; }
  get fun getCollection(): Address { return self.collection; }
}

