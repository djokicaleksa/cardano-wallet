import * as _ from 'lodash'

export const orderTokenBundle = (tokenBundle) => {
    const compareStringsCanonically = (string1: string, string2: string) =>
      string1.length - string2.length || string1.localeCompare(string2)
    return _(tokenBundle)
      .orderBy(['policyId', 'assetName'], ['asc', 'asc'])
      .groupBy(({policyId}) => policyId)
      .mapValues((tokens) => tokens.map(({assetName, quantity}) => ({assetName, quantity})))
      .map((tokens, policyId) => ({
        policyId,
        assets: tokens.sort((token1, token2) =>
          compareStringsCanonically(token1.assetName, token2.assetName)
        ),
      }))
      .sort((token1, token2) => compareStringsCanonically(token1.policyId, token2.policyId))
      .value()
  }
  