import type { ApiRx } from '@polkadot/api'
import { formatAdData } from './tools'

class CallAdMeta {
	sender: string
	api: ApiRx

	constructor(sender: string, api: ApiRx) {
		this.sender = sender
		this.api = api
	}

	private tx() {
		if (!this.api) return null

		return this.api.tx
	}

	private qu() {
		if (!this.api) return null

		return this.api.query
	}

	// get user ads
	async getUserAds(user: string) {
		return new Promise((resolve, reject) => {
			this.qu()
				?.ad.impressionAds.entries(user)
				.subscribe((c: any) => {

					if (c.toString()) {
						const d = formatAdData(c)
						resolve({ info: d })
					} else {
						resolve({ info: [] })
					}
				})
		})
	}

}

export default CallAdMeta
