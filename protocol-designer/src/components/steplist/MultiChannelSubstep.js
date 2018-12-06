// @flow
import * as React from 'react'
import cx from 'classnames'

import {Icon} from '@opentrons/components'
import {PDListItem} from '../lists'
import SubstepRow from './SubstepRow'
import styles from './StepItem.css'
import {formatVolume} from './utils'

import type {StepItemSourceDestRow, WellIngredientNames} from '../../steplist/types'

const DEFAULT_COLLAPSED_STATE = true

type MultiChannelSubstepProps = {|
  rowGroup: Array<StepItemSourceDestRow>,
  ingredNames: WellIngredientNames,
  highlighted?: boolean,
  onMouseEnter?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed,
|}

type MultiChannelSubstepState = {
  collapsed: boolean,
}

export default class MultiChannelSubstep extends React.Component<MultiChannelSubstepProps, MultiChannelSubstepState> {
  state = {collapsed: DEFAULT_COLLAPSED_STATE}

  handleToggleCollapsed = () => {
    this.setState({collapsed: !this.state.collapsed})
  }

  render () {
    const {rowGroup, highlighted} = this.props
    const {collapsed} = this.state

    // NOTE: need verbose null check for flow to be happy
    const firstChannelSource = rowGroup[0].source
    const lastChannelSource = rowGroup[rowGroup.length - 1].source
    const sourceWellRange = `${firstChannelSource ? firstChannelSource.well : ''}:${lastChannelSource ? lastChannelSource.well : ''}`
    const firstChannelDest = rowGroup[0].dest
    const lastChannelDest = rowGroup[rowGroup.length - 1].dest
    const destWellRange = `${firstChannelDest ? firstChannelDest.well : ''}:${lastChannelDest ? lastChannelDest.well : ''}`
    return (
      <ol
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        className={cx({[styles.highlighted]: highlighted})} >

        {/* Header row */}
        <PDListItem
          border
          className={cx(styles.step_subitem, {[styles.clear_border]: highlighted})}>
          <span className={styles.multi_substep_header}>multi</span>
          <span className={styles.emphasized_cell}>{firstChannelSource ? sourceWellRange : ''}</span>
          <span className={styles.volume_cell}>{`${formatVolume(rowGroup[0].volume)} μL`}</span>
          <span className={styles.emphasized_cell}>{firstChannelDest ? destWellRange : ''}</span>
          <span className={styles.inner_carat} onClick={this.handleToggleCollapsed}>
            <Icon name={collapsed ? 'chevron-up' : 'chevron-down'} />
          </span>
        </PDListItem>

        {!collapsed && rowGroup.map((row, rowKey) => {
          // Channel rows (1 for each channel in multi-channel pipette
          return (
            <SubstepRow
              key={rowKey}
              className={styles.step_subitem_channel_row}
              volume={row.volume}
              ingredNames={this.props.ingredNames}
              source={row.source}
              dest={row.dest}
            />
          )
        }
        )}
      </ol>
    )
  }
}
