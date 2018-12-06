// @flow
import * as React from 'react'
import cx from 'classnames'
import ConnectedMoreOptionsModal from '../containers/ConnectedMoreOptionsModal'
import ConnectedNav from '../containers/ConnectedNav'
import ConnectedSidebar from '../containers/ConnectedSidebar'
import ConnectedTitleBar from '../containers/ConnectedTitleBar'
import ConnectedMainPanel from '../containers/ConnectedMainPanel'
import ConnectedNewFileModal from '../containers/ConnectedNewFileModal'
import FileUploadErrorModal from './modals/FileUploadErrorModal'
import AnalyticsModal from './modals/AnalyticsModal'
import {PortalRoot as MainPageModalPortalRoot} from '../components/portals/MainPageModalPortal'
import {PortalRoot as TopPortalRoot} from './portals/TopPortal'
import {SCROLL_ON_SELECT_STEP_CLASSNAME} from '../steplist/actions'
import styles from './ProtocolEditor.css'

const SelectorDebugger = process.env.NODE_ENV === 'development'
  ? require('../containers/SelectorDebugger').default
  : () => null

export default function ProtocolEditor () {
  return (
    <div>
      <SelectorDebugger />
      <TopPortalRoot />
      <div className={styles.wrapper}>
        <ConnectedNav />
        <ConnectedSidebar />
        <div className={cx(styles.main_page_wrapper, SCROLL_ON_SELECT_STEP_CLASSNAME)}>
          <ConnectedTitleBar />

          <div className={styles.main_page_content}>
            <AnalyticsModal />
            <ConnectedNewFileModal />
            <ConnectedMoreOptionsModal />
            <FileUploadErrorModal />
            {/* TODO: Ian 2018-06-28 All main page modals will go here */}
            <MainPageModalPortalRoot />

            <ConnectedMainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
