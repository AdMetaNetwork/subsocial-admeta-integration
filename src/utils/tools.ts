import {hexToString} from '@polkadot/util'

export function formatAdData(c: any[]) {
  let arr: any[] = []
  c.forEach(item => {
    arr.push(item[1])
  })
  arr.forEach(item => {
    item = item.toString()
  })

  let a: any[] = JSON.parse(`[${arr.toString()}]`)
  a.forEach(item => {
    item.target = hexToString(item.target)
    item.metadata = hexToString(item.metadata)
    item.title = hexToString(item.title)
  })

  return a
}

interface Meta {
  genesisHash: string
  name: string
  source: string
}

interface Wallet {
  address: string
  meta: Meta
  type: string
}

export const connectWallet = async () => {
  if (typeof window !== 'undefined') {
    const {web3Enable, web3Accounts} = await import(
      '@polkadot/extension-dapp'
      )
    const extensions = await web3Enable('admeta')
    if (extensions.length === 0) {
      console.log('No extension found')
      return
    }
    const allAccounts = (await web3Accounts()) as Wallet[]
    localStorage.setItem('_select_account', allAccounts[0].address)
  }
}
