const { toBN, accounts, wei } = require("../../scripts/utils/utils");
const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { artifacts, web3 } = require("hardhat");
const { ecsign, pubToAddress, bufferToHex, ecrecover } = require("ethereumjs-util");
const { pack: solidityPack } = require("@ethersproject/solidity");

const ERC1155Permit = artifacts.require("ERC1155PermitMock");
const BaseProxy = artifacts.require("BaseProxy");

ERC1155Permit.numberFormat = "BigInt";
BaseProxy.numberFormat   = "BigInt";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const OWNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const name = "ERC1155Permit";
    

const toBytes32 = (arg) => {
    return web3.utils.keccak256(Buffer.from(arg, "utf8"));
}

const PERMIT_TYPEHASH = 
    toBytes32("Permit(address owner,address spender,uint256 id,uint256 value,uint256 nonce,uint256 deadline)");    

function getDomainSeparator(tokenAddress, chainId) {
    return web3.utils.keccak256(
        web3.eth.abi.encodeParameters(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
            toBytes32("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            toBytes32(name),
            toBytes32("1"),
            chainId,
            tokenAddress,
        ]
        )
    );
}

async function getApproval(token, approve, nonce, deadline, chainId) {
    const DOMAIN_SEPARATOR = getDomainSeparator(token.address, chainId);
    return web3.utils.keccak256(
        solidityPack(
            ["bytes1", "bytes1", "bytes32", "bytes32"],
            [
                "0x19",
                "0x01",
                DOMAIN_SEPARATOR,
                web3.utils.keccak256(
                    web3.eth.abi.encodeParameters(
                        ["bytes32", "address", "address", "uint256", "uint256", "uint256", "uint256"],
                        [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.id, approve.value, nonce, deadline]
                    )
                )
            ]
        )
    );
  }

describe("ERC1155Permit", () => {
    let OWNER;
    let SECOND;
    let erc1155;
    
    const reverter = new Reverter();

    before("setup", async () => {
        OWNER = await accounts(0);
        SECOND = await accounts(1);

        let _erc1155 = await ERC1155Permit.new();
        let proxy = await BaseProxy.new("0x", _erc1155.address);
        erc1155 = await ERC1155Permit.at(proxy.address);

        await reverter.snapshot();
    });

    afterEach(async () => {reverter.revert()});

    describe("init", () => {
        it("should init", async () => {
            await truffleAssert.passes(erc1155.__ERC1155PermitMock_init("http://"));
        });

        it("should not initialize twice", async () => {
            await erc1155.__ERC1155PermitMock_init("http://");
            await truffleAssert.reverts(erc1155.__ERC1155PermitMock_init("http://"), "Initializable: contract is already initialized");
        });
    });

    describe("initialized contract", () => {
        beforeEach("init and mint", async () => {
            await erc1155.__ERC1155PermitMock_init("http://");
        });

        describe("permit()", () => {
            it("permit()", async () => {
                const owner = await accounts(0);
                const spender = await accounts(1);
                const id = 1;
                const value = 100;
                const nonce = 0;
                const deadline = Date.now() + 1000;
                const chainId = await web3.eth.getChainId();

                const approve = {
                    owner: owner,
                    spender: spender,
                    id: id,
                    value: value
                }

                let msg = await getApproval(erc1155, approve, nonce, deadline, chainId);
                let { r, s, v } = ecsign(
                    Buffer.from(msg.slice(2), "hex"),
                    Buffer.from(OWNER_KEY.slice(2), "hex"), 
                );

                let pubKey = ecrecover(Buffer.from(msg.slice(2), "hex"),v,r,s);
                assert.equal(await erc1155.DOMAIN_SEPARATOR(), getDomainSeparator(erc1155.address, chainId));
                assert.equal(PERMIT_TYPEHASH, await erc1155.getPermitTypeHash());

                assert.equal(bufferToHex(pubToAddress(pubKey)), bufferToHex(Buffer.from(owner.slice(2),"hex")));

                assert.equal(await erc1155.getHashTypedDataV4(owner,spender,id,value,deadline), msg);

                await erc1155.permit(owner,spender,id,value,deadline,v,r,s);
            });

            it("should revert when deadline is outdate", async () => {
                const owner = await accounts(0);
                const spender = await accounts(1);
                const id = 1;
                const value = 100;
                const nonce = 0;
                const deadline = 1;
                const chainId = await web3.eth.getChainId();

                const approve = {
                    owner: owner,
                    spender: spender,
                    id: id,
                    value: value
                }

                let msg = await getApproval(erc1155, approve, nonce, deadline, chainId);
                let { r, s, v } = ecsign(
                    Buffer.from(msg.slice(2), "hex"),
                    Buffer.from(OWNER_KEY.slice(2), "hex"), 
                );

                await truffleAssert.reverts(erc1155.permit(owner,spender,id,value,deadline,v,r,s), "ERC1155Permit: expired deadline");
            });

            it("should revert when signer != owner", async () => {
                const owner = await accounts(0);
                const spender = await accounts(1);
                const id = 1;
                const value = 100;
                const nonce = 0;
                const deadline = Date.now() + 1000;
                const chainId = await web3.eth.getChainId();

                const approve = {
                    owner: owner,
                    spender: spender,
                    id: id,
                    value: value
                }

                let msg = await getApproval(erc1155, approve, nonce, deadline, chainId);
                let { r, s, v } = ecsign(
                    Buffer.from(msg.slice(2), "hex"),
                    Buffer.from(OWNER_KEY.slice(2), "hex"), 
                );

                await truffleAssert.reverts(erc1155.permit(spender,spender,id,value,deadline,v,r,s), "ERC1155Permit: invalid signature");
            });
        });

        describe("nonces()", () => {
            it("should correctly return nonce", async () => {
                const owner = await accounts(0);
                const spender = await accounts(1);
                const id = 1;
                const value = 100;
                const nonce = 0;
                const deadline = Date.now() + 1000;
                const chainId = await web3.eth.getChainId();

                const approve = {
                    owner: owner,
                    spender: spender,
                    id: id,
                    value: value
                }

                let msg = await getApproval(erc1155, approve, nonce, deadline, chainId);
                let { r, s, v } = ecsign(
                    Buffer.from(msg.slice(2), "hex"),
                    Buffer.from(OWNER_KEY.slice(2), "hex"), 
                );

                assert.equal("0", await erc1155.nonces(OWNER));
                await erc1155.permit(owner,spender,id,value,deadline,v,r,s);
                assert.equal("1", await erc1155.nonces(OWNER));
            });
        });
    });

});