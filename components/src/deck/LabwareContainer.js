// @flow
import * as React from 'react'
import {SLOT_RENDER_HEIGHT, SLOT_RENDER_WIDTH} from '@opentrons/shared-data'
import styles from './LabwareContainer.css'

const defs = {roundSlotClipPath: 'roundSlotClipPath'} // TODO: import these defs instead of hard-coding in applications? Or should they be passed to children?

type Props = {
  x?: number,
  y?: number,
  height?: number,
  width?: number,
  highlighted?: boolean,
  children?: React.Node,
}

export default function LabwareContainer (props: Props) {
  const {x, y, highlighted, children} = props
  const height = props.height || SLOT_RENDER_HEIGHT
  const width = props.width || SLOT_RENDER_WIDTH

  return (
    <g>
      <svg {...{x, y, height, width}} className={styles.deck_slot}>
        {/* Defs for anything inside this SVG. TODO: how to better organize IDs and defined elements? */}
        <defs>
          <clipPath id={defs.roundSlotClipPath}>
            <rect rx='6' width='100%' height='100%' />
          </clipPath>
        </defs>
        {children}
      </svg>
      {/* Highlight border goes outside the SVG so it doesn't get clipped... */}
      {highlighted &&
        <rect className={styles.highlighted}
          x='0.5' y='0.5' width={width - 1} height={height - 1} rx='6' />}
    </g>
  )
}
