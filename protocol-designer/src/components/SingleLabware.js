// @flow
import * as React from 'react'
import cx from 'classnames'
import {SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT} from '@opentrons/shared-data'
import styles from './SingleLabware.css'

type Props = {
  className?: string,
  children?: React.Node,
  showLabels?: boolean,
}
export const LABEL_OFFSET = 8

/** Simply wraps SVG components like Plate/SelectableLabware with correct dimensions */
export default function SingleLabware (props: Props) {
  const {children, className, showLabels = false} = props
  const minX = showLabels ? -LABEL_OFFSET : 0
  const minY = showLabels ? -LABEL_OFFSET : 0
  const width = showLabels ? SLOT_RENDER_WIDTH + LABEL_OFFSET : SLOT_RENDER_WIDTH
  const height = showLabels ? SLOT_RENDER_HEIGHT + LABEL_OFFSET : SLOT_RENDER_HEIGHT
  return (
    <div className={cx(styles.single_labware, className)}>
      <svg viewBox={`${minX} ${minY} ${width} ${height}`}>
        {children}
      </svg>
    </div>
  )
}
