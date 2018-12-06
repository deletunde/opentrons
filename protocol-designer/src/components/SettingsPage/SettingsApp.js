// @flow
import React from 'react'
import {connect} from 'react-redux'
import i18n from '../../localization'
import {Card, OutlineButton, ToggleButton} from '@opentrons/components'
import styles from './SettingsPage.css'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import {
  actions as tutorialActions,
  selectors as tutorialSelectors,
} from '../../tutorial'
import type {BaseState} from '../../types'

type Props = {
  canClearHintDismissals: boolean,
  hasOptedIn: boolean | null,
  restoreHints: () => mixed,
  toggleOptedIn: () => mixed,
}

type SP = {
  canClearHintDismissals: $PropertyType<Props, 'canClearHintDismissals'>,
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
}

function SettingsApp (props: Props) {
  const {canClearHintDismissals, hasOptedIn, restoreHints, toggleOptedIn} = props
  return (
    <div className={styles.card_wrapper}>
      <Card title={i18n.t('card.title.hints')}>
        <div className={styles.body_wrapper}>
          <div className={styles.card_body}>
            {i18n.t('card.body.restore_hints')}
            <OutlineButton
              className={styles.button}
              disabled={!canClearHintDismissals}
              onClick={restoreHints}
            >
              {canClearHintDismissals ? i18n.t('button.restore') : i18n.t('button.restored') }
            </OutlineButton>
          </div>
        </div>
      </Card>
      <Card title={i18n.t('card.title.privacy')}>
        <div className={styles.toggle_row}>
          <p className={styles.toggle_label}>{i18n.t('card.toggle.share_session')}</p>
          <ToggleButton
            className={styles.toggle_button}
            toggledOn={Boolean(hasOptedIn)}
            onClick={toggleOptedIn} />
        </div>
        <div className={styles.body_wrapper}>
          <p className={styles.card_body}>{i18n.t('card.body.reason_for_collecting_data')}</p>
          <ul className={styles.card_point_list}>
            <li>{i18n.t('card.body.data_collected_is_internal')}</li>
            {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
            <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  return {
    hasOptedIn: analyticsSelectors.getHasOptedIn(state),
    canClearHintDismissals: tutorialSelectors.getCanClearHintDismissals(state),
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {dispatch} = dispatchProps
  const {hasOptedIn} = stateProps

  const _toggleOptedIn = hasOptedIn
    ? analyticsActions.optOut
    : analyticsActions.optIn
  return {
    ...stateProps,
    toggleOptedIn: () => dispatch(_toggleOptedIn()),
    restoreHints: () => dispatch(tutorialActions.clearAllHintDismissals()),
  }
}

export default connect(mapStateToProps, null, mergeProps)(SettingsApp)
