/**
 * Link Toolbar Items View
 *
 * Presentational component for Link Toolbar Items.
 * Same pattern as YoutubeToolbarItemsView.
 */

'use client';

import React from 'react';

import { CopyLinkToolbarItem } from './components/copy-link-toolbar-item';
import { OpenLinkToolbarItem } from './components/open-link-toolbar-item';

export interface LinkToolbarItemsViewProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled: boolean;
}

export function LinkToolbarItemsView({
  blockId,
  blockMountId,
  url,
  disabled,
}: LinkToolbarItemsViewProps) {
  return (
    <>
      <OpenLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={url}
        disabled={disabled || !url}
      />
      <CopyLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={url}
        disabled={disabled || !url}
      />
    </>
  );
}
