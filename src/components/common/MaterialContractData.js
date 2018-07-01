import { drizzleConnect } from 'drizzle-react'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import CircularProgress from 'material-ui/Progress/CircularProgress'
import Typography from 'material-ui/Typography'

/*
 * Create component.
 */

class ContractData extends Component {
  constructor(props, context) {
    super(props)

    this.contracts = context.drizzle.contracts
    this.methodArgs = this.methodArgs ? this.methodArgs : []

    // Get the contract ABI
    const abi = this.contracts[this.props.contract].abi

    this.updateCachedProps(this.props)
    this.updateDataKey()

    // Iterate over abi for correct function.
    for (let i = 0; i < abi.length; i++) {
      if (abi[i].name === this.props.method) {
        this.fnABI = abi[i]

        break
      }
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.didPropsChanged(nextProps)) {
      this.updateCachedProps(nextProps)
      this.updateDataKey()
    }
  }

  didPropsChanged(newProps) {
    const nextMethodArgs = newProps.methodArgs ? newProps.methodArgs : []

    if (this.methodArgs.length !== nextMethodArgs.length) {
      return true
    }

    for (let i = 0; i < this.methodArgs.length; i++) {
      if (this.methodArgs[i] !== nextMethodArgs[i]) {
        return true
      }
    }

    return (
      this.contract !== newProps.contract || this.method !== newProps.method
    )
  }

  updateCachedProps(newProps) {
    this.contract = newProps.contract
    this.method = newProps.method
    this.methodArgs = newProps.methodArgs ? newProps.methodArgs : []
  }

  updateDataKey() {
    this.dataKey = this.contracts[this.contract].methods[this.method].cacheCall(
      ...this.methodArgs
    )
  }

  render() {
    // Contract is not yet intialized.
    if (!this.props.contracts[this.props.contract].initialized) {
      return <Typography>{'Initializing...'}</Typography>
    }

    // If the cache key we received earlier isn't in the store yet; the initial value is still being fetched.
    if (
      !(
        this.dataKey in
        this.props.contracts[this.props.contract][this.props.method]
      )
    ) {
      return <Typography>{'Fetching...'}</Typography>
    }

    // Show a loading spinner for future updates.
    let pendingSpinner = this.props.contracts[this.props.contract].synced ? (
      ''
    ) : (
      <span>
        {' '}
        <CircularProgress color="secondary" size={20} />
      </span>
    )

    // Optionally hide loading spinner (EX: ERC20 token symbol).
    if (this.props.hideIndicator) {
      pendingSpinner = ''
    }

    let displayData = this.props.contracts[this.props.contract][
      this.props.method
    ][this.dataKey].value

    // Optionally convert to UTF8
    if (this.props.toUtf8) {
      displayData = this.context.drizzle.web3.utils.hexToUtf8(displayData)
    }

    // Optionally convert to Ascii
    if (this.props.toAscii) {
      displayData = this.context.drizzle.web3.utils.hexToAscii(displayData)
    }

    // If return value is an array
    if (Array.isArray(displayData)) {
      const displayListItems = displayData.map(datum => (
        <li key={datum}>
          {datum}
          {pendingSpinner}
        </li>
      ))

      return <ul>{displayListItems}</ul>
    }

    // If retun value is an object
    if (typeof displayData === 'object') {
      let i = 0
      const displayObjectProps = []

      Object.keys(displayData).forEach(key => {
        if (i != key) {
          displayObjectProps.push(
            <li key={i}>
              <strong>{key}</strong>
              {pendingSpinner}
              <br />
              {displayData[key]}
            </li>
          )
        }

        i++
      })

      return <ul>{displayObjectProps}</ul>
    }

    return (
      <span>
        {displayData}
        {pendingSpinner}
      </span>
    )
  }
}

ContractData.contextTypes = {
  drizzle: PropTypes.object
}

/*
 * Export connected component.
 */

const mapStateToProps = state => {
  return {
    contracts: state.contracts
  }
}

export default drizzleConnect(ContractData, mapStateToProps)
