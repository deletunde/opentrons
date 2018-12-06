// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../../types'
import type {RootState} from '../reducers'

export const rootSelector = (state: BaseState): RootState => state.fileData

export const getCurrentProtocolExists = createSelector(
  rootSelector,
  (rootState) => rootState.currentProtocolExists
)

export const protocolName = createSelector(rootSelector, state => state.fileMetadata['protocol-name'])
export const getFileMetadata = createSelector(
  rootSelector,
  state => state.fileMetadata
)
