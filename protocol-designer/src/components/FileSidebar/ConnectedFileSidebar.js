// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import i18n from '../../localization'
import {actions, selectors} from '../../navigation'
import {selectors as fileDataSelectors} from '../../file-data'
import {actions as loadFileActions, selectors as loadFileSelectors} from '../../load-file'
import FileSidebar from './FileSidebar'
import type {BaseState, ThunkDispatch} from '../../types'

type Props = React.ElementProps<typeof FileSidebar>

type SP = {
  downloadData: $PropertyType<Props, 'downloadData'>,
}

type MP = {
  _canCreateNew: ?boolean,
  _hasUnsavedChanges: ?boolean,
}

export default connect(mapStateToProps, null, mergeProps)(FileSidebar)

function mapStateToProps (state: BaseState): SP & MP {
  const protocolName = fileDataSelectors.getFileMetadata(state)['protocol-name'] || 'untitled'
  const fileData = fileDataSelectors.createFile(state)
  const canDownload = selectors.getCurrentPage(state) !== 'file-splash'

  return {
    downloadData: (canDownload)
      ? {
        fileContents: JSON.stringify(fileData, null, 4),
        fileName: protocolName + '.json',
      }
      : null,
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
  }
}

function mergeProps (stateProps: SP & MP, dispatchProps: {dispatch: ThunkDispatch<*>}): Props {
  const {_canCreateNew, _hasUnsavedChanges, downloadData} = stateProps
  const {dispatch} = dispatchProps
  return {
    downloadData,
    loadFile: (fileChangeEvent) => {
      if (!_hasUnsavedChanges || window.confirm(i18n.t('alert.window.confirm_import'))) {
        dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
      }
    },
    createNewFile: _canCreateNew ? () => dispatch(actions.toggleNewProtocolModal(true)) : undefined,
    onDownload: () => dispatch(loadFileActions.saveProtocolFile()),
  }
}
