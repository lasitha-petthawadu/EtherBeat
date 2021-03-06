import * as Web3 from "web3";
import * as gremlin from "gremlin";
import web3 from "../config/web3conn";
import * as incercepts from "../abi/intercept";

const client = gremlin.createClient();
const tt = gremlin.makeTemplateTag(client);

export class Account {
    id: string;
    address: string;
    abiInterface: string;

    constructor(address: string, abiInterface?: string) {
        this.address = address;
        this.abiInterface = abiInterface;
    }

    balance() {
        const balance = web3.eth.getBalance(this.address);
        return balance.toString(10);
    }

    storage() {
        return web3.eth.getStorageAt(this.address, 0);
    }

    code() {
        return web3.eth.getCode(this.address);
    }

    source() {
        // TODO
        return "";
    }

    creator() {
        return tt`g.V().hasLabel('account').has('addr', ${this.address}).in().has('type', 'create').in('from').values('addr')`
            .then((results) => {
                return results[0];
            })
            .catch((err) => {
                console.log(err);
                // TODO Something went wrong
            });
    }

    transactions({ page, size }: { page: number, size: number }) {
        return tt`g.V().hasLabel('account').has('addr', ${this.address}).both().hasLabel('tx').range(${(page - 1) * size}, ${page * size}).values('hash')`
            .then((results: string[]) => {
                const lss: Transaction[] = [];

                for (const entry of results) {
                    lss.push(new Transaction(entry));
                }

                return lss;
            })
            .catch((err) => {
                console.log(err);
                // TODO Something went wrong
            });
    }

    parameters({ jsonAbi }: { jsonAbi: string }) {
        // https://ropsten.etherscan.io/address/0xf7d93bcb8e4372f46383ecee82f9adf1aa397ba9#readContract
        const ab = new incercepts.AbiContract(this.address, jsonAbi);
        return JSON.stringify(ab.getContractProperties());
    }
}

export class Transaction {
    transaction: Web3.TransactionObject;
    hash: string;
    nonce: number;
    blockHash: string;
    blockNumber: number;
    transactionIndex: number;
    value: string;
    gasPrice: string;
    gas: number;
    input: string;
    data: string;

    constructor(hash: string) {
        this.hash = hash;
        this.transaction = web3.eth.getTransaction(hash);

        this.nonce = this.transaction.nonce;
        this.blockHash = this.transaction.blockHash;
        this.blockNumber = this.transaction.blockNumber;
        this.transactionIndex = this.transaction.transactionIndex;
        this.value = this.transaction.value.toString(10);
        this.gasPrice = this.transaction.gasPrice.toString(10);
        this.gas = this.transaction.gas;
        this.input = this.transaction.input;
        this.data = this.transaction.data;
    }

    from() {
        return new Account(this.transaction.from);
    }

    to() {
        return new Account(this.transaction.to);
    }

}