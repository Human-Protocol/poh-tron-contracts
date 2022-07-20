import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { tronSign } from "./tronUtils";
import { Signer } from "./types";

describe("ProofofHumanityValidator", async function () {
  let proofOfHumanityValidatorMock: Contract;

  let sender: Signer;
  let validator: Signer;
  let randomChallenge: string;
  let timestamp: string;

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

    randomChallenge =
      "0xef9990adc264ccc6e55bd0cfbf8dbef5177760273ee5aa3f65aae4bbb014750f";

    timestamp = "0x623d0600"; // 2022-03-25 00:00:00Z
  });

  beforeEach(async function () {
    const ProofOfHumanityValidatorMock = await ethers.getContractFactory(
      "ProofOfHumanityValidatorMock"
    );
    proofOfHumanityValidatorMock = await ProofOfHumanityValidatorMock.deploy();
    await proofOfHumanityValidatorMock.deployed();
  });

  it("Should successfully validate a valid basic PoH", async function () {
    const hash = ethers.utils.keccak256(
      ethers.utils.hexConcat([randomChallenge, timestamp])
    );
    const validatorSignature = tronSign(hash, validator.privateKey);

    const proof = ethers.utils.hexConcat([
      randomChallenge,
      timestamp,
      validatorSignature,
    ]);

    const validationResult =
      await proofOfHumanityValidatorMock.validateBasicPoH(
        proof,
        validator.address
      );

    expect(validationResult).to.equal(true);
  });

  it("Should successfully validate a valid sovereign PoH", async function () {
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

    const validationResult =
      await proofOfHumanityValidatorMock.validateSovereignPoH(
        proof,
        validator.address
      );

    expect(validationResult).to.equal(true);
  });

  it("Should successfully split a valid basic PoH", async function () {
    const hash = ethers.utils.keccak256(
      ethers.utils.hexConcat([randomChallenge, timestamp])
    );
    const validatorSignature = tronSign(hash, validator.privateKey);

    const proof = ethers.utils.hexConcat([
      randomChallenge,
      timestamp,
      validatorSignature,
    ]);

    const splitResult = await proofOfHumanityValidatorMock.splitBasicPoH(proof);

    expect(splitResult).to.have.members([
      randomChallenge,
      timestamp,
      validatorSignature,
    ]);
  });

  it("Should successfully split a valid sovereign PoH", async function () {
    const senderSignature = tronSign(randomChallenge, sender.privateKey);

    const hash = ethers.utils.keccak256(
      ethers.utils.hexConcat([randomChallenge, timestamp])
    );
    const validatorSignature = tronSign(hash, validator.privateKey);

    const proof = ethers.utils.hexConcat([
      randomChallenge,
      senderSignature,
      timestamp,
      validatorSignature,
    ]);

    const splitResult = await proofOfHumanityValidatorMock.splitSovereignPoH(
      proof
    );

    expect(splitResult).to.have.members([
      randomChallenge,
      senderSignature,
      timestamp,
      validatorSignature,
    ]);
  });

  it("Should successfully revert when validating invalid length basic PoH", async function () {
    const splitCall =
      proofOfHumanityValidatorMock.validateBasicPoH(randomChallenge);

    await expect(splitCall).to.be.reverted;
  });

  it("Should successfully revert when validating invalid length sovereign PoH", async function () {
    const splitCall =
      proofOfHumanityValidatorMock.validateSovereignPoH(randomChallenge);

    await expect(splitCall).to.be.reverted;
  });

  it("Should successfully revert when splitting invalid length basic PoH", async function () {
    const splitCall =
      proofOfHumanityValidatorMock.splitBasicPoH(randomChallenge);

    await expect(splitCall).to.be.revertedWith("PoH: Invalid proof length");
  });

  it("Should successfully revert when splitting invalid length sovereign PoH", async function () {
    const splitCall =
      proofOfHumanityValidatorMock.splitSovereignPoH(randomChallenge);

    await expect(splitCall).to.be.revertedWith("PoH: Invalid proof length");
  });

  it("Should successfully revert when provided with an empty validator for basic PoH", async function () {
    const validProof =
      "0xef9990adc264ccc6e55bd0cfbf8dbef5177760273ee5aa3f65aae4bbb014750f623d06003dfd5be9a7a7abb1cb00df9a08286bc236f0139366cfb1faf9650ebde1c3d9fa336c3b3412d4b159044929dd9a90150a7051e601bef4871a776579c4444ef7ee1c";

    const emptyAddress = ethers.utils.getAddress(
      "0x0000000000000000000000000000000000000000"
    );
    const validateCall = proofOfHumanityValidatorMock.validateBasicPoH(
      validProof,
      emptyAddress
    );

    await expect(validateCall).to.be.revertedWith("PoH: Validator is not set");
  });

  it("Should successfully revert when provided with an empty validator for sovereign PoH", async function () {
    const validProof =
      "0xef9990adc264ccc6e55bd0cfbf8dbef5177760273ee5aa3f65aae4bbb014750f2b581cd9028d6f3d102fde2af5d31673ed1e9d7f6bf4d3068fc01649db52465937537e656bbbd90f1bf19b93b21434d9c50680d49bbd3a6a6b30c5b49d61a53f1b623d06003dfd5be9a7a7abb1cb00df9a08286bc236f0139366cfb1faf9650ebde1c3d9fa336c3b3412d4b159044929dd9a90150a7051e601bef4871a776579c4444ef7ee1c";

    const emptyAddress = ethers.utils.getAddress(
      "0x0000000000000000000000000000000000000000"
    );
    const validateCall = proofOfHumanityValidatorMock.validateSovereignPoH(
      validProof,
      emptyAddress
    );

    await expect(validateCall).to.be.revertedWith("PoH: Validator is not set");
  });
});
