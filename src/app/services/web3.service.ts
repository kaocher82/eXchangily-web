import { Injectable } from '@angular/core';
import Web3 from 'web3';
declare let window: any;
import * as Eth from 'ethereumjs-tx';
import { Signature, EthTransactionObj } from '../interfaces/kanban.interface';
import { UtilService } from './util.service';
import * as ethUtil from 'ethereumjs-util';
import Common from 'ethereumjs-common';
import KanbanTxService from './kanban.tx.service';
import { environment } from '../../environments/environment';
import BigNumber from 'bignumber.js';
import * as createHash from 'create-hash';
import base58 from 'bs58';
//import * as ethLib from 'eth-lib';
@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  constructor(private utilServ: UtilService) {
  }

  getWeb3Provider() {
    /*
    if (typeof window.web3 !== 'undefined') {
      return new Web3(window.web3.currentProvider);
    } else {
      const web3 = new Web3(Web3.givenProvider);
      return web3;
    }
    */
   const web3 = new Web3();
   return web3;
  }

  formCreateSmartContractABI(abiArray, bytecode, args) {
    console.log('abiArray=', abiArray);
    console.log('bytecode=',bytecode);
    console.log('args=',args);
    const web3 = this.getWeb3Provider();
    var MyContract = new web3.eth.Contract(abiArray);

    //const args = [123, 'My String'];
    const abi = MyContract.deploy({
        data: bytecode,
        arguments: args
    })
    .encodeABI();   

    console.log('abiiiiii==');
    console.log(abi);
    return abi;
  }


  signMessageWithPrivateKey(message: string, keyPair: any) {
    const privateKey = `0x${keyPair.privateKey.toString('hex')}`;
    const web3 = this.getWeb3Provider();

    const signMess = web3.eth.accounts.sign(message, privateKey);
    //const signMess = this.sign(message, privateKey);
    return signMess;
  }

  getTransactionHash(txhex: string) {
    const hash = ethUtil.keccak(txhex).toString('hex');
    return '0x' + hash;
  }

  async signTxWithPrivateKey(txParams: any, keyPair: any) {
    /*
    const privateKey = `0x${keyPair.privateKey.toString('hex')}`;

    console.log('in signTxWithPrivateKey');
    const web3 = this.getWeb3Provider();
    console.log('in111');
    console.log(txParams);
    console.log(privateKey);
    const signMess = await web3.eth.accounts.signTransaction(txParams, privateKey) as EthTransactionObj;
    console.log('in222');
    console.log(signMess);
    return signMess.rawTransaction;
    */
   console.log('txParams==', txParams);
    const privKey = keyPair.privateKeyBuffer;
    const EthereumTx = Eth.Transaction;
    const tx = new EthereumTx(txParams, { chain: environment.chains.ETH.chain, hardfork: environment.chains.ETH.hardfork });
    tx.sign(privKey);
    const serializedTx = tx.serialize();
    const txhex = '0x' + serializedTx.toString('hex');
    return txhex;
  }

  sendGasHex(privateKey, address, amountInBigNumber: BigNumber, nonce) {

    let gasPrice = environment.chains.KANBAN.gasPrice;
    let gasLimit = environment.chains.KANBAN.gasLimit;
    var to = address;
    if(!to) {
        return '';
    }
    const txObject = {
      to: to,
      nonce: nonce,
      value: amountInBigNumber.toNumber(),
      gas: gasLimit,
      gasPrice: gasPrice  // in wei
    };
 
 
    const customCommon = Common.forCustomChain(
       environment.chains.ETH.chain, {
            name: environment.chains.KANBAN.chain.name,
            networkId: environment.chains.KANBAN.chain.networkId,
            chainId: environment.chains.KANBAN.chain.chainId
        },
        environment.chains.ETH.hardfork,
    );
 
    const tx = new KanbanTxService(txObject, { common: customCommon });
 
    tx.sign(privateKey);
 
    const serializedTx = tx.serialize();
    const txhex = '0x' + serializedTx.toString('hex');
    return txhex;
 }

  async signAbiHexWithPrivateKey(abiHex: string, keyPair: any, address: string, nonce: number,
    value = 0, options = { gasPrice: 0, gasLimit: 0 }) {
    // console.log('abiHex before', abiHex);
    if (abiHex.startsWith('0x')) {
      abiHex = abiHex.slice(2);
    }

    let gasPrice = environment.chains.KANBAN.gasPrice;
    let gasLimit = environment.chains.KANBAN.gasLimit;
    if (options) {
      if (options.gasPrice) {
        gasPrice = options.gasPrice;
      }
      if (options.gasLimit) {
        gasLimit = options.gasLimit;
      }
    }
    // console.log('abiHex after', abiHex);

    console.log('gasPrice=', gasPrice);
    console.log('gasLimit=', gasLimit);
    const txObject = {
      to: address,
      nonce: nonce,
      data: '0x' + abiHex,
      value: value,
      gas: gasLimit,

      // coin: '0x',
      gasPrice: gasPrice  // in wei
      // gasPrice: 40  // in wei
    };

    const privKey = Buffer.from(keyPair.privateKeyHex, 'hex');

    let txhex = '';

    const customCommon = Common.forCustomChain(
      environment.chains.ETH.chain,
      {
        name: environment.chains.KANBAN.chain.name,
        networkId: environment.chains.KANBAN.chain.networkId,
        chainId: environment.chains.KANBAN.chain.chainId
      },
      environment.chains.ETH.hardfork,
    );
    const tx = new KanbanTxService(txObject, { common: customCommon });

    tx.sign(privKey);
    const serializedTx = tx.serialize();
    txhex = '0x' + serializedTx.toString('hex');
    return txhex;

    /*
    const web3 = this.getWeb3Provider();

    const signMess = await web3.eth.accounts.signTransaction(txObject, privateKey) as EthTransactionObj;
    console.log('signMess in signMessageWithPrivateKey=');
    console.log(signMess);
    return signMess.rawTransaction;   
    */
  }
  decodeParameters(types, data) {
    const web3 = this.getWeb3Provider();
    return web3.eth.abi.decodeParameters(types, data);
  }
  getFabFrozenBalanceABI(paramsArray: any) {
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': true,
      'inputs': [
        {
          'name': '_account',
          'type': 'address'
        }
      ],
      'name': 'getTotalUnreleased',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    };
    const abiHex = web3.eth.abi.encodeFunctionCall(func, paramsArray);
    return abiHex;
  }

  getFabTokenBalanceOfABI(paramsArray: any) {
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': true,
      'inputs': [
        {
          'name': 'accountOwner',
          'type': 'address'
        }
      ],
      'name': 'balanceOf',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    };
    const abiHex = web3.eth.abi.encodeFunctionCall(func, paramsArray);
    return abiHex;
  }

  getFabBalanceOfABI(paramsArray: any) {
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': true,
      'inputs': [
        {
          'name': 'accountOwner',
          'type': 'address'
        }
      ],
      'name': 'balanceOf',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    };
    const abiHex = web3.eth.abi.encodeFunctionCall(func, paramsArray);
    return abiHex;
  }

  getFabTransferABI(paramsArray: any) {
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': false,
      'inputs': [
        {
          'name': 'to',
          'type': 'address'
        },
        {
          'name': 'value',
          'type': 'uint256'
        }
      ],
      'name': 'transfer',
      'outputs': [
        {
          'name': '',
          'type': 'bool'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };
    const abiHex = web3.eth.abi.encodeFunctionCall(func, paramsArray);
    return abiHex;
  }

  getTransferFuncABIAmountBig(coin: number, address: string, amountBig: BigNumber) {
    const web3 = this.getWeb3Provider();
    let value = amountBig.toFixed();
    console.log('value for decimal=', value);
    const params = [address, coin, value, web3.utils.asciiToHex('')];

    const func = {
      'constant': false,
      'inputs': [
        {
          'name': '_to',
          'type': 'address'
        },
        {
          'name': '_coinType',
          'type': 'uint32'
        },
        {
          'name': '_value',
          'type': 'uint256'
        },
        {
          "name": "_comment",
          "type": "bytes32"
        }
      ],
      'name': 'transfer',
      'outputs': [
        {
          'name': 'success',
          'type': 'bool'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };

    const abiHex = this.getGeneralFunctionABI(func, params);

    console.log('abiHex for transfer=', abiHex);
    return abiHex;    
  }
  getTransferFuncABI(coin: number, address: string, amount: number) {
    const web3 = this.getWeb3Provider();
    let value = new BigNumber(amount).multipliedBy(new BigNumber(1e18)).toFixed();
    value = value.split('.')[0];
    console.log('value for decimal=', value);
    const params = [address, coin, value, web3.utils.asciiToHex('')];

    const func = {
      'constant': false,
      'inputs': [
        {
          'name': '_to',
          'type': 'address'
        },
        {
          'name': '_coinType',
          'type': 'uint32'
        },
        {
          'name': '_value',
          'type': 'uint256'
        },
        {
          "name": "_comment",
          "type": "bytes32"
        }
      ],
      'name': 'transfer',
      'outputs': [
        {
          'name': 'success',
          'type': 'bool'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };

    const abiHex = this.getGeneralFunctionABI(func, params);

    console.log('abiHex for transfer=', abiHex);
    return abiHex;
  }

  getDeleteOrderFuncABI(orderHash: string) {
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': false,
      'inputs': [
        {
          'name': '_orderHash',
          'type': 'bytes32'
        }
      ],
      'name': 'cancelOrder',
      'outputs': [
        {
          'name': 'success',
          'type': 'bool'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };
    const abiHex = web3.eth.abi.encodeFunctionCall(func, [orderHash]);
    return abiHex;
  }

  sha3(str: string) {
    const web3 = this.getWeb3Provider();
    return web3.utils.sha3(str);
  }

  getCreateOrderFuncABI(paramsArray: any) {
    
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': false,
      'inputs': [
        {
          'name': '_fromContract',
          'type': 'bool'
        },        
        {
          'name': '_bid',
          'type': 'bool'
        },
        {
          'name': '_baseCoin',
          'type': 'uint32'
        },
        {
          'name': '_targetCoin',
          'type': 'uint32'
        },
        {
          'name': '_amount',
          'type': 'uint256'
        },
        {
          'name': '_price',
          'type': 'uint256'
        },
        {
          'name': '_orderHash',
          'type': 'bytes32'
        }
      ],
      'name': 'createOrder',
      'outputs': [
        {
          'name': '',
          'type': 'bytes32'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };
    const abiHex = web3.eth.abi.encodeFunctionCall(func, paramsArray);
    return abiHex;
  }

  getFuncABI(func) {
    const web3 = this.getWeb3Provider();
    const abiHex = web3.eth.abi.encodeFunctionSignature(func).substring(2);
    return abiHex;
  }

  getGeneralFunctionABI(func, paramsArray) {
    const web3 = this.getWeb3Provider();
    const abiHex = web3.eth.abi.encodeFunctionCall(func, paramsArray);
    return abiHex;
  }

  getWithdrawFuncABI(coinType: number, amount: BigNumber, destAddress: string, coinTypePrefix = null) {

    // let abiHex = '3a5b6c70';

    /*
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': false,
      'inputs': [
        {
          'name': '_coinType',
          'type': 'uint32'
        },
        {
          'name': '_value',
          'type': 'uint256'
        },
        {
          'name': '',
          'type': 'bytes32'
        }
      ],
      'name': 'withdraw',
      'outputs': [
        {
          'name': 'success',
          'type': 'bool'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };
    let abiHex = web3.eth.abi.encodeFunctionSignature(func).substring(2);

    */

    let abiHex = '3295d51e';
    // console.log('abiHex there we go:' + abiHex);  
    if(coinTypePrefix) {
      abiHex += this.utilServ.fixedLengh(coinTypePrefix.toString(16), 56);
      abiHex += this.utilServ.fixedLengh(coinType.toString(16), 8);
    } else {
      abiHex += this.utilServ.fixedLengh(coinType.toString(16), 64);
    }
    
    // console.log('abiHex1=' + abiHex);

    const amountHex = amount.toString(16);
    // console.log('amount=' + amount);
    // console.log('amountHex=' + amountHex);
    abiHex += this.utilServ.fixedLengh(amountHex, 64);
    // console.log('abiHex2=' + abiHex);
    abiHex += this.utilServ.fixedLengh(this.utilServ.stripHexPrefix(destAddress), 64);
    // console.log('abiHex final:' + abiHex);    
    return abiHex;
  }

  getDepositFuncABI(coinType: number, txHash: string, amount: BigNumber, addressInKanban: string, signedMessage: Signature, coinTypePrefix = null) {

    // console.log('params for getDepositFuncABI:');
    // console.log('coinType=' + coinType + ',txHash=' + txHash + ',amount=' + amount + ',addressInKanban=' + addressInKanban);
    // console.log('signedMessage=', signedMessage);
    const web3 = this.getWeb3Provider();
    const func: any = {
      'constant': false,
      'inputs': [
        {
          'name': '_coinType',
          'type': 'uint32'
        },
        {
          'name': '',
          'type': 'bytes32'
        },
        {
          'name': '_value',
          'type': 'uint256'
        },
        {
          'name': '_addressInKanban',
          'type': 'address'
        },
        {
          'name': '',
          'type': 'bytes32'
        },
        {
          'name': '',
          'type': 'bytes32'
        }
      ],
      'name': 'deposit',
      'outputs': [
        {
          'name': 'success',
          'type': 'bool'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    };
    //let abiHex = this.utilServ.stripHexPrefix(web3.eth.abi.encodeFunctionSignature(func));
    // console.log('abiHex for addDeposit=', abiHex);
    let abiHex = '379eb862';
    abiHex += this.utilServ.stripHexPrefix(signedMessage.v);
    if(!coinTypePrefix) {
      abiHex += this.utilServ.fixedLengh(coinType.toString(16), 62);
    } else {
      abiHex += this.utilServ.fixedLengh(coinTypePrefix.toString(16), 54);
      abiHex += this.utilServ.fixedLengh(coinType.toString(16), 8);
    }
    
    abiHex += this.utilServ.stripHexPrefix(txHash);
    const amountHex = amount.toString(16);
    console.log('amountHex=', this.utilServ.fixedLengh(amountHex, 64));
    abiHex += this.utilServ.fixedLengh(amountHex, 64);
    abiHex += this.utilServ.fixedLengh(this.utilServ.stripHexPrefix(addressInKanban), 64);
    abiHex += this.utilServ.stripHexPrefix(signedMessage.r);
    abiHex += this.utilServ.stripHexPrefix(signedMessage.s);

    return abiHex;

  }
}
