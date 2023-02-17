import {useContext, useEffect, useState, useMemo} from 'react'
import {SubsocialContext} from './subsocial/provider'
import polkadotjs from './subsocial/wallets/polkadotjs'
import {IpfsContent} from '@subsocial/api/substrate/wrappers'
import {SpaceData} from '@subsocial/api/types'
import {CustomNetwork, Mainnet, Testnet} from './subsocial/config'
import './App.css'
import Chip from './components/Chip'
import useApi from './hooks/use-api';
import {polkadot_network} from './utils/constant';
import CallAdMeta from "./utils/call-admeta";
import {Spin} from 'antd';

import Button from "./components/Button";

interface PostInfo {
  image: string,
  link: string,
  tags: string[],
  summary: string,
  title?: string,
}

interface AdInfo {
  amount: number
  bond?: number
  cpi: number
  endBlock: number
  approved?: boolean
  metadata: string
  target: string
  title: string
  preference: any
  proposer?: string
}

const testInfo: PostInfo = {
  image: '',
  summary: 'A Test Recommendation',
  link: '',
  tags: []
}


// This is the start of the React app built using Subsocial Starter.
export default function App() {
  // SubsocialContext can be used using useContext hook and it provides
  // access to the [api] module i.e. SubsocialApi and other methods like
  // changeNetwork (changing from testnet(default) to mainnet/localnet).
  // It also gives you access to getters like [isReady] that helps you know [api]
  // initlaization status.
  const {isReady, api, network, changeNetwork} = useContext(SubsocialContext)
  const [space, setSpace] = useState<SpaceData>()
  const [postInfo, setPostInfo] = useState<PostInfo>({image: '', link: '', summary: '', tags: []})
  const [textValue, setTextValue] = useState<string>()
  const {adApi} = useApi(polkadot_network)
  const _api = useMemo(() => adApi, [adApi])
  const [match, setMatch] = useState(false)
  const [spin, setSpin] = useState(false)
  const [address, setAddress] = useState<string>(localStorage.getItem('_select_account') || '')

  const [postList, setPostList] = useState<any[]>([])

  useEffect(() => {
    console.log(`Is API ready: ${isReady}`)
  }, [isReady, api])

  // Maps the network to the network name string.
  const getNetworkName = (network: CustomNetwork) => {
    if (network === Testnet) return 'Testnet'
    if (network === Mainnet) return 'Mainnet'
    return 'Custom Network'
  }

  const toggleNetwork = async () => {
    if (network === Testnet) {
      changeNetwork(Mainnet)
    } else {
      changeNetwork(Testnet)
    }
  }

  const getAdMetaAd = () => {
    const sender = '5FumNjmQzxBF5Zs6WYeS3QwVuUxbzWvoZyqENMNiGu1Vksym'
    const pk = new CallAdMeta(sender, _api!)
    pk.getUserAds(sender).then((d: any) => {

      const list = d.info as AdInfo[];
      console.log(list)
      setSpin(false)
      setPostInfo({
        title: list[0].title,
        image: list[0].metadata,
        summary: list[0].title,
        link: list[0].target,
        tags: list[0].preference.tags
      })
    })
  }


  const createNewPost = async () => {
    if (!isReady) {
      console.log({message: 'Unable to connect to the API.'})
      return
    }
    const cid = await api!.ipfs.saveContent({
      title: postInfo.title,
      image: postInfo.image,
      tags: postInfo.tags,
      body: postInfo.summary
    })

    console.log({
      title: postInfo.title,
      image: postInfo.image,
      tags: postInfo.tags,
      body: postInfo.summary
    })

    const substrateApi = await api!.blockchain.api
    const accounts = await polkadotjs.getAllAccounts()
    setAddress(accounts[0].address)
    const spaceTransaction = substrateApi.tx.posts.createPost('1', {RegularPost: null}, IpfsContent(cid))
    if (accounts.length > 0) {
      await polkadotjs.signAndSendTx(spaceTransaction, accounts[0].address)
      // @ts-ignore
      // fetchPost(cid)
      setPostList([...postList, {
        title: postInfo.title,
        image: postInfo.image,
        tags: postInfo.tags,
        summary: postInfo.summary,
        link: postInfo.link
      }])
    }
  }

  const fetchPost = async (id: string = '1') => {
    if (!isReady) {
      console.log({message: 'Unable to connect to the API.'})
      return
    }
    const a = await api!.findPost({id})

    setPostList([...postList, a?.content])
  }


  // @ts-ignore
  // @ts-ignore
  return (
    <main>
      <Spin spinning={spin}>
        <div className='header'>
          <h1 className='title left'>AdMeta Subsocial</h1>
          <div className='connection right'>
            You are{' '}
            {isReady ? (
              <Chip className='connection-chip' size='small' color='green'>
                connected
              </Chip>
            ) : (
              <Chip className='connection-chip' size='small' color='blue'>
                connecting
              </Chip>
            )}{' '}
            to Subsocial's {getNetworkName(network)}
            {' ---- '}
            Address:
            {address}
          </div>
        </div>
        <p style={{color: '#000', paddingTop: 100, fontSize: 20, marginBottom: 20, fontWeight: 'bold'}}>
          AdMeta Subsocial will quickly create post templates for you.
        </p>
        <div className="post-edit">
          <div className="post-box">
            {
              match
                ?
                <>
                  <div style={{marginBottom: 10}}>{textValue}<br/>--------<br/>{postInfo.summary}<a
                    href={postInfo.link}> {postInfo.link}</a></div>
                  <img src={postInfo.image} className='post-img' alt=""/>
                  {
                    postInfo.tags && postInfo.tags.length
                    &&
                      <div className='post-tags' style={{marginBottom: 10}}>
                        {
                          postInfo.tags.map((t: any, i: any) => (
                            <div key={i}>{t}</div>
                          ))
                        }
                      </div>
                  }
                </>
                :
                <>
                <textarea
                  name=""
                  className="post-text"
                  value={textValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTextValue(v)
                    const r = new RegExp(/@admeta/g)
                    if (r.test(v)) {
                      setMatch(true)
                      setSpin(true)
                      getAdMetaAd()
                    } else {
                      setMatch(false)
                    }
                  }}
                ></textarea>
                  {
                    postInfo.image
                    &&
                      <img src={postInfo.image} className='post-img' alt=""/>
                  }
                </>
            }


          </div>

        </div>

        <div className='button-container'>
          <Button
            onClick={fetchPost}
            title='Get Post'
            loadingText='Sending...'
          />
          <Button
            onClick={createNewPost}
            title='Create Post'
            loadingText='Loading...'
          />
        </div>

        <div className='post-list'>
          <div className='post-list-title'>Subscribing to published posts</div>
          {
            postList.map((item, index) => (
              <div className='post-item' key={index}>
                <div className='post-name'>{item.title}</div>
                {
                  item.image
                  &&
                    <div className='post-imgs'>
                        <img src={item.image.includes('http') ? item.image : `https://ipfs.io/ipfs/${item.image}`}
                             alt=""/>
                    </div>
                }

                <div className='post-summary'>{item.summary}</div>
                <div className='post-links'><a target='_blank' href={item.link}>{item.link}</a></div>
                {
                  item.tags && item.tags.length
                  &&
                    <div className='post-tags'>
                      {
                        item.tags.map((t: any, i: any) => (
                          <div key={i}>{t}</div>
                        ))
                      }
                    </div>
                }

              </div>
            ))
          }

        </div>
      </Spin>
    </main>
  )
}
