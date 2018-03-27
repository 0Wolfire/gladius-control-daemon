/***********************
 *  Pool Approve Node  *
 ***********************/

let poolJSON = require('../contract_abi/Pool.json')
let poolABI = poolJSON.abi
let kbpgp = require('kbpgp')

let Node = require('./Node.js')

class Pool {
  constructor(address) {
    this.web3 = global.web3
    this.address = address
    this.contract = new web3.eth.Contract(poolABI, address)
    this.wallet = this.web3.eth.accounts.wallet[0]
  }

  publicData(newData = null, callback) {
    let self = this

    if (newData) {
      let stringifiedData = JSON.stringify(newData)

      self.contract.methods.setPublicData(stringifiedData).estimateGas({ from: self.wallet.address })
        .then(function(gasAmount) {
          console.log(gasAmount)
          self.contract.methods.setPublicData(stringifiedData).send({ from: self.wallet.address, gas: gasAmount }, function(error, response) {
            console.log(error)
            console.log(response)
            callback(error, response)
          })
        })
    } else {
      // retrieve data
      this.contract.methods.publicData().call(function(error, response) {
        if (response) {
          console.log(response)
          let parsedResponse = JSON.parse(response)
          if (parsedResponse) {
            callback(error, parsedResponse)
          } else {
            callback(error, response)
          }
        } else {
          callback(error, '')
        }
      })
    }
  }

  publicKey(callback) {
    this.contract.methods.publicKey().call(callback)
  }

  // Adds Node to the Approved list
  nodesApproveRequest() {}

  nodes(callback) {
    let self = this
    self.contract.methods.getNodeList().call({ from: self.wallet.address }, callback)
  }

  nodesWithData(callback) {
    let self = this
    self.nodes(function(error, nodeAddresses) {
      let nodes = []
      let nodeDataArray = []
      let completed = 0

      if (nodeAddresses.length == 0) {
        callback(null, [])
      }

      for (let nodeAddress of nodeAddresses) {
        let node = new Node(nodeAddress)
        node.poolData(self.address, function(error, nodeData) {
          let encryptedData = JSON.parse(nodeData)

          let ring = new kbpgp.keyring.KeyRing
          ring.add_key_manager(global.account)

          kbpgp.unbox({keyfetch: ring, armored: encryptedData }, function(err, literals) {
            if (err != null) {
              return console.log("Problem: " + err)
            } else {
              console.log(JSON.parse(literals[0].toString()))
            }
          })

          nodeDataArray.push({ address: nodeAddress, data: JSON.parse(nodeData) })
          completed++

          if (completed == nodeAddresses.length) {
            callback(null, nodeDataArray)
          }
        })
      }
    })
  }

  // Returns all Approved Nodes
  nodesStatusApproved() {}

  // Returns all Denied Nodes
  nodesStatusDenied() {}

  // Returns all Pending Nodes
  nodesStatusPending() {}
}

module.exports = Pool
