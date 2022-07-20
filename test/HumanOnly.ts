import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { tronSign } from "./tronUtils";
import { Signer } from "./types";

describe("HumanOnly", async function () {
  let humanOnlyMock: Contract;
  let sender: Signer;
  let validator: Signer;
  let someone: Signer;
  let validBasicProof: string;
  let invalidBasicProof: string;
  let validSovereignProof: string;
  let invalidSovereignProof: string;

  before(async function () {
    sender = {
      privateKey:
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    };
    validator = {
      privateKey:
        "0x28376b117a7e6f7070a7a69cb7c7a2f583da0700d7240bffbc2ca724e787a5fa",
      address: "0x27fB77993FEe0c8c49685Ee98c0c9030017cC223",
    };
    someone = {
      privateKey:
        "0x6b337d495469fd625fd76fb9cb2f73faee65c502d369f61aba5ec7e680293492",
      address: "0xd422e8b828A82936F82c49753074E10f2b5C8011",
    };

    const randomChallenge =
      "0xef9990adc264ccc6e55bd0cfbf8dbef5177760273ee5aa3f65aae4bbb014750f";

    const timestamp = "0x623d0600"; // 2022-03-25 00:00:00Z

    validBasicProof = await generateBasicProof(
      randomChallenge,
      timestamp,
      validator
    );
    invalidBasicProof = await generateBasicProof(
      randomChallenge,
      timestamp,
      someone /* not valid validator */
    );

    validSovereignProof = await generateSovereignProof(
      randomChallenge,
      timestamp,
      sender,
      validator
    );
    invalidSovereignProof = await generateSovereignProof(
      randomChallenge,
      timestamp,
      sender,
      someone /* not valid validator */
    );
  });

  beforeEach(async function () {
    const HumanOnlyMock = await ethers.getContractFactory("HumanOnlyMock");
    humanOnlyMock = await HumanOnlyMock.deploy();
    await humanOnlyMock.deployed();
  });

  it("Should not revert when provided a valid basic PoH", async function () {
    const actionCall = await humanOnlyMock.testBasicPoH(validBasicProof);
    await expect(actionCall).to.emit(humanOnlyMock, "Success");
  });

  it("Should not revert when provided a valid sovereign PoH", async function () {
    const actionCall = await humanOnlyMock.testSovereignPoH(
      validSovereignProof
    );
    await expect(actionCall).to.emit(humanOnlyMock, "Success");
  });

  it("Should successfully revert when provided invalid basic PoH (invalid validator)", async function () {
    const actionCall = humanOnlyMock.testBasicPoH(invalidBasicProof);
    await expect(actionCall).to.be.revertedWith(
      "PoH: Invalid proof-of-humanity"
    );
  });

  it("Should successfully revert when provided invalid sovereign PoH (invalid validator)", async function () {
    const actionCall = humanOnlyMock.testSovereignPoH(invalidSovereignProof);
    await expect(actionCall).to.be.revertedWith(
      "PoH: Invalid proof-of-humanity"
    );
  });

  it("Should successfully revert when provided unseen invalid basic PoH (invalid validator)", async function () {
    const actionCall = humanOnlyMock.testBasicPoH(invalidBasicProof);
    await expect(actionCall).to.be.revertedWith(
      "PoH: Invalid proof-of-humanity"
    );
  });

  it("Should successfully revert when provided unseen invalid sovereign PoH (invalid validator)", async function () {
    const actionCall = humanOnlyMock.testSovereignPoH(invalidSovereignProof);
    await expect(actionCall).to.be.revertedWith(
      "PoH: Invalid proof-of-humanity"
    );
  });

  it("Should successfully revert when provided discarded basic PoH (already seen)", async function () {
    await humanOnlyMock.testBasicPoH(validBasicProof);
    const actionCall = humanOnlyMock.testBasicPoH(validBasicProof);
    await expect(actionCall).to.be.revertedWith(
      "PoH: Discarded proof-of-humanity"
    );
  });

  it("Should successfully revert when provided discarded sovereign PoH (already seen)", async function () {
    await humanOnlyMock.testSovereignPoH(validSovereignProof);
    const actionCall = humanOnlyMock.testSovereignPoH(validSovereignProof);
    await expect(actionCall).to.be.revertedWith(
      "PoH: Discarded proof-of-humanity"
    );
  });

  it("Should set an empty validator and revert any proofs afterwards", async function () {
    const emptyAddress = ethers.utils.getAddress(
      "0x0000000000000000000000000000000000000000"
    );

    await humanOnlyMock.setHumanityValidator(emptyAddress);

    const actionCall = humanOnlyMock.testBasicPoH(validBasicProof);
    await expect(actionCall).to.be.revertedWith("PoH: Validator is not set");
  });

  it("Should reset a validator and not revert afterwards", async function () {
    const emptyAddress = ethers.utils.getAddress(
      "0x0000000000000000000000000000000000000000"
    );

    await humanOnlyMock.setHumanityValidator(emptyAddress);
    await humanOnlyMock.setHumanityValidator(validator.address);

    const actionCall = await humanOnlyMock.testBasicPoH(validBasicProof);
    await expect(actionCall).to.emit(humanOnlyMock, "Success");
  });
});

async function generateBasicProof(
  randomChallenge: string,
  timestamp: string,
  validator: Signer
) {
  const hash = ethers.utils.keccak256(
    ethers.utils.hexConcat([randomChallenge, timestamp])
  );

  const validatorSignature = tronSign(hash, validator.privateKey);

  const proof = ethers.utils.hexConcat([
    randomChallenge,
    timestamp,
    validatorSignature,
  ]);
  return proof;
}

async function generateSovereignProof(
  randomChallenge: string,
  timestamp: string,
  sender: Signer,
  validator: Signer
) {
  const senderSignature = tronSign(randomChallenge, sender.privateKey);

  const hash = ethers.utils.keccak256(
    ethers.utils.hexConcat([randomChallenge, senderSignature, timestamp])
  );
  const validatorSignature = tronSign(hash, validator.privateKey);

  const proof = ethers.utils.hexConcat([
    randomChallenge,
    senderSignature,
    timestamp,
    validatorSignature,
  ]);
  return proof;
}
